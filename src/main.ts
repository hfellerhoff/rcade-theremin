import "./style.css";

const video = document.querySelector<HTMLVideoElement>("#video")!;
const debug = document.querySelector<HTMLPreElement>("#debug")!;

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

const deviceList = (await navigator.mediaDevices.enumerateDevices()).reduce(
  (acc, device) => {
    acc += `${device.kind}: ${device.label} id = ${device.deviceId}\n`;
    return acc;
  },
  "",
);

debug.textContent = deviceList;

const hasCameraPermission =
  (await navigator.permissions.query({ name: "camera" })).state === "granted";

debug.textContent += `Has Camera Permission: ${hasCameraPermission}`;

navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
  console.log(stream);
  video.srcObject = stream;
});
