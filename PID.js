class PID {
  constructor(kp, ki, kd, dt) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.dt = dt;

    this.integral = 0;
    this.prevError = 0;
  }

  update(target, current) {
    const error = target - current;

    // Proportional
    const P = this.kp * error;

    // Integral
    this.integral += error * this.dt;
    const I = this.ki * this.integral;

    // Derivative
    const derivative = (error - this.prevError) / this.dt;
    const D = this.kd * derivative;

    this.prevError = error;

    return P + I + D;
  }
}

module.exports = PID;