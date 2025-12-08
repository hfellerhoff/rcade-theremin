import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { handLandmarker } from "./hands";
import "./style.css";

const WIDTH = 336;
const HEIGHT = 262;

const video = document.querySelector<HTMLVideoElement>("#video")!;
const canvasElement = document.querySelector<HTMLCanvasElement>("#canvas")!;

let gameStarted = false;

function update() {
  if (!gameStarted) {
  } else {
  }

  requestAnimationFrame(update);
}

update();

const constraints = {
  audio: false,
  video: {
    facingMode: "user",
  },
};

let lastVideoTime = -1;
let webcamRunning: Boolean = false;

const ctx = canvasElement.getContext("2d");

type Finger = NormalizedLandmark;

const createHand = () =>
  new Array(22).fill(0).map((_, i) => ({ x: 0, y: 0, z: 0, visibility: 0 }));

const state: Record<number, NormalizedLandmark[]> = {
  0: createHand(),
  1: createHand(),
};

function onProcessResults(results: HandLandmarkerResult) {
  if (!ctx) return;

  results.landmarks.forEach((hand, handIndex) => {
    hand.forEach((finger, fingerIndex) => {
      state[handIndex][fingerIndex] = finger;
    });
  });
}

async function predictWebcam() {
  if (!canvasElement || !ctx) return;

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
  }

  // onProcessResults(handLandmarker.detectForVideo(video, startTimeMs));
  const results = handLandmarker.detectForVideo(video, startTimeMs);

  // console.log(results.landmarks?.[0]);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "red";
  results.landmarks.forEach((hand, handIndex) => {
    hand.forEach((finger, fingerIndex) => {
      // state[handIndex][fingerIndex] = finger;
      ctx.fillRect(WIDTH - finger.x * WIDTH, finger.y * HEIGHT, 5, 5);
    });
  });

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
  console.log(stream);
  video.srcObject = stream;
  video.addEventListener("loadeddata", predictWebcam);
  webcamRunning = true;
});
