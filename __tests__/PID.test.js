const PID = require('../PID');

describe('PID Controller', () => {
  let pid;
  const dt = 0.02; // 20ms

  beforeEach(() => {
    pid = new PID(1.0, 0.1, 0.05, dt);
  });

  describe('Constructor', () => {
    test('should initialize with correct parameters', () => {
      expect(pid.kp).toBe(1.0);
      expect(pid.ki).toBe(0.1);
      expect(pid.kd).toBe(0.05);
      expect(pid.dt).toBe(dt);
      expect(pid.integral).toBe(0);
      expect(pid.prevError).toBe(0);
    });
  });

  describe('Proportional Term', () => {
    test('should calculate proportional term correctly', () => {
      const pidP = new PID(1.0, 0, 0, dt); // Only P term
      const output = pidP.update(10, 0);
      expect(output).toBeCloseTo(10, 5);
    });

    test('should handle negative error', () => {
      const pidP = new PID(1.0, 0, 0, dt);
      const output = pidP.update(0, 10);
      expect(output).toBeCloseTo(-10, 5);
    });
  });

  describe('Integral Term', () => {
    test('should accumulate error over time', () => {
      const pidI = new PID(0, 1.0, 0, dt); // Only I term
      const output1 = pidI.update(10, 0);
      const output2 = pidI.update(10, 0);
      expect(output2).toBeGreaterThan(output1);
    });

    test('should integrate with correct dt', () => {
      pid.update(10, 0);
      expect(pid.integral).toBeCloseTo(10 * dt, 5);
    });
  });

  describe('Derivative Term', () => {
    test('should calculate derivative on error change', () => {
      const pidD = new PID(0, 0, 1.0, dt); // Only D term
      pidD.update(10, 0);
      const output = pidD.update(5, 0);
      expect(output).toBeCloseTo(-250, 1);
    });

    test('should be zero when error is constant', () => {
      const pidD = new PID(0, 0, 1.0, dt);
      pidD.update(10, 0);
      const output = pidD.update(10, 0);
      expect(output).toBeCloseTo(0, 5);
    });
  });

  describe('Complete PID', () => {
    test('should converge toward target with speed limiting', () => {
      const testPid = new PID(0.6, 0.02, 0.1, dt);
      const target = 45;
      let current = 0;
      const maxSpeed = 3;
      
      for (let i = 0; i < 20; i++) {
        const delta = testPid.update(target, current);
        const step = Math.max(Math.min(delta, maxSpeed), -maxSpeed);
        current += step;
      }
      
      // After 20 iterations, should have made significant progress (at least 50%)
      expect(current).toBeGreaterThan(target * 0.5);
      expect(current).toBeLessThan(target * 1.5);
    });

    test('should handle zero error correctly', () => {
      const output = pid.update(10, 10);
      expect(output).toBeCloseTo(0, 5);
    });

    test('should maintain state between updates', () => {
      pid.update(10, 0);
      expect(pid.integral).not.toBe(0);
      expect(pid.prevError).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small dt', () => {
      const smallPID = new PID(1.0, 0.1, 0.05, 0.001);
      const output = smallPID.update(10, 0);
      expect(output).toBeDefined();
      expect(isFinite(output)).toBe(true);
    });

    test('should handle large errors', () => {
      const output = pid.update(1000, -1000);
      expect(isFinite(output)).toBe(true);
    });

    test('should handle floating point targets', () => {
      const output = pid.update(45.7, 12.3);
      expect(output).toBeDefined();
      expect(isFinite(output)).toBe(true);
    });
  });
});
