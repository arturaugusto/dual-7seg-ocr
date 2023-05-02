const video = document.getElementById('video');
const button = document.getElementById('button');
const select = document.getElementById('select');

const videoCanvas = document.getElementById('videoCanvas');
const videoCanvasCtx = videoCanvas.getContext("2d", { willReadFrequently: true });

const roiCanvas = document.getElementById('roiCanvas');
const roiCanvasCtx = roiCanvas.getContext("2d", { willReadFrequently: true });


let roiCanvasArr = ['1', '2'].map(i => {
  const roiXCanvas = document.getElementById('roi'+i+'Canvas');
  const roiXCanvasCtx = roiXCanvas.getContext("2d", { willReadFrequently: true });

  const maskXCanvas = document.getElementById('mask'+i+'Canvas');
  const maskXCanvasCtx = maskXCanvas.getContext("2d");

  return {
    roiCanvas: roiXCanvas,
    roiCanvasCtx: roiXCanvasCtx,
    maskCanvas: maskXCanvas,
    maskCanvasCtx: maskXCanvasCtx
  }

})



let currentStream;



function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => {
    track.stop();
  });
};

let confTemplate = {
  region: null,
  padTop: 0,
  format: '8.8.8.8',
  gap: 20,
  tickWidth: 10,
  tickHeight: 13,
  skew: 0,
  vskew: 0,
  detectThresh: 0.2,
  vTarget: 'd',
  hTarget: 'w',
  gamma: 2.2,
  invert: false,
}

let state = {
  roiConfSel: null,
  confs: [Object.assign({}, confTemplate), Object.assign({}, confTemplate)]
}

video.addEventListener("play", () => {
  videoCanvas.width = video.videoWidth;
  videoCanvas.height = video.videoHeight;

  roiCanvas.width = video.videoWidth;
  roiCanvas.height = video.videoHeight;


  state.confs[0].region = [10, 10, roiCanvas.width/2-10, 100]
  state.confs[1].region = [roiCanvas.width/2+10, 10, roiCanvas.width/2-20, 100]

  state.roiConfSel = state.confs[0]


  const draw = () => {
    roiCanvasCtx.clearRect(0, 0, roiCanvas.width, roiCanvas.height)
    
    state.confs.forEach((conf, i) => {
      
      if (i === 0) {
        roiCanvasCtx.fillStyle = "rgba(255, 0, 0, 0.3)";
      } else {
        roiCanvasCtx.fillStyle = "rgba(0, 0, 255, 0.3)";
      }

      // let bounding
      // if (i === 0) {
      //   bounding = roiCanvas.getBoundingClientRect()
      // } else {
      //   bounding = roiCanvasArr[i-1].roiCanvas.getBoundingClientRect()
      // }
      // let wrapperEl = roiCanvasArr[i].roiCanvas.parentElement
      // wrapperEl.style["top"] = `${bounding.top + bounding.height}px`;


      // Crop desired region from first canvas
      var imageData1 = videoCanvasCtx.getImageData(...conf.region);

      conf.digitHeigth = imageData1.height
      
      // fix padding when skew

      conf.padLeft = Math.abs(imageData1.height*Math.sin(-conf.skew/180*Math.PI))
      // conf.padTop = (imageData1.width/2*Math.sin(-conf.vskew/180*Math.PI))
      let digitsCount = conf.format.split('').filter(x => x !== '.').length
      
      if (conf.skew > 0) {
        conf.padLeft = -conf.padLeft
      }

      conf.tickWidth = conf.digitHeigth / 20
      conf.tickHeight = conf.digitHeigth / 10

      roiCanvasCtx.fillRect(...conf.region);
      videoCanvasCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);


      applyGammaCorrection(imageData1, conf.gamma)
      
      // Draw modified image data to second canvas
      let histogram = hist(imageData1);
      let threshold = otsu(histogram, imageData1.width*imageData1.height);
      

      binarize(threshold, imageData1, conf.invert);

      roiCanvasArr[i].roiCanvas.width = imageData1.width;
      roiCanvasArr[i].roiCanvas.height = imageData1.height;

      roiCanvasArr[i].maskCanvas.width = imageData1.width;
      roiCanvasArr[i].maskCanvas.height = imageData1.height;

      roiCanvasArr[i].roiCanvasCtx.putImageData(imageData1, 0, 0);

      let res = ocr(roiCanvasArr[i].maskCanvas, roiCanvasArr[i].maskCanvasCtx, roiCanvasArr[i].roiCanvas, roiCanvasArr[i].roiCanvasCtx, conf);

      // console.log(res)
      roiCanvasCtx.fillStyle = "black";
      roiCanvasCtx.font = "22px Arial";
      roiCanvasCtx.fillText(res, conf.region[0], conf.region[1]+conf.region[3]);

    })

    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
});

function gotDevices(mediaDevices) {
  select.innerHTML = '';
  select.appendChild(document.createElement('option'));
  let count = 1;
  mediaDevices.forEach(mediaDevice => {
    if (mediaDevice.kind === 'videoinput') {
      const option = document.createElement('option');
      option.value = mediaDevice.deviceId;
      const label = mediaDevice.label || `Camera ${count++}`;
      const textNode = document.createTextNode(label);
      option.appendChild(textNode);
      select.appendChild(option);
    }
  });

}

button.addEventListener('click', event => {
  if (typeof currentStream !== 'undefined') {
    stopMediaTracks(currentStream);
  }
  const videoConstraints = {};
  if (select.value === '') {
    videoConstraints.facingMode = 'environment';
  } else {
    videoConstraints.deviceId = { exact: select.value };
  }
  const constraints = {
    video: videoConstraints,
    audio: false
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
      return navigator.mediaDevices.enumerateDevices();
    })
    .then(gotDevices)
    .catch(error => {
      console.error(error);
    });
});


navigator.mediaDevices.enumerateDevices().then(gotDevices);
