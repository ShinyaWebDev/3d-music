// 3‑D Pose + Mic‑Pulse Skeleton
let video, bodyPose, connections, poses = [];
let mic, amp = null;

let fft;                        // new analyser
const BASS = [20, 250];
const MID = [250, 2000];
const TREBLE = [2000, 8000];

const BASE_RADIUS = 0.04;
const PULSE_SCALE = 0.8;
const JOINT_DETAIL = 6;

// Convert HSV (0‑560, 0‑1, 0‑1) to p5 RGB
function hsv(h, s, v, a = 255) {
    let c = v * s, x = c * (1 - abs(((h / 60) % 2) - 1)), m = v - c;
    let [r, g, b] =
        h < 60 ? [c, x, 0] :
            h < 120 ? [x, c, 0] :
                h < 180 ? [0, c, x] :
                    h < 240 ? [0, x, c] :
                        h < 300 ? [x, 0, c] :
                            [c, 0, x];
    return color((r + m) * 255, (g + m) * 255, (b + m) * 255, a);
}


function preload() { bodyPose = ml5.bodyPose('BlazePose'); }

function setup() {
    const container = createDiv().style('display', 'flex').style('gap', '8px');
    video = createCapture(VIDEO).size(840, 560).parent(container);
    createCanvas(840, 560, WEBGL).parent(container);

    bodyPose.detectStart(video, r => poses = r);
    connections = bodyPose.getSkeleton();
    mic = new p5.AudioIn();                     // not yet active
}

function draw() {
    resetMatrix();
    lights(); ambientLight(60);
    pointLight(255, 255, 255, 0, -2, 1);
    scale(height / 2); orbitControl(); background(0);

    if (!poses.length) return;
    const pts = poses[0].keypoints3D;

    // ── bones ──
    for (const [a, b] of connections) {
        const A = pts[a], B = pts[b];
        if (A.confidence > 0.1 && B.confidence > 0.1) {
            const d = (A.z + B.z) / 2;
            strokeWeight(map(d, -1, 1, 6, 1));
            stroke(map(d, -1, 1, 255, 60), 200, 255);
            line(A.x, A.y, A.z, B.x, B.y, B.z);
        }
    }

    // ── size from loudness ──
    let level = amp ? max(0, amp.getLevel() - 0.02) : 0;
    const radius = BASE_RADIUS + level * PULSE_SCALE;

    // ── colour from FFT bands ──
    let bass = 0, mid = 0, treb = 0;
    if (fft) {
        fft.analyze();
        bass = fft.getEnergy(20, 250) / 255;
        mid = fft.getEnergy(250, 2000) / 255;
        treb = fft.getEnergy(2000, 8000) / 255;
        // temporary debug
        console.log('bass', bass.toFixed(2),
            'mid', mid.toFixed(2),
            'treb', treb.toFixed(2));

    }

    stroke(255, 255, 255, 60);   // subtle white rim
    strokeWeight(2);

    for (let i = 0; i < pts.length; i++) {
        const k = pts[i];
        if (k.confidence > 0.1) {

            // pick brightness by band
            let v;
            if ([27, 29, 31, 28, 30, 32].includes(i)) v = bass;   // legs/feet
            else if ([11, 12, 23, 24].includes(i)) v = mid;    // torso/hips
            else v = treb;   // arms/head

            v = min(1, v * 3.0);        // BOOST visibility ×3

            // set distinct hues: red, green, blue
            let col =
                [27, 29, 31, 28, 30, 32].includes(i) ? hsv(0, 1, v, 220) :     // red
                    [11, 12, 23, 24].includes(i) ? hsv(120, 1, v, 220) :     // green
                        hsv(240, 1, v, 220);      // blue

            fill(col);

            push();
            translate(k.x, k.y, k.z);
            sphere(radius, JOINT_DETAIL, JOINT_DETAIL);
            pop();
        }
    }
}




// click anywhere in canvas
function mousePressed() {
    getAudioContext().resume();          // wake AudioContext

    if (mic.enabled) {                   // 🔇 CLICK  → stop
        mic.stop(); amp = null; fft = null;
    } else {                             // 🔊 CLICK  → start
        mic.stop(); mic.enabled = false;   // reset state after reload
        mic.start(() => {                  // runs after user grants permission
            // amplitude for loudness
            amp = new p5.Amplitude();
            amp.setInput(mic);
            amp.smooth(0.8);

            // FFT for colour (⭐ now created AFTER mic is active)
            fft = new p5.FFT(0.8, 1024);     // 80 % smoothing, 1024 bins
            fft.setInput(mic);

            console.log('🎤 mic + fft started');
        });
    }
}

