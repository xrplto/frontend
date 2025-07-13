const WebSocket = require('ws');

const WS_URL = 'wss://api.xrpl.to/ws/ohlc';
const TOKEN_MD5 = '2fb15d3b5a3a7d876b92f5dabd96ca38';

console.log('=== WebSocket Response Analysis ===\n');

const ws = new WebSocket(WS_URL);
const messageTypes = {};
const intervals = {};
let messageCount = 0;
let startTime = Date.now();

// Track candle changes
const candleHistory = {
  '1m': [],
  '5m': [],
  '15m': []
};

ws.on('open', () => {
  console.log('✅ Connected at', new Date().toLocaleTimeString());
  
  const msg = {
    type: 'subscribe',
    tokenMd5: TOKEN_MD5,
    intervals: ['1m', '5m', '15m']
  };
  
  console.log('📤 Subscribing to:', msg.intervals.join(', '));
  ws.send(JSON.stringify(msg));
  console.log('\n--- Monitoring for 60 seconds ---\n');
});

ws.on('message', (data) => {
  messageCount++;
  
  try {
    const message = JSON.parse(data);
    
    // Count message types
    messageTypes[message.type] = (messageTypes[message.type] || 0) + 1;
    
    if (message.type === 'candleUpdate') {
      const interval = message.interval;
      const candle = message.candle;
      
      // Count updates per interval
      intervals[interval] = (intervals[interval] || 0) + 1;
      
      // Track candle changes
      if (!candleHistory[interval]) candleHistory[interval] = [];
      
      const history = candleHistory[interval];
      const lastCandle = history[history.length - 1];
      
      let changeType = 'NEW';
      if (lastCandle && lastCandle.timestamp === candle[0]) {
        changeType = 'UPDATE';
        
        // Check what changed
        const changes = [];
        if (lastCandle.high !== candle[2]) changes.push('HIGH');
        if (lastCandle.low !== candle[3]) changes.push('LOW');
        if (lastCandle.close !== candle[4]) changes.push('CLOSE');
        if (lastCandle.volume !== candle[5]) changes.push('VOLUME');
        
        if (changes.length > 0) {
          console.log(`📊 ${interval} - ${changeType} - Changed: ${changes.join(', ')}`);
          console.log(`   Time: ${new Date(candle[0]).toLocaleTimeString()}`);
          console.log(`   Close: ${lastCandle.close} → ${candle[4]} (${candle[4] > lastCandle.close ? '📈' : '📉'})`);
          if (changes.includes('VOLUME')) {
            console.log(`   Volume issue: "${candle[5]}" (type: ${typeof candle[5]})`);
          }
          console.log('');
        }
      } else {
        // New candle
        console.log(`📊 ${interval} - ${changeType} CANDLE`);
        console.log(`   Time: ${new Date(candle[0]).toLocaleTimeString()}`);
        console.log(`   OHLC: ${candle[1]}, ${candle[2]}, ${candle[3]}, ${candle[4]}`);
        console.log('');
      }
      
      // Store candle
      if (changeType === 'NEW') {
        history.push({
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        });
      } else {
        // Update existing
        lastCandle.high = candle[2];
        lastCandle.low = candle[3];
        lastCandle.close = candle[4];
        lastCandle.volume = candle[5];
      }
      
      // Keep only last 10 candles
      if (history.length > 10) history.shift();
      
    } else if (message.type === 'candleComplete') {
      console.log(`✅ ${message.interval} candle completed at ${new Date(message.timestamp).toLocaleTimeString()}\n`);
    } else if (message.type === 'error') {
      console.error('❌ Error:', message.message);
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
  printSummary();
});

// Close after 60 seconds
setTimeout(() => {
  console.log('\n--- Test Complete ---');
  ws.close();
}, 60000);

function printSummary() {
  const duration = (Date.now() - startTime) / 1000;
  
  console.log('\n=== SUMMARY ===');
  console.log(`Duration: ${duration.toFixed(1)}s`);
  console.log(`Total messages: ${messageCount}`);
  console.log(`Messages/second: ${(messageCount / duration).toFixed(2)}`);
  
  console.log('\nMessage Types:');
  Object.entries(messageTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\nUpdates per Interval:');
  Object.entries(intervals).forEach(([interval, count]) => {
    console.log(`  ${interval}: ${count} updates (${(count / duration).toFixed(2)}/sec)`);
  });
  
  console.log('\nCandle History Summary:');
  Object.entries(candleHistory).forEach(([interval, history]) => {
    if (history.length > 0) {
      const first = history[0];
      const last = history[history.length - 1];
      console.log(`  ${interval}:`);
      console.log(`    Candles tracked: ${history.length}`);
      console.log(`    First close: ${first.close}`);
      console.log(`    Last close: ${last.close}`);
      console.log(`    Change: ${((last.close - first.close) / first.close * 100).toFixed(4)}%`);
    }
  });
  
  process.exit();
}