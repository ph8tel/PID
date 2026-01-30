const WebSocket = require('ws');

// Connect to the servo control server
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to servo control server');
  
  // Start automated test sequence
  runTestSequence();
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  if (response.status === 'ok') {
    console.log(`Position: pan=${response.position.pan.toFixed(1)}° tilt=${response.position.tilt.toFixed(1)}°`);
  } else {
    console.error('Error:', response.message);
  }
});

ws.on('close', () => {
  console.log('Disconnected from server');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

// Automated test sequence
function runTestSequence() {
  const tests = [
    { delay: 1000, pan: 0, tilt: 0, desc: 'Center position' },
    { delay: 3000, pan: 45, tilt: 0, desc: 'Pan right' },
    { delay: 3000, pan: -45, tilt: 0, desc: 'Pan left' },
    { delay: 3000, pan: 0, tilt: 30, desc: 'Tilt up' },
    { delay: 3000, pan: 0, tilt: -30, desc: 'Tilt down' },
    { delay: 3000, pan: 45, tilt: 30, desc: 'Upper right' },
    { delay: 3000, pan: -45, tilt: 30, desc: 'Upper left' },
    { delay: 3000, pan: -45, tilt: -30, desc: 'Lower left' },
    { delay: 3000, pan: 45, tilt: -30, desc: 'Lower right' },
    { delay: 3000, pan: 0, tilt: 0, desc: 'Return to center' },
  ];

  let currentTest = 0;

  function runNext() {
    if (currentTest >= tests.length) {
      console.log('\n✓ Test sequence complete!');
      console.log('Starting circular pattern...\n');
      runCircularPattern();
      return;
    }

    const test = tests[currentTest];
    setTimeout(() => {
      console.log(`\n[${currentTest + 1}/${tests.length}] ${test.desc}`);
      ws.send(JSON.stringify({ pan: test.pan, tilt: test.tilt }));
      currentTest++;
      runNext();
    }, test.delay);
  }

  runNext();
}

// Circular motion pattern
function runCircularPattern() {
  let angle = 0;
  const radius = 30; // degrees
  const speed = 5; // degrees per step

  const interval = setInterval(() => {
    const pan = Math.cos(angle * Math.PI / 180) * radius;
    const tilt = Math.sin(angle * Math.PI / 180) * radius;
    
    ws.send(JSON.stringify({ 
      pan: Math.round(pan * 10) / 10, 
      tilt: Math.round(tilt * 10) / 10 
    }));
    
    angle += speed;
    
    // Run for 2 full circles then stop
    if (angle >= 720) {
      clearInterval(interval);
      console.log('\n✓ Circular pattern complete!');
      console.log('Returning to center and closing...\n');
      
      setTimeout(() => {
        ws.send(JSON.stringify({ pan: 0, tilt: 0 }));
        setTimeout(() => ws.close(), 2000);
      }, 1000);
    }
  }, 100);
}
