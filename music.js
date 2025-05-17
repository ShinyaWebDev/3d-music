// 3‑D Pose + Audio‑Pulse Skeleton
// – Chime in by Shinya & ChatGPT –

// ───────────────── globals ─────────────────
let video, bodyPose, connections, vidH, vidW;
let poses = [];
let container;
let playButton;
let videoX = 20,
  videoY = 20;
let draggingVideo = false;
let offsetX = 0,
  offsetY = 0;

// audio
let music, amp; // p5.Sound objects

// joint visuals
const BASE_RADIUS = 0.04; // meters (smallest sphere)
const PULSE_SCALE = 0.6; // how much louder sound enlarges joints

// ───────────────── preload ─────────────────
function preload() {
  // BlazePose model
  bodyPose = ml5.bodyPose("BlazePose");

  // 🎵 load a track (replace with your own file or URL)
  // e.g. put beat.mp3 in an assets folder and use 'assets/beat.mp3'
  music = loadSound("music/beat.mp3");
}

// ───────────────── setup ─────────────────
function setup() {
  // Fill 90% of viewport
  const canvasW = Math.floor(windowWidth * 1.0);
  const canvasH = Math.floor(windowHeight * 1.0);

  // Small video size (overlay only)
  vidW = canvasW * 0.3;
  vidH = vidW * (3 / 4);

  // Create container
  container = createDiv()
    .style("display", "flex")
    .style("gap", "8px")
    .style("flexWrap", "wrap");

  let canvas = createCanvas(canvasW, canvasH, WEBGL).parent(container);
  container.id("canvas-container");

  // webcam
  video = createCapture(VIDEO);
  video.size(vidW, vidH);
  video.hide(); // overlayed inside canvas only

  // Play/Pause button
  playButton = createButton("▶");
  playButton.parent("canvas-container");
  playButton.class("video-play-btn");
  playButton.mousePressed(toggleMusic);

  // Canvas
  createCanvas(canvasW, canvasH, WEBGL).parent(container);

  // Pose detection
  bodyPose.detectStart(video, (results) => (poses = results));
  connections = bodyPose.getSkeleton();

  // Audio analyzer
  amp = new p5.Amplitude();
  amp.setInput(music);
  amp.smooth(0.8);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Update video and canvas dimensions if necessary
  vidW = windowWidth * 0.3;
  vidH = vidW * (3 / 4);
  video.size(vidW, vidH);
}
// ───────────────── draw ─────────────────
function draw() {
  resetMatrix();
  const level = amp.getLevel(); // 0 → ~0.4

  // simple lighting
  lights();
  ambientLight(80);
  pointLight(255, 255, 255, 0, -2, 1);

  scale(height / 2); // world ≈ metres
  scale(-1, 1, 1);
  // background(0);
  const bgR = map(level, 0, 0.4, 10, 80); // dark red pulse
  const bgG = map(level, 0, 0.4, 0, 10); // slightly reactive green
  const bgB = map(level, 0, 0.4, 20, 200); // strong blue pulse

  // background(bgR, bgG, bgB);
  const brightness = map(level, 0, 0.4, 10, 60);
  background(brightness);
  push();
  resetMatrix();
  translate(-width / 2, -height / 2); // top-left corner of canvas
  translate(videoX + vidW, videoY); // account for mirror + x,y
  scale(-1, 1); // mirror video
  image(video, 0, 0, vidW, vidH);
  pop();
  orbitControl();

  if (draggingVideo) {
    const canvasX = mouseX - width / 2;
    const canvasY = mouseY - height / 2;
    videoX = canvasX - offsetX;
    videoY = canvasY - offsetY;
  }

  if (!poses.length) return;

  const pts = poses[0].keypoints3D;

  // ----- bones -----
  for (const [ai, bi] of connections) {
    const A = pts[ai],
      B = pts[bi];
    if (A.confidence > 0.1 && B.confidence > 0.1) {
      const depth = (A.z + B.z) * 0.5;
      strokeWeight(map(depth, -1, 1, 6, 1));
      stroke(map(depth, -1, 1, 255, 60), 200, 255);
      line(A.x, A.y, A.z, B.x, B.y, B.z);
    }
  }

  // ----- joints: size & colour pulse to music -----
  // const level = amp.getLevel(); // 0 → ~0.4
  const radius = BASE_RADIUS + level * PULSE_SCALE;
  const c = map(level, 0, 0.4, 80, 255); // brighter on beats

  stroke(0, 255, 200, 120);
  strokeWeight(2);
  fill(255, 0, c, 200);

  for (const k of pts)
    if (k.confidence > 0.1) {
      push();
      translate(k.x, k.y, k.z);
      sphere(radius);
      pop();
    }
}

function toggleMusic() {
  if (music.isPlaying()) {
    music.pause();
    playButton.html("▶");
  } else {
    music.loop();
    playButton.html("❚❚");
  }
}

function mousePressed() {
  // convert to canvas coords
  const canvasX = mouseX - width / 2;
  const canvasY = mouseY - height / 2;

  // Check if mouse is within the video bounds
  if (
    canvasX > videoX &&
    canvasX < videoX + vidW &&
    canvasY > videoY &&
    canvasY < videoY + vidH
  ) {
    draggingVideo = true;
    offsetX = canvasX - videoX;
    offsetY = canvasY - videoY;
  }
}

function mouseReleased() {
  draggingVideo = false;
}

// ───────────────── user interaction ─────────────────
// function mousePressed() {
//   // browsers block autoplay; one click starts or pauses music.
//   if (music.isPlaying()) {
//     music.pause();
//   } else {
//     music.loop();
//   }
// }
