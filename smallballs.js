// 3D Pose Detection with Interactive Floating Dots (High Quantity)

let video;
let bodyPose;
let connections;
let poses = [];
let angle = 0;

let shapes = [];
const SHAPE_COUNT = 200; // Increased for more interactivity

let container;

function preload() {
    bodyPose = ml5.bodyPose('BlazePose');
}

function gotPoses(results) {
    poses = results;
}

function setup() {
    container = createDiv().style('display', 'flex').style('gap', '8px');

    video = createCapture(VIDEO);
    video.size(420, 280);
    video.loop();
    video.parent(container);

    createCanvas(1050, 700, WEBGL).parent(container);

    for (let i = 0; i < SHAPE_COUNT; i++) {
        shapes.push({
            pos: createVector(random(-0.5, 0.5), random(-0.5, 0.5), random(-0.25, 0.25)),
            vel: createVector(0, 0, 0),
            size: random(0.015, 0.03), // smaller floating dots
            rotSpeed: random(0.01, 0.03),
            baseColor: [random(200, 255), random(200, 255), 255],
            isHit: false
        });
    }

    bodyPose.detectStart(video, gotPoses);
    connections = bodyPose.getSkeleton();
}

function draw() {
    resetMatrix();
    lights();
    ambientLight(80);
    pointLight(255, 255, 255, 0, -2, 1);

    scale(height / 2);
    orbitControl();
    background(20);

    let keypoints = poses.length ? poses[0].keypoints3D.filter(k => k.confidence > 0.1) : [];

    push();
    noStroke();
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        let { pos, size, vel } = shape;

        // Check collision with body keypoints
        shape.isHit = false;
        for (let k of keypoints) {
            if (dist(k.x, k.y, k.z, pos.x, pos.y, pos.z) < size * 1.5) {
                let force = createVector(pos.x - k.x, pos.y - k.y, pos.z - k.z);
                force.normalize().mult(0.02);
                shape.vel.add(force);
                shape.isHit = true;
            }
        }

        shape.pos.add(vel);
        shape.vel.mult(0.92);

        push();
        translate(pos.x, pos.y, pos.z);
        rotateY(frameCount * shape.rotSpeed);

        if (shape.isHit) {
            fill(255, 255, 100);
        } else {
            fill(...shape.baseColor);
        }

        sphere(size, 8, 8);

        pop();
    }
    pop();

    if (poses.length) {
        const pose = poses[0];
        const pts = pose.keypoints3D;

        for (const [a, b] of connections) {
            const A = pts[a], B = pts[b];
            if (A.confidence > 0.1 && B.confidence > 0.1) {
                const depth = (A.z + B.z) * 0.5;
                strokeWeight(map(depth, -1, 1, 6, 1));
                stroke(map(depth, -1, 1, 255, 60), 200, 255);
                line(A.x, A.y, A.z, B.x, B.y, B.z);
            }
        }

        for (const k of pts) {
            if (k.confidence > 0.1) {
                push();
                translate(k.x, k.y, k.z);
                const depth = k.z;
                stroke(0, 255, 200, 120);
                strokeWeight(2);
                fill(255, 0, map(depth, -1, 1, 255, 80), 180);
                sphere(0.07);
                pop();
            }
        }
    }
}

function mousePressed() {
    console.log(poses);
}