import "./style.css";

const video = document.querySelector<HTMLVideoElement>("#video")!;

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

navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
  console.log(stream);
  video.srcObject = stream;
});
