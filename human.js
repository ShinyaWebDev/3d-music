// Stylized Humanoid BlazePose – v2
// ------------------------------------------------------------
// – Uses: ml5.js (BlazePose), p5.js WEBGL
// – Renders a low‑poly mannequin inside a star‑field 2 m³ cube.
// ------------------------------------------------------------

let video, bodyPose, connections, poses = [];
let stars = [];
const STAR_COUNT = 500;

// Geometry constants (units roughly metres after scale)
const LIMB_R = 0.025;
const HEAD_R = 0.12;
const TORSO_W = 0.23;
const TORSO_H = 0.45;

function preload() {
    bodyPose = ml5.bodyPose('BlazePose');
}

function setup() {
    const ui = createDiv().style('display', 'flex').style('gap', '8px');
    video = createCapture(VIDEO).size(640, 480).parent(ui);
    createCanvas(640, 480, WEBGL).parent(ui);
    bodyPose.detectStart(video, r => poses = r);
    connections = bodyPose.getSkeleton();

    // Fill star‑field
    for (let i = 0; i < STAR_COUNT; i++)
        stars.push([random(-1, 1), random(-1, 1), random(-1, 1)]);
}

function draw() {
    background(0);
    lights(); ambientLight(60);
    pointLight(255, 255, 255, 0, -2, 1);
    scale(height / 2);            // 1 unit ≈ 1 m
    orbitControl();

    drawStars();
    if (poses.length) drawHumanoid(poses[0].keypoints3D);
}

function drawStars() {
    push();
    noStroke(); fill(255);
    for (const [x, y, z] of stars) {
        push(); translate(x, y, z); sphere(0.01, 4, 4); pop();
    }
    pop();
}

function drawHumanoid(pts) {
    // Draw head
    const nose = pts[0];
    if (nose.confidence > 0.1) {
        push(); translate(nose.x, nose.y - HEAD_R * 1.5, nose.z);
        ambientMaterial(220); sphere(HEAD_R, 10, 10); pop();
    }

    // Torso (avg shoulders & hips)
    const ls = pts[11], rs = pts[12], lh = pts[23], rh = pts[24];
    if (ls.confidence > 0.1 && rs.confidence > 0.1 && lh.confidence > 0.1 && rh.confidence > 0.1) {
        const cx = (ls.x + rs.x + lh.x + rh.x) / 4;
        const cy = (ls.y + rs.y + lh.y + rh.y) / 4;
        const cz = (ls.z + rs.z + lh.z + rh.z) / 4;
        push(); translate(cx, cy, cz);
        ambientMaterial(180, 180, 255); box(TORSO_W, TORSO_H, TORSO_W); pop();
    }

    // Limbs helper
    limb(ls, pts[13]); // L upper arm
    limb(pts[13], pts[15]); // L forearm
    limb(rs, pts[14]); // R upper arm
    limb(pts[14], pts[16]); // R forearm
    limb(lh, pts[25]); // L thigh
    limb(pts[25], pts[27]); // L shin
    limb(rh, pts[26]); // R thigh
    limb(pts[26], pts[28]); // R shin

    // Feet / Hands spheres for clarity
    endSphere(pts[15]); endSphere(pts[16]);
    endSphere(pts[27]); endSphere(pts[28]);
}

function limb(A, B) {
    if (A.confidence < 0.1 || B.confidence < 0.1) return;
    const ax = A.x, ay = A.y, az = A.z;
    const bx = B.x, by = B.y, bz = B.z;
    const len = dist(ax, ay, az, bx, by, bz);
    const midX = (ax + bx) / 2, midY = (ay + by) / 2, midZ = (az + bz) / 2;
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    push();
    translate(midX, midY, midZ);
    const rotY = atan2(dx, dz);
    const rotX = atan2(dy, Math.sqrt(dx * dx + dz * dz));
    rotateY(rotY);
    rotateX(-rotX);
    ambientMaterial(200);
    cylinder(LIMB_R, len, 6, 1);
    pop();
}

function endSphere(pt) {
    if (pt.confidence < 0.1) return;
    push(); translate(pt.x, pt.y, pt.z);
    ambientMaterial(240); sphere(LIMB_R * 1.5, 8, 8); pop();
}
