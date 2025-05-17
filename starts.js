// 3D Pose Detection with BlazePose and WEBGL
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/7-bodypose/pose-detection

let video;
let bodyPose;
let connections;
let poses = [];
let angle = 0;

let stars = []; // ✨ 3D starfield
const STAR_COUNT = 400; // number of stars


// << NEW >>
let container;   // flex‑box to hold video & canvas side‑by‑side

function preload() {
    bodyPose = ml5.bodyPose('BlazePose');
}

function gotPoses(results) {
    poses = results;
}

function setup() {
    // ------------------------------------------------------------------
    // 1. Create a flex container (one line) ────────────────
    // ------------------------------------------------------------------
    container = createDiv()
        .style('display', 'flex')    // row layout
        .style('gap', '8px');        // little space between them

    // ------------------------------------------------------------------
    // 2. Video capture (unchanged apart from .parent)
    // ------------------------------------------------------------------
    video = createCapture(VIDEO);
    video.size(840, 560);
    video.loop();
    video.parent(container);       // <video> goes inside flexbox
    // video.style('transform', 'scaleX(-1)'); // optional mirror

    // ------------------------------------------------------------------
    // 3. WEBGL canvas (unchanged apart from .parent)
    // ------------------------------------------------------------------
    createCanvas(840, 560, WEBGL).parent(container);

    // 🌌 Fill the 2x2x2 cube with stars
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push([
            random(-1, 1), // x
            random(-1, 1), // y
            random(-1, 1)  // z
        ]);
    }


    // Pose detection & skeleton
    bodyPose.detectStart(video, gotPoses);
    connections = bodyPose.getSkeleton();
}

// function draw() {
//   scale(height / 2);
//   orbitControl();
//   angle += 0.02;
//   background(0);

//   if (poses.length > 0) {
//     let pose = poses[0];

//     // Draw skeleton
//     for (let i = 0; i < connections.length; i++) {
//       let [a, b] = connections[i];
//       let A = pose.keypoints3D[a];
//       let B = pose.keypoints3D[b];
//       if (A.confidence > 0.1 && B.confidence > 0.1) {
//         stroke(0, 255, 255);
//         strokeWeight(4);
//         beginShape();
//         vertex(A.x, A.y, A.z);
//         vertex(B.x, B.y, B.z);
//         endShape();
//       }
//     }

//     // Draw rotating boxes on joints
//     for (let kp of pose.keypoints3D) {
//       if (kp.confidence > 0.1) {
//         push();
//         translate(kp.x, kp.y, kp.z);
//         rotateZ(angle);
//         fill(255, 150);
//         stroke(255, 0, 255);
//         strokeWeight(1);
//         box(0.1);
//         pop();
//       }
//     }
//   }

//   // Ground plane
//   stroke(255);
//   strokeWeight(1);
//   fill(255, 100);
//   rectMode(CENTER);
//   translate(0, 1);
//   rotateX(PI / 2);
//   square(0, 0, 2);
// }

function draw() {
    resetMatrix();
    lights();               // ⭐
    ambientLight(80);
    pointLight(255, 255, 255, 0, -2, 1);

    scale(height / 2);
    orbitControl();
    background(0);

    // ✨ Draw stars in 2m³ space
    push();
    noStroke();
    for (let [x, y, z] of stars) {
        push();
        translate(x, y, z);
        fill(random(200, 255), random(180, 255), 255) // white stars
        sphere(0.01); // tiny glowing dot
        pop();
    }
    pop();


    // if (poses.length) {
    //   let pose = poses[0];
    //   for (const kp of pose.keypoints3D) {
    //     if (kp.confidence > 0.1) {
    //       push();
    //       translate(kp.x, kp.y, kp.z);
    //       specularMaterial(255, 0, 255);   // ⭐ neon spheres
    //       shininess(50);
    //       sphere(0.07);                  // ⭐
    //       pop();
    //     }
    //   }
    // }
    // ---- draw() skeleton section ----
    if (poses.length) {
        const pose = poses[0];
        const pts = pose.keypoints3D;

        // --- bones (still plain lines, but depth‑weighted) ---
        for (const [a, b] of connections) {
            const A = pts[a], B = pts[b];
            if (A.confidence > 0.1 && B.confidence > 0.1) {
                const depth = (A.z + B.z) * 0.5;
                strokeWeight(map(depth, -1, 1, 6, 1));
                stroke(map(depth, -1, 1, 255, 60), 200, 255);
                line(A.x, A.y, A.z, B.x, B.y, B.z);
            }
        }

        // --- joints (lo‑poly spheres with rim light) ---
        for (const k of pts) {
            if (k.confidence > 0.1) {
                push();
                translate(k.x, k.y, k.z);
                const depth = k.z;
                stroke(0, 255, 200, 120);          // rim
                strokeWeight(2);
                fill(255, 0, map(depth, -1, 1, 255, 80), 180);
                sphere(0.07);                      // low‑poly from sphereDetail()
                pop();
            }
        }
    }

}


function mousePressed() {
    console.log(poses);
}
