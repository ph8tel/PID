const WebSocket = require('ws');
const http = require('http');

// Mock the servoControlLoop module
jest.mock('../servoControlLoop', () => ({
  setTarget: jest.fn(),
  getPosition: jest.fn(() => ({ pan: 0, tilt: 0 }))
}));

const servoControl = require('../servoControlLoop');

describe('WebSocket Server', () => {
  let server;
  let wss;
  let testClient;
  const TEST_PORT = 8081; // Use different port for testing

  beforeAll((done) => {
    // Create a test server instance
    const express = require('express');
    const app = express();
    server = http.createServer(app);
    const { Server } = require('ws');
    wss = new Server({ server });

    wss.on('connection', ws => {
      ws.on('message', msg => {
        try {
          const data = JSON.parse(msg);
          servoControl.setTarget(data.pan, data.tilt);
          
          ws.send(JSON.stringify({
            status: 'ok',
            position: servoControl.getPosition()
          }));
        } catch (err) {
          ws.send(JSON.stringify({
            status: 'error',
            message: err.message
          }));
        }
      });
    });

    server.listen(TEST_PORT, done);
  });

  afterAll((done) => {
    if (testClient && testClient.readyState === WebSocket.OPEN) {
      testClient.close();
    }
    wss.close();
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Handling', () => {
    test('should accept WebSocket connections', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        expect(testClient.readyState).toBe(WebSocket.OPEN);
        testClient.close();
        done();
      });
    });

    test('should handle multiple clients', (done) => {
      const client1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      const client2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      let openCount = 0;
      
      const onOpen = () => {
        openCount++;
        if (openCount === 2) {
          client1.close();
          client2.close();
          done();
        }
      };
      
      client1.on('open', onOpen);
      client2.on('open', onOpen);
    });
  });

  describe('Message Handling', () => {
    test('should handle pan command', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send(JSON.stringify({ pan: 45 }));
      });
      
      testClient.on('message', (data) => {
        const response = JSON.parse(data);
        
        expect(servoControl.setTarget).toHaveBeenCalledWith(45, undefined);
        expect(response.status).toBe('ok');
        expect(response.position).toBeDefined();
        
        testClient.close();
        done();
      });
    });

    test('should handle tilt command', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send(JSON.stringify({ tilt: -30 }));
      });
      
      testClient.on('message', (data) => {
        const response = JSON.parse(data);
        
        expect(servoControl.setTarget).toHaveBeenCalledWith(undefined, -30);
        expect(response.status).toBe('ok');
        
        testClient.close();
        done();
      });
    });

    test('should handle both pan and tilt', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send(JSON.stringify({ pan: 45, tilt: -30 }));
      });
      
      testClient.on('message', (data) => {
        const response = JSON.parse(data);
        
        expect(servoControl.setTarget).toHaveBeenCalledWith(45, -30);
        expect(response.status).toBe('ok');
        expect(response.position).toHaveProperty('pan');
        expect(response.position).toHaveProperty('tilt');
        
        testClient.close();
        done();
      });
    });

    test('should return current position in response', (done) => {
      servoControl.getPosition.mockReturnValue({ pan: 22.5, tilt: -15.3 });
      
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send(JSON.stringify({ pan: 45 }));
      });
      
      testClient.on('message', (data) => {
        const response = JSON.parse(data);
        
        expect(response.position.pan).toBe(22.5);
        expect(response.position.tilt).toBe(-15.3);
        
        testClient.close();
        done();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send('invalid json{');
      });
      
      testClient.on('message', (data) => {
        const response = JSON.parse(data);
        
        expect(response.status).toBe('error');
        expect(response.message).toBeDefined();
        
        testClient.close();
        done();
      });
    });

    test('should handle empty message', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send('{}');
      });
      
      testClient.on('message', (data) => {
        const response = JSON.parse(data);
        
        expect(response.status).toBe('ok');
        expect(servoControl.setTarget).toHaveBeenCalledWith(undefined, undefined);
        
        testClient.close();
        done();
      });
    });

    test('should handle servoControl errors', (done) => {
      servoControl.setTarget.mockImplementation(() => {
        throw new Error('Hardware error');
      });
      
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send(JSON.stringify({ pan: 45 }));
      });
      
      testClient.on('message', (data) => {
        const response = JSON.parse(data);
        
        expect(response.status).toBe('error');
        expect(response.message).toBe('Hardware error');
        
        testClient.close();
        done();
      });
    });
  });

  describe('Message Format', () => {
    test('should accept numeric values', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send(JSON.stringify({ pan: 45.5, tilt: -30.2 }));
      });
      
      testClient.on('message', () => {
        expect(servoControl.setTarget).toHaveBeenCalledWith(45.5, -30.2);
        testClient.close();
        done();
      });
    });

    test('should ignore extra fields', (done) => {
      testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      testClient.on('open', () => {
        testClient.send(JSON.stringify({ 
          pan: 45, 
          tilt: -30,
          extra: 'ignored',
          another: 123
        }));
      });
      
      testClient.on('message', () => {
        expect(servoControl.setTarget).toHaveBeenCalledWith(45, -30);
        testClient.close();
        done();
      });
    });
  });
});
