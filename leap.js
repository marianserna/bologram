// node on mac
//https://developer.leapmotion.com/documentation/javascript/api/Leap.Hand.html#Hand.yaw

const Leap = require('leapjs');
const fetch = require('node-fetch');

const env = process.env.ENVIRONMENT || 'heroku';
const host = env === 'heroku' ? 'https://bologram.herokuapp.com' : 'http://localhost:3000';


let lastFrame = null;

// Constantly update last frame. Store the latest info in the last frame because not all of it can be used
Leap.loop((frame) => {
  lastFrame = frame;
});

// Post frames to server. If no info, pause 100ms and check again
function sendFrame() {
  if (lastFrame === null || lastFrame.hands.length === 0) {
    setTimeout(() => {
      sendFrame();
    }, 100);
    return;
  }

  // When there is data(there is a frame with hands info)
  const data = {
    // setting yaw to be whatever degree of rotation of the hand
    // yaw: lastFrame.hands[0].yaw()
    // min opening is about 35. 40 will act as 0 (to say that hand is closed)
    handOpening: Math.max(0, (lastFrame.hands[0].sphereRadius - 40))
  };
  console.log(data);

  fetch(`${host}/sensor-update`, {
    method: 'post',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  }).
  then((response) => response.text()).
  then((text) => sendFrame());
}

sendFrame();
