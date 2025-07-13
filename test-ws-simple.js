const WebSocket = require('ws');

console.log('=== Simple WebSocket Test ===\n');

// Test 1: Basic connection
console.log('Test 1: Basic WebSocket connection');
const ws1 = new WebSocket('wss://api.xrpl.to/ws/ohlc');

ws1.on('open', () => {
  console.log('✅ Connected successfully');
  console.log('Sending subscribe message...\n');
  
  const msg = {
    type: 'subscribe',
    tokenMd5: '2fb15d3b5a3a7d876b92f5dabd96ca38',
    intervals: ['1m']
  };
  
  ws1.send(JSON.stringify(msg));
});

ws1.on('message', (data) => {
  console.log('📨 Received:', data.toString().substring(0, 200) + '...');
});

ws1.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

ws1.on('close', (code, reason) => {
  console.log(`🔌 Closed: ${code} - ${reason}\n`);
  testAlternativeFormat();
});

// Test 2: Alternative message format
function testAlternativeFormat() {
  console.log('Test 2: Alternative subscribe format');
  const ws2 = new WebSocket('wss://api.xrpl.to/ws/ohlc');
  
  ws2.on('open', () => {
    console.log('✅ Connected');
    
    // Try the old format
    const msg = {
      action: 'subscribe',
      tokenMd5: '2fb15d3b5a3a7d876b92f5dabd96ca38',
      interval: '1m',
      vs_currency: 'XRP'
    };
    
    console.log('Sending:', JSON.stringify(msg));
    ws2.send(JSON.stringify(msg));
  });
  
  ws2.on('message', (data) => {
    console.log('📨 Received:', data.toString().substring(0, 200) + '...');
  });
  
  ws2.on('close', (code, reason) => {
    console.log(`🔌 Closed: ${code} - ${reason}\n`);
    testDifferentToken();
  });
  
  ws2.on('error', (err) => {
    console.error('❌ Error:', err.message);
  });
}

// Test 3: Different token
function testDifferentToken() {
  console.log('Test 3: Testing with different token (XRP)');
  const ws3 = new WebSocket('wss://api.xrpl.to/ws/ohlc');
  
  ws3.on('open', () => {
    console.log('✅ Connected');
    
    const msg = {
      type: 'subscribe',
      tokenMd5: 'd88f9045459e7b4eccdc2c0975a59191', // XRP token
      intervals: ['1m']
    };
    
    console.log('Sending:', JSON.stringify(msg));
    ws3.send(JSON.stringify(msg));
  });
  
  ws3.on('message', (data) => {
    console.log('📨 Received:', data.toString().substring(0, 200) + '...');
  });
  
  ws3.on('close', (code, reason) => {
    console.log(`🔌 Closed: ${code} - ${reason}\n`);
    console.log('All tests complete');
    process.exit();
  });
  
  ws3.on('error', (err) => {
    console.error('❌ Error:', err.message);
  });
}

// Keep alive for 30 seconds max
setTimeout(() => {
  console.log('\nTimeout reached, closing...');
  process.exit();
}, 30000);