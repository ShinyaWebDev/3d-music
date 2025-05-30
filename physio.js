let video, bodyPose, connections;
let poses = [];
let container;
let playButton;
let amp, music;
let renderStyle = "bubble"; // default

const BASE_RADIUS = 0.04;
const PULSE_SCALE = 0.6;

function preload() {
  bodyPose = ml5.bodyPose("BlazePose");
  music = loadSound("music/beat.mp3");
}

function setup() {
  const canvasW = windowWidth;
  const canvasH = windowHeight;

  // 3-D canvas for the skeleton
  const canvas = createCanvas(canvasW, canvasH, WEBGL);
  canvas.parent("p5-container");
  document
    .getElementById("style-select")
    .addEventListener("change", (e) => (renderStyle = e.target.value));

  // webcam (now floats in its own div)
  video = createCapture(VIDEO, () => {
    const vc = document.getElementById("video-container");
    video.size(320, 240);
    // video.hide();   // remove or keep, but ALWAYS call video.show() afterwards
    vc.appendChild(video.elt);
    video.show(); // ensure it’s visible
  });

  // rest of your original init…
  playButton = createButton("▶");
  playButton.parent("p5-container");
  playButton.class("video-play-btn");
  playButton.mousePressed(toggleMusic);

  bodyPose.detectStart(video, (results) => (poses = results));
  connections = bodyPose.getSkeleton();

  amp = new p5.Amplitude();
  amp.setInput(music);
  amp.smooth(0.8);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  resetMatrix();
  const level = amp.getLevel();

  lights();
  ambientLight(80);
  pointLight(255, 255, 255, 0, -2, 1);

  scale(height / 2);
  // scale(-1, 1, 1);
  background(map(level, 0, 0.4, 10, 60));

  const ORBIT_SENS = 5.2;

  //   orbitControl();
  orbitControl(ORBIT_SENS, ORBIT_SENS, 0.4);

  if (!poses.length) return;
  const pts = poses[0].keypoints3D;

  push(); // start local transform
  scale(-1, 1, 1);

  // pop();
  //     }
  /* --------------  DRAW SKELETON -------------- */
  switch (renderStyle) {
    case "stick":
      drawStick(pts, level);
      break;
    case "point":
      drawPointCloud(pts, level);
      break;
    case "cylinder":
      drawCylinderBones(pts, level);
      break;
    default:
      drawBubble(pts, level);
  }
  pop();

  /* ------------------------------------------- */
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

function drawBubble(pts, level) {
  // radius still pulses with the music
  const radius = BASE_RADIUS + level * PULSE_SCALE;

  /* ---------- bones ---------- */
  stroke(130, 220, 255); // pale blue
  strokeWeight(2);
  for (const [ai, bi] of connections) line3D(pts[ai], pts[bi]);

  /* ---------- joints ---------- */
  // the “brightness” (blue-ish) goes 80-->255 as level rises
  const blueVal = map(level, 0, 0.4, 180, 255); // light cyan → bright cyan
  const alpha = 200; // semi-transparent

  noStroke();
  fill(0, blueVal * 0.7, blueVal, alpha); // 0-G-B-A   (slightly teal)

  for (const k of pts) if (k.confidence > 0.1) sphereAt(k, radius);
}

function drawStick(pts, level) {
  const pulse = map(level, 0, 0.4, 2, 8); // 2 → 8 px
  const glow = map(level, 0, 0.4, 120, 255); // cyan brightness

  stroke(0, glow, 255);
  strokeWeight(pulse);
  noFill();
  for (const [ai, bi] of connections) line3D(pts[ai], pts[bi]);
}

function drawPointCloud(pts, level) {
  const r = BASE_RADIUS * map(level, 0, 0.4, 0.4, 1.1); // bubble-size pulse
  const alp = map(level, 0, 0.4, 150, 255); // alpha pulse

  noStroke();
  fill(0, 180, 255, alp);
  for (const k of pts) if (k.confidence > 0.1) sphereAt(k, r);
}

function drawCylinderBones(pts, level) {
  const jointR = BASE_RADIUS * 0.8 * map(level, 0, 0.4, 0.9, 1.3);
  const jointHue = map(level, 0, 0.4, 150, 255); // cyan-pink shift
  const boneR = jointR * 0.4; // bone thickness

  /* joints */
  noStroke();
  fill(255, 100, jointHue, 200);
  for (const k of pts) if (k.confidence > 0.1) sphereAt(k, jointR);

  /* bones */
  fill(80, 200, 255);
  noStroke();
  for (const [ai, bi] of connections) {
    const A = pts[ai],
      B = pts[bi];
    if (A.confidence < 0.1 || B.confidence < 0.1) continue;

    push();
    translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    const v = createVector(B.x - A.x, B.y - A.y, B.z - A.z);
    const len = v.mag();
    const axis = createVector(0, -1, 0).cross(v).normalize();
    const angle = acos(v.y / len);
    rotate(angle, axis);
    cylinder(boneR, len);
    pop();
  }
}

/* ---------- small utility helpers ---------- */
function sphereAt(pt, r) {
  push();
  translate(pt.x, pt.y, pt.z);
  sphere(r);
  pop();
}

function line3D(A, B) {
  if (A.confidence < 0.1 || B.confidence < 0.1) return;
  line(A.x, A.y, A.z, B.x, B.y, B.z);
}
