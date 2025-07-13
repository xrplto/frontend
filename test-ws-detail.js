const WebSocket = require('ws');

console.log('=== Detailed WebSocket Test ===\n');

const ws = new WebSocket('wss://api.xrpl.to/ws/ohlc');
let lastCandle = null;
let updateCount = 0;

ws.on('open', () => {
  console.log('✅ Connected at', new Date().toLocaleTimeString());
  
  setTimeout(() => {
    const msg = {
      type: 'subscribe',
      tokenMd5: '2fb15d3b5a3a7d876b92f5dabd96ca38',
      intervals: ['1m']
    };
    
    console.log('📤 Sending:', JSON.stringify(msg));
    ws.send(JSON.stringify(msg));
  }, 100);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    console.log(`\n${new Date().toLocaleTimeString()} - ${message.type}`);
    
    if (message.type === 'welcome') {
      console.log('Server says:', message.message);
    } else if (message.type === 'subscribed') {
      console.log('✅ Subscribed to:', message.intervals);
    } else if (message.type === 'candleUpdate') {
      updateCount++;
      const candle = message.candle;
      console.log(`📊 Update #${updateCount} for ${message.interval}`);
      console.log(`   Time: ${new Date(candle[0]).toLocaleTimeString()}`);
      console.log(`   OHLC: ${candle[1]}, ${candle[2]}, ${candle[3]}, ${candle[4]}`);
      console.log(`   Volume: ${candle[5]} (type: ${typeof candle[5]})`);
      
      if (lastCandle) {
        console.log(`   Price change: ${candle[4] - lastCandle[4]}`);
        console.log(`   Volume change: ${candle[5] - lastCandle[5]}`);
      }
      
      lastCandle = candle;
    } else if (message.type === 'candleComplete') {
      console.log(`✅ Candle completed for ${message.interval}`);
    } else if (message.type === 'error') {
      console.log(`❌ Error: ${message.message}`);
    } else {
      console.log('Unknown message:', JSON.stringify(message));
    }
  } catch (err) {
    console.error('Parse error:', err.message);
    console.log('Raw data:', data.toString());
  }
});

ws.on('error', (err) => {
  console.error('\n❌ WebSocket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 Disconnected: ${code} - ${reason}`);
  console.log(`Total updates received: ${updateCount}`);
  process.exit();
});

// Run for 3 minutes
setTimeout(() => {
  console.log('\n--- Test Complete ---');
  console.log(`Total updates in 3 minutes: ${updateCount}`);
  console.log(`Average: ${(updateCount / 180).toFixed(2)} updates/second`);
  ws.close();
}, 180000);

// Status updates every 30 seconds
let elapsed = 0;
const statusInterval = setInterval(() => {
  elapsed += 30;
  console.log(`\n--- ${elapsed}s elapsed: ${updateCount} updates so far ---`);
}, 30000);