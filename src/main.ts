import * as Tone from "tone";

import { SYSTEM, on } from "@rcade/plugin-input-classic";

import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { FINGERS, handLandmarker } from "./hands";
import "./style.css";

const WIDTH = 336;
const HEIGHT = 262;

const video = document.querySelector<HTMLVideoElement>("#video")!;
const canvasElement = document.querySelector<HTMLCanvasElement>("#canvas")!;
const landingElement = document.querySelector<HTMLDivElement>("#landing")!;

let gameStarted = false;

// function update() {
//   if (!gameStarted) {

//   } else {
//   }

//   requestAnimationFrame(update);
// }

// update();

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

let audio:
  | undefined
  | {
      gain: Tone.Gain;
      oscillator: Tone.Oscillator;
      signal: Tone.Signal<"frequency">;
    } = undefined;

async function predictWebcam() {
  if (!canvasElement || !ctx) return;

  if (!audio) {
    const gain = new Tone.Gain(0).toDestination();
    const oscillator = new Tone.Oscillator().connect(gain).start();
    const signal = new Tone.Signal({
      units: "frequency",
    }).connect(oscillator.frequency);

    audio = {
      gain,
      oscillator,
      signal,
    };
  }

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
  }

  // onProcessResults(handLandmarker.detectForVideo(video, startTimeMs));
  const results = handLandmarker.detectForVideo(video, startTimeMs);

  // console.log(results.landmarks?.[0]);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (!results.landmarks?.[0]?.[FINGERS.INDEX_FINGER_MCP]) {
    audio?.gain.gain.rampTo(0, 0.1, Tone.now());
  }

  results.landmarks.forEach((hand, handIndex) => {
    hand.forEach((finger, fingerIndex) => {
      if (handIndex === 0) {
        ctx.strokeStyle = "red";
      }
      if (handIndex === 1) {
        ctx.strokeStyle = "blue";
      }
      if (handIndex === 2) {
        ctx.strokeStyle = "green";
      }
      if (handIndex === 3) {
        ctx.strokeStyle = "purple";
      }

      ctx.beginPath();
      ctx.arc(WIDTH - finger.x * WIDTH, finger.y * HEIGHT, 2, 0, 2 * Math.PI);
      ctx.stroke();

      const frequencyValue = 100 + finger.x * 500;
      const gainAdjustment = 100 / frequencyValue;
      const gainValue = 1 - finger.y + gainAdjustment;

      if (fingerIndex === FINGERS.INDEX_FINGER_MCP) {
        audio?.gain.gain.rampTo(gainValue, 0.1, Tone.now());
        audio?.signal.rampTo(frequencyValue, 0.1, Tone.now());
      }
    });
  });

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

let toneStarted = false;
on("press", () => {
  if (!toneStarted) {
    Tone.start();
    toneStarted = true;
    console.log("started!");
  }
});

function start() {
  if (!gameStarted) {
    if (SYSTEM.ONE_PLAYER) {
      gameStarted = true;
    } else if (SYSTEM.TWO_PLAYER) {
      gameStarted = true;
    }

    requestAnimationFrame(start);
  } else {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function success(stream) {
        console.log(stream);
        video.srcObject = stream;
        canvasElement.classList.remove("hidden");
        landingElement.remove();
        video.addEventListener("loadeddata", predictWebcam);
        webcamRunning = true;
      });
  }
}

start();
