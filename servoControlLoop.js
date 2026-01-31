const PCA9685 = require("pca9685").Pca9685Driver;
const PID = require("./PID");

const options = {
  i2c: require("i2c-bus").openSync(1),
  address: 0x40,
  frequency: 50,
  debug: false
};

const pwm = new PCA9685(options, err => {
  if (err) throw err;
  console.log("PCA9685 ready");
});

// ---- Servo state ----
let currentPan = 0;
let currentTilt = 0;

let targetPan = 0;
let targetTilt = 0;

// PID controllers (tune these)
const dt = 0.02; // 20ms loop
const panPID = new PID(0.6, 0.05, 0.1, dt);
const tiltPID = new PID(0.6, 0.05, 0.1, dt);

// ---- Servo helpers ----
function angleToPulse(angle) {
  const min = 500;  // microseconds
  const max = 2500; // microseconds
  const pulse = min + ((angle + 90) / 180) * (max - min);
  return Math.floor(pulse);
}

function setServo(channel, angle) {
  const pulse = angleToPulse(angle);
  pwm.setPulseLength(channel, pulse);
}

// ---- Control loop ----
setInterval(() => {
  // Compute PID output (delta angle)
  const panDelta = panPID.update(targetPan, currentPan);
  const tiltDelta = tiltPID.update(targetTilt, currentTilt);

  // Clamp speed so motion is smooth
  const maxSpeed = 3; // degrees per tick
  const panStep = Math.max(Math.min(panDelta, maxSpeed), -maxSpeed);
  const tiltStep = Math.max(Math.min(tiltDelta, maxSpeed), -maxSpeed);

  // Update angles
  currentPan += panStep;
  currentTilt += tiltStep;

  // Send to servos
  setServo(0, currentPan);
  setServo(1, currentTilt);

}, dt * 1000);

// ---- Exports ----
module.exports = {
  setTarget: (pan, tilt) => {
    if (pan !== undefined) targetPan = pan;
    if (tilt !== undefined) targetTilt = tilt;
  },
  getPosition: () => ({
    pan: currentPan,
    tilt: currentTilt
  })

};
