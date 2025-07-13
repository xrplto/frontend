const WebSocket = require('ws');

console.log('=== Testing with XRP (most active token) ===\n');

// Test with actual XRP token hash
const XRP_MD5 = 'b3813409e56020dc88311206a909c891'; // XRP token hash

const ws = new WebSocket('wss://api.xrpl.to/ws/ohlc');
let updateCount = 0;

ws.on('open', () => {
  console.log('✅ Connected at', new Date().toLocaleTimeString());
  
  setTimeout(() => {
    const msg = {
      type: 'subscribe',
      tokenMd5: XRP_MD5,
      intervals: ['1m', '5m']
    };
    
    console.log('📤 Subscribing to XRP with MD5:', XRP_MD5);
    ws.send(JSON.stringify(msg));
  }, 100);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    if (message.type === 'candleUpdate') {
      updateCount++;
      const candle = message.candle;
      console.log(`\n📊 Update #${updateCount} for ${message.interval} at ${new Date().toLocaleTimeString()}`);
      console.log(`   Price: ${candle[4]}`);
      console.log(`   Volume: ${candle[5]}`);
    } else if (message.type === 'error') {
      console.log(`\n❌ Error: ${message.message}`);
    } else if (message.type === 'subscribed') {
      console.log('✅ Subscribed successfully to intervals:', message.intervals);
    } else if (message.type === 'welcome') {
      console.log('👋', message.message);
    }
  } catch (err) {
    console.error('Parse error:', err.message);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 Disconnected: ${code} - ${reason}`);
  console.log(`Total updates: ${updateCount}`);
});

// Also test XRPSS in parallel
setTimeout(() => {
  console.log('\n--- Also testing XRPSS token ---');
  const ws2 = new WebSocket('wss://api.xrpl.to/ws/ohlc');
  let xrpssCount = 0;
  
  ws2.on('open', () => {
    const msg = {
      type: 'subscribe',
      tokenMd5: '2fb15d3b5a3a7d876b92f5dabd96ca38',
      intervals: ['1m']
    };
    ws2.send(JSON.stringify(msg));
  });
  
  ws2.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'candleUpdate') {
        xrpssCount++;
        console.log(`📍 XRPSS update #${xrpssCount} at ${new Date().toLocaleTimeString()}`);
      }
    } catch (err) {}
  });
  
  ws2.on('close', () => {
    console.log(`XRPSS total updates: ${xrpssCount}`);
  });
}, 2000);

// Run for 2 minutes
setTimeout(() => {
  console.log('\n--- Test Complete ---');
  console.log(`XRP updates: ${updateCount} in 2 minutes (${(updateCount / 120).toFixed(2)}/sec)`);
  ws.close();
  process.exit();
}, 120000);

// Status update every 30 seconds
setInterval(() => {
  console.log(`\n⏱️  Updates so far: ${updateCount}`);
}, 30000);