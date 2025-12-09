import * as Tone from "tone";

import { SYSTEM, on } from "@rcade/plugin-input-classic";

import { FINGERS, HAND_COUNT, handLandmarker } from "./hands";
import "./style.css";

const WIDTH = 336;
const HEIGHT = 262;

const video = document.querySelector<HTMLVideoElement>("#video")!;
const canvasElement = document.querySelector<HTMLCanvasElement>("#canvas")!;
const helperTextElement =
  document.querySelector<HTMLDivElement>("#helper-text")!;

let gameStarted = false;

const constraints = {
  audio: false,
  video: {
    facingMode: "user",
  },
};

let lastVideoTime = -1;
let webcamRunning: Boolean = false;

const ctx = canvasElement.getContext("2d");

type Audio =
  | undefined
  | {
      gain: Tone.Gain;
      oscillator: Tone.Oscillator;
      signal: Tone.Signal<"frequency">;
    };

const globalAudio: {
  gain: Tone.Gain | undefined;
} = {
  gain: undefined,
};

const handAudio: Record<number, Audio> = {
  0: undefined,
  1: undefined,
};

// function onProcessResults(results: HandLandmarkerResult) {
//   if (!ctx) return;

//   results.landmarks.forEach((hand, handIndex) => {
//     hand.forEach((finger, fingerIndex) => {
//       state[handIndex][fingerIndex] = finger;
//     });
//   });
// }

function ensureAudio(handIndex: number) {
  if (handAudio[handIndex] || !globalAudio.gain) return;

  const gain = new Tone.Gain(0).connect(globalAudio.gain);
  const oscillator = new Tone.Oscillator().connect(gain).start();
  const signal = new Tone.Signal({
    units: "frequency",
  }).connect(oscillator.frequency);

  handAudio[handIndex] = {
    gain,
    oscillator,
    signal,
  };
}

async function predictWebcam() {
  if (!canvasElement || !ctx) return;

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
  }

  const results = handLandmarker.detectForVideo(video, startTimeMs);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const handHasDataList = Object.keys(handAudio).map((_, index) => {
    return !!results.landmarks[index]?.length;
  });

  results.landmarks.forEach((hand, handIndex) => {
    ensureAudio(handIndex);

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
        handAudio[handIndex]?.gain.gain.rampTo(
          gainValue / HAND_COUNT,
          0.1,
          Tone.now(),
        );
        handAudio[handIndex]?.signal.rampTo(frequencyValue, 0.1, Tone.now());
      }
    });
  });

  handHasDataList.map((hasData, handIndex) => {
    ensureAudio(handIndex);

    if (!hasData) {
      handAudio[handIndex]?.gain.gain.rampTo(0, 0.1, Tone.now());
    }
  });

  if (handHasDataList.filter(Boolean).length === 0) {
    if (helperTextElement.classList.contains("opacity-none")) {
      helperTextElement.classList.remove("opacity-none");
    }
  } else {
    if (!helperTextElement.classList.contains("opacity-none")) {
      helperTextElement.classList.add("opacity-none");
    }
  }

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

    globalAudio.gain = new Tone.Gain(0.9).toDestination();
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
        helperTextElement.textContent = "Hold up your hands!";
        video.addEventListener("loadeddata", predictWebcam);
        webcamRunning = true;
      });
  }
}

start();
