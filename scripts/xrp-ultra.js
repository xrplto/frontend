#!/usr/bin/env node

const xrpl = require('xrpl');

// ULTRA SPEED CONFIG - NO BRAKES
const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';
const MAIN_WALLET_SEED = process.env.MAIN_WALLET_SEED || '';
const BATCH_SIZE = 25; // 25 parallel operations
const CONTINUOUS = true; // Never stop

let stats = {
  wallets: 0,
  xrp: 0,
  startTime: Date.now()
};

async function blitz(client, mainAddress, id) {
  try {
    const w = xrpl.Wallet.generate();
    const fund = await client.fundWallet(w);

    if (fund.balance > 0) {
      const amt = parseFloat(fund.balance) - 1;
      const tx = await client.submitAndWait(
        w.sign(
          await client.autofill({
            TransactionType: 'Payment',
            Account: w.address,
            Destination: mainAddress,
            Amount: xrpl.xrpToDrops(amt)
          })
        ).tx_blob
      );

      if (tx.result.meta.TransactionResult === 'tesSUCCESS') {
        stats.wallets++;
        stats.xrp += amt;
        process.stdout.write(`\r💰 ${stats.wallets} wallets | ${stats.xrp.toFixed(0)} XRP | ${(stats.xrp / ((Date.now() - stats.startTime) / 1000)).toFixed(1)} XRP/s`);
        return true;
      }
    }
  } catch (e) {
    // Silent fail - speed is priority
  }
  return false;
}

async function ultra() {
  let mainWallet;
  if (MAIN_WALLET_SEED) {
    mainWallet = xrpl.Wallet.fromSeed(MAIN_WALLET_SEED);
  } else {
    mainWallet = xrpl.Wallet.generate();
    console.log(`🔑 NEW SEED: ${mainWallet.seed}`);
  }

  console.log(`🎯 Target: ${mainWallet.address}`);
  console.log(`⚡ ULTRA MODE - Press Ctrl+C to stop\n`);

  const client = new xrpl.Client(TESTNET_URL);
  await client.connect();

  if (!MAIN_WALLET_SEED) {
    await client.fundWallet(mainWallet);
  }

  // Continuous parallel processing
  let batch = 0;
  while (CONTINUOUS) {
    const promises = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      promises.push(blitz(client, mainWallet.address, batch * BATCH_SIZE + i));
    }
    await Promise.all(promises);
    batch++;
  }
}

process.on('SIGINT', () => {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  console.log(`\n\n🏁 FINAL: ${stats.wallets} wallets, ${stats.xrp.toFixed(0)} XRP in ${elapsed.toFixed(0)}s`);
  console.log(`⚡ Average: ${(stats.xrp / elapsed).toFixed(1)} XRP/second`);
  process.exit(0);
});

ultra().catch(console.error);