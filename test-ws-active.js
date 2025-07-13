const WebSocket = require('ws');
const https = require('https');

console.log('=== Active Token WebSocket Test ===\n');

// First, get the most active tokens
function getActiveTokens() {
  console.log('Fetching most active tokens...');
  
  const options = {
    hostname: 'api.xrpl.to',
    path: '/api/tokens?sort=volume_24h&order=desc&limit=5',
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('\nAPI Response:', Object.keys(json));
          const tokens = json.data || json.tokens || json;
          if (Array.isArray(tokens) && tokens.length > 0) {
            console.log('\nTop tokens:');
            tokens.slice(0, 5).forEach((token, i) => {
              console.log(`${i + 1}. ${token.name || token.currency} - MD5: ${token.md5}`);
            });
            resolve(tokens[0]);
          } else {
            console.log('No tokens found in response');
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Test WebSocket with active token
async function testActiveToken() {
  try {
    const activeToken = await getActiveTokens();
    
    if (!activeToken) {
      console.log('No active tokens found');
      return;
    }
    
    console.log(`\nTesting WebSocket with most active token: ${activeToken.name} (${activeToken.md5})\n`);
    
    const ws = new WebSocket('wss://api.xrpl.to/ws/ohlc');
    let updateCount = 0;
    let lastPrices = {};
    
    ws.on('open', () => {
      console.log('✅ Connected to WebSocket');
      
      const msg = {
        type: 'subscribe',
        tokenMd5: activeToken.md5,
        intervals: ['1m', '5m']
      };
      
      console.log('📤 Subscribing to:', activeToken.name);
      ws.send(JSON.stringify(msg));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'candleUpdate') {
          updateCount++;
          const interval = message.interval;
          const candle = message.candle;
          const currentPrice = candle[4];
          
          // Only log if price changed
          if (!lastPrices[interval] || lastPrices[interval] !== currentPrice) {
            console.log(`\n📊 ${interval} Update #${updateCount}`);
            console.log(`   Token: ${activeToken.name}`);
            console.log(`   Time: ${new Date(candle[0]).toLocaleTimeString()}`);
            console.log(`   Price: ${currentPrice} ${lastPrices[interval] ? `(was ${lastPrices[interval]})` : ''}`);
            console.log(`   OHLC: ${candle[1]}, ${candle[2]}, ${candle[3]}, ${candle[4]}`);
            console.log(`   Volume: ${candle[5]}`);
            
            lastPrices[interval] = currentPrice;
          }
        } else if (message.type !== 'welcome' && message.type !== 'subscribed') {
          console.log(`\n${message.type}:`, JSON.stringify(message).substring(0, 200));
        }
      } catch (err) {
        console.error('Parse error:', err.message);
      }
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`\nDisconnected: ${code} - ${reason}`);
      console.log(`Total updates received: ${updateCount}`);
    });
    
    // Run for 2 minutes
    setTimeout(() => {
      console.log('\n--- Test Complete ---');
      console.log(`Total updates in 2 minutes: ${updateCount}`);
      ws.close();
      process.exit();
    }, 120000);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Also test XRPSS token in parallel
function testXRPSS() {
  console.log('\n--- Also testing XRPSS in parallel ---');
  const ws = new WebSocket('wss://api.xrpl.to/ws/ohlc');
  let xrpssUpdates = 0;
  
  ws.on('open', () => {
    const msg = {
      type: 'subscribe',
      tokenMd5: '2fb15d3b5a3a7d876b92f5dabd96ca38',
      intervals: ['1m']
    };
    ws.send(JSON.stringify(msg));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'candleUpdate') {
        xrpssUpdates++;
        if (xrpssUpdates === 1 || xrpssUpdates % 10 === 0) {
          console.log(`📍 XRPSS update #${xrpssUpdates} at ${new Date().toLocaleTimeString()}`);
        }
      }
    } catch (err) {}
  });
}

// Start tests
testActiveToken();
setTimeout(testXRPSS, 1000);