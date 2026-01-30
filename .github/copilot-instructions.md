# Copilot Instructions - PID Servo Control System

## Project Overview

This is a Raspberry Pi-based servo control system using PCA9685 PWM driver with PID smoothing. The system uses a WebSocket server to receive target positions and smoothly moves servos using PID controllers.

## Architecture & Data Flow

1. **WebSocket Server** ([socketServer.js](../socketServer.js)) receives target positions (`{pan: angle, tilt: angle}`)
2. **Control Loop** ([servoControlLoop.js](../servoControlLoop.js)) runs at 50Hz (20ms intervals):
   - PID controllers calculate delta angles from `targetPan/Tilt` → `currentPan/Tilt`
   - Delta is clamped to `maxSpeed` (3 degrees/tick) for smooth motion
   - Updated angles sent to PCA9685 via I2C
3. **Hardware**: PCA9685 on I2C bus 1, address 0x40, controlling servos on channels 0 (pan) and 1 (tilt)

## Key Components

### PID Controller ([PID.js](../PID.js))
- Classic PID with Proportional, Integral, Derivative terms
- Constructor: `new PID(kp, ki, kd, dt)` where `dt` is loop time
- Current tuning: `kp=0.6, ki=0.02, kd=0.1, dt=0.02`

### Servo Mapping
- Angle range: -90° to +90° → Pulse: 500-2500 microseconds
- Formula: `pulse = 500 + ((angle + 90) / 180) * 2000`
- PCA9685 frequency: 50Hz (standard servo PWM)

## Language/Library Patterns

### Node.js Dependencies
- `pca9685` npm package for PWM control (requires i2c-bus)
- WebSocket server expects JSON messages with `pan` and/or `tilt` properties
- I2C bus 1 is Raspberry Pi default (`i2c-bus.openSync(1)`)

### Python Alternative
[PCA9685.py](../PCA9685.py) provides equivalent hardware interface using `smbus`:
- `setServoPulse(channel, pulse_us)` for direct pulse control
- Use when integrating with Python-based vision/AI systems

## Development Workflow

### Testing Servos
Run control loop with manual target updates:
```bash
node servoControlLoop.js
# Then modify targetPan/targetTilt in code or via debugger
```

### PID Tuning
1. Adjust `kp` first for responsiveness (higher = faster, may oscillate)
2. Add `ki` to eliminate steady-state error
3. Add `kd` to reduce overshoot/oscillation
4. Current values work for typical SG90/MG996R servos

### Current Status (per README)
- ✅ PID class complete
- ✅ Servo control loop complete  
- ⚠️ Socket server incomplete (only message handler exists)
- ⚠️ Testing client not yet created

## Integration Points

- **I2C Communication**: Requires `/dev/i2c-1` access (add user to `i2c` group)
- **WebSocket Port**: Not yet defined in socketServer.js - needs full server implementation
- **Servo Power**: PCA9685 requires external 5V power supply (servos draw too much for Pi GPIO)

## Common Pitfalls

- **Integral Windup**: PID integral term accumulates indefinitely - may need reset/clamping for long stationary periods
- **Speed Clamping**: `maxSpeed` prevents jerky motion but may slow convergence - tune based on application needs
- **Angle Limits**: No mechanical limit checking - add constraints if servos have restricted range
