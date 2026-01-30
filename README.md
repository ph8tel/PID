# PID Servo Control System

A Raspberry Pi-based servo control system using PCA9685 PWM driver with PID smoothing for smooth, precise servo movements.

## Features

- **PID Control**: Smooth servo movements using Proportional-Integral-Derivative controllers
- **WebSocket Server**: Real-time control via WebSocket connections on port 8080
- **Dual Servo Support**: Independent pan and tilt servo control
- **Speed Limiting**: Configurable maximum speed to prevent jerky movements

## Hardware Requirements

- Raspberry Pi (any model with I2C)
- PCA9685 PWM Servo Driver Board
- 2x Servo Motors (SG90, MG996R, or similar)
- External 5V power supply for servos

## Installation

```bash
npm install
```

Required packages:
- `pca9685` - PCA9685 PWM driver
- `i2c-bus` - I2C communication
- `ws` - WebSocket server
- `express` - HTTP server

Dev dependencies (testing):
- `jest` - Test framework
- `ws-mock` - WebSocket mocking utilities

## Hardware Setup

1. Connect PCA9685 to Raspberry Pi I2C bus 1 (default)
2. PCA9685 I2C address: `0x40`
3. Pan servo on channel 0
4. Tilt servo on channel 1
5. Connect external 5V power to PCA9685 (servos draw too much current for Pi GPIO)

## Usage

### Start the Server

```bash
node socketServer.js
```

Server will start on port 8080 and begin the control loop at 50Hz.

### Run Test Client

```bash
node testClient.js
```

This will run automated servo movements to test the system.

### Send Commands via WebSocket

Connect to `ws://localhost:8080` and send JSON messages:

```json
{"pan": 45, "tilt": -30}
```

- `pan`: -90 to +90 degrees
- `tilt`: -90 to +90 degrees
- Both fields are optional (can update just one axis)

Server responds with:
```json
{
  "status": "ok",
  "position": {"pan": 45.2, "tilt": -29.8}
}
```

## PID Tuning

Edit `servoControlLoop.js` to adjust PID parameters:

```javascript
const panPID = new PID(0.6, 0.02, 0.1, dt);  // kp, ki, kd, dt
```

- **kp (0.6)**: Proportional gain - higher = faster response, may oscillate
- **ki (0.02)**: Integral gain - eliminates steady-state error
- **kd (0.1)**: Derivative gain - reduces overshoot and oscillation
- **maxSpeed (3)**: Maximum degrees per tick (smooth motion limiting)

## Testing

The project includes a comprehensive test suite with 24 tests covering PID controller logic and WebSocket server functionality.

### Run Tests

```bash
npm test                 # Run all tests once
npm run test:watch       # Run tests in watch mode (re-runs on file changes)
npm run test:coverage    # Generate code coverage report
```

### Test Structure

```
__tests__/
  PID.test.js           - 13 tests for PID controller (P, I, D terms, convergence, edge cases)
  socketServer.test.js  - 11 tests for WebSocket server (connections, messages, errors)
```

### Hardware Mocking

The test suite uses Jest mocks to simulate hardware components, allowing tests to run on **any system without Raspberry Pi or servo hardware**:

- **PCA9685/I2C**: Mocked in tests - no actual I2C communication occurs
- **WebSocket Server**: Tested on separate port (8081) to avoid conflicts
- **Servo Control Loop**: Module mocked with `jest.mock()` to verify function calls

This means you can develop and test the control logic on your laptop, then deploy to Raspberry Pi when ready.

## Project Structure

```
PID.js              - PID controller class
servoControlLoop.js - Main control loop with PCA9685 interface
socketServer.js     - WebSocket server
testClient.js       - Example client with automated movements
PCA9685.py          - Python alternative for hardware interface
__tests__/          - Jest test suite
```

## Python Alternative

Use `PCA9685.py` for Python-based projects:

```python
from PCA9685 import PCA9685
pwm = PCA9685(0x40)
pwm.setPWMFreq(50)
pwm.setServoPulse(0, 1500)  # Center position
```

## Troubleshooting

- **I2C Permission Error**: Add user to i2c group: `sudo usermod -a -G i2c $USER`
- **Module Not Found**: Run `npm install`
- **Servo Jitter**: Increase `maxSpeed` or tune PID parameters
- **No Movement**: Check external power supply and servo connections
