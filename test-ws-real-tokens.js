const WebSocket = require('ws');

console.log('=== Testing WebSocket with Real Active Tokens ===\n');

// Real token MD5 hashes provided by user
const tokens = [
  { name: 'RLUSD', md5: '0dd550278b74cb6690fdae351e8e0df3' },
  { name: 'SOLO', md5: '0413ca7cfc258dfaf698c02fe304e607' },
  { name: 'ARMY', md5: 'cd9499746c1b2e041563a9724330b3e6' },
  { name: 'XRPSS', md5: '2fb15d3b5a3a7d876b92f5dabd96ca38' }
];

const connections = [];
const stats = {};

tokens.forEach((token, index) => {
  setTimeout(() => {
    console.log(`\nConnecting to ${token.name}...`);
    const ws = new WebSocket('wss://api.xrpl.to/ws/ohlc');
    connections.push(ws);
    
    stats[token.name] = {
      updates: 0,
      lastPrice: null,
      priceChanges: 0
    };
    
    ws.on('open', () => {
      console.log(`✅ ${token.name} connected`);
      
      setTimeout(() => {
        const msg = {
          type: 'subscribe',
          tokenMd5: token.md5,
          intervals: ['1m']
        };
        
        ws.send(JSON.stringify(msg));
      }, 100);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'candleUpdate') {
          const stat = stats[token.name];
          stat.updates++;
          
          const candle = message.candle;
          const price = candle[4];
          
          // Track price changes
          if (stat.lastPrice && stat.lastPrice !== price) {
            stat.priceChanges++;
          }
          stat.lastPrice = price;
          
          // Log first update and every 10th update
          if (stat.updates === 1 || stat.updates % 10 === 0) {
            console.log(`\n📊 ${token.name} update #${stat.updates} at ${new Date().toLocaleTimeString()}`);
            console.log(`   Price: ${price}`);
            console.log(`   Volume: ${candle[5]}`);
            console.log(`   Price changes: ${stat.priceChanges}`);
          }
        } else if (message.type === 'error') {
          console.log(`❌ ${token.name} error: ${message.message}`);
        } else if (message.type === 'subscribed') {
          console.log(`✅ ${token.name} subscribed to ${message.intervals}`);
        }
      } catch (err) {
        // Ignore parse errors
      }
    });
    
    ws.on('error', (err) => {
      console.error(`${token.name} error:`, err.message);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`${token.name} disconnected: ${code}`);
    });
  }, index * 1000); // Stagger connections
});

// Status updates
setInterval(() => {
  console.log('\n--- STATUS UPDATE ---');
  Object.entries(stats).forEach(([name, stat]) => {
    if (stat.updates > 0) {
      console.log(`${name}: ${stat.updates} updates, ${stat.priceChanges} price changes, current: ${stat.lastPrice}`);
    } else {
      console.log(`${name}: No updates yet`);
    }
  });
}, 30000);

// Run for 3 minutes
setTimeout(() => {
  console.log('\n\n=== FINAL SUMMARY ===');
  Object.entries(stats).forEach(([name, stat]) => {
    console.log(`${name}:`);
    console.log(`  Total updates: ${stat.updates}`);
    console.log(`  Price changes: ${stat.priceChanges}`);
    console.log(`  Updates/minute: ${(stat.updates / 3).toFixed(2)}`);
    console.log(`  Last price: ${stat.lastPrice}`);
  });
  
  connections.forEach(ws => ws.close());
  process.exit();
}, 180000);