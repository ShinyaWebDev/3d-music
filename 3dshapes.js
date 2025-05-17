// 3D Pose Detection with Interactive Bouncy Shapes

let video;
let bodyPose;
let connections;
let poses = [];
let angle = 0;

let shapes = [];
const SHAPE_COUNT = 50;

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
    video.size(840, 560);
    video.loop();
    video.parent(container);

    createCanvas(840, 560, WEBGL).parent(container);

    const shapeTypes = ['cube', 'sphere', 'cylinder', 'cone'];
    for (let i = 0; i < SHAPE_COUNT; i++) {
        shapes.push({
            type: random(shapeTypes),
            pos: createVector(random(-1, 1), random(-1, 1), random(-1, 1)),
            vel: createVector(0, 0, 0),
            size: random(0.08, 0.18),
            rotSpeed: random(0.005, 0.015),
            baseColor: [random(100, 255), random(100, 255), random(100, 255)],
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
    background(0);

    let keypoints = poses.length ? poses[0].keypoints3D.filter(k => k.confidence > 0.1) : [];

    push();
    noStroke();
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        let { pos, size, vel } = shape;

        // Check collision with body points
        shape.isHit = false;
        for (let k of keypoints) {
            if (dist(k.x, k.y, k.z, pos.x, pos.y, pos.z) < size) {
                // Bounce: push shape away from keypoint
                let force = createVector(pos.x - k.x, pos.y - k.y, pos.z - k.z);
                force.normalize().mult(0.05);
                shape.vel.add(force);
                shape.isHit = true;
            }
        }

        // Apply velocity and damping
        shape.pos.add(vel);
        shape.vel.mult(0.92); // friction/damping

        push();
        translate(pos.x, pos.y, pos.z);
        rotateY(frameCount * shape.rotSpeed);

        if (shape.isHit) {
            fill(255, 255, 0); // highlight
        } else {
            fill(...shape.baseColor);
        }

        switch (shape.type) {
            case 'cube': box(size); break;
            case 'sphere': sphere(size, 8, 8); break;
            case 'cylinder': cylinder(size * 0.6, size); break;
            case 'cone': cone(size * 0.6, size); break;
        }

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
