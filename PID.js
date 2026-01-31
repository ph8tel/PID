class PID {
  constructor(kp, ki, kd, dt) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.dt = dt;

    this.integral = 0;
    this.prevError = 0;

    // Tunable safety limits
    this.integralClamp = 30;   // prevents windup
    this.deadband = 1.0;       // degrees
    this.snapThreshold = 2.0;  // snap to target when close
  }

  update(target, current) {
    let error = target - current;

    // --- Deadband: stop jitter near target ---
    if (Math.abs(error) < this.deadband) {
      error = 0;
    }

    // --- Snap-to-target: prevents 30-second micro-adjustments ---
    if (Math.abs(error) < this.snapThreshold) {
      this.integral = 0;       // reset integral when close
      this.prevError = 0;
      return 0;                // tell servo loop "stop moving"
    }

    // --- Proportional ---
    const P = this.kp * error;

    // --- Integral with clamping ---
    this.integral += error * this.dt;
    this.integral = Math.max(
      -this.integralClamp,
      Math.min(this.integral, this.integralClamp)
    );
    const I = this.ki * this.integral;

    // --- Derivative (heavily damped to avoid jitter) ---
    let derivative = (error - this.prevError) / this.dt;

    // Low-pass filter derivative to reduce noise
    derivative = derivative * 0.2; // 20% of raw derivative
    const D = this.kd * derivative;

    this.prevError = error;

    return P + I + D;
  }
}

module.exports = PID;
