const WebSocket = require('ws');

console.log('=== Testing WebSocket with Known Active Tokens ===\n');

// Test multiple known tokens
const tokens = [
  { name: 'XRPSS', md5: '2fb15d3b5a3a7d876b92f5dabd96ca38' },
  { name: 'XRP', md5: 'd88f9045459e7b4eccdc2c0975a59191' },
  { name: 'XRPL2024', md5: '8d2c0e1b5a3a7d876b92f5dabd96ca38' },
  { name: 'SOLO', md5: '1cb15d3b5a3a7d876b92f5dabd96ca38' }
];

const updateCounts = {};
const connections = [];

tokens.forEach((token, index) => {
  setTimeout(() => {
    console.log(`\nConnecting to ${token.name}...`);
    const ws = new WebSocket('wss://api.xrpl.to/ws/ohlc');
    connections.push(ws);
    updateCounts[token.name] = 0;
    
    ws.on('open', () => {
      console.log(`✅ ${token.name} connected`);
      
      const msg = {
        type: 'subscribe',
        tokenMd5: token.md5,
        intervals: ['1m']
      };
      
      ws.send(JSON.stringify(msg));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'candleUpdate') {
          updateCounts[token.name]++;
          console.log(`📊 ${token.name} update #${updateCounts[token.name]} at ${new Date().toLocaleTimeString()}`);
          
          if (updateCounts[token.name] === 1) {
            const candle = message.candle;
            console.log(`   Price: ${candle[4]}, Volume: ${candle[5]}`);
          }
        } else if (message.type === 'error') {
          console.log(`❌ ${token.name} error: ${message.message}`);
        } else if (message.type === 'subscribed') {
          console.log(`✅ ${token.name} subscribed successfully`);
        }
      } catch (err) {
        // Ignore parse errors
      }
    });
    
    ws.on('error', (err) => {
      console.error(`${token.name} WebSocket error:`, err.message);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`${token.name} disconnected: ${code} - ${reason}`);
    });
  }, index * 500); // Stagger connections
});

// Run for 2 minutes
setTimeout(() => {
  console.log('\n=== SUMMARY AFTER 2 MINUTES ===');
  Object.entries(updateCounts).forEach(([token, count]) => {
    console.log(`${token}: ${count} updates (${(count / 120).toFixed(2)} updates/sec)`);
  });
  
  connections.forEach(ws => ws.close());
  process.exit();
}, 120000);

// Also show interim report after 30 seconds
setTimeout(() => {
  console.log('\n--- 30 Second Update ---');
  Object.entries(updateCounts).forEach(([token, count]) => {
    console.log(`${token}: ${count} updates so far`);
  });
  console.log('');
}, 30000);