// Orderbook service for processing XRPL orderbook data

// Format orderbook data for display
export const formatOrderbookData = (bookData, orderType = 'bids') => {
  if (!bookData || !bookData.asks || !bookData.bids) {
    return [];
  }

  const orders = orderType === 'bids' ? bookData.bids : bookData.asks;

  return orders.map((order, index) => ({
    price: parseFloat(order.rate),
    amount: parseFloat(order.amount),
    total: parseFloat(order.total || order.amount * order.rate),
    sumAmount: order.sumAmount || 0,
    sumValue: order.sumValue || 0,
    avgPrice: order.avgPrice || order.rate,
    isNew: false
  }));
};

// Calculate spread from orderbook data
export const calculateSpread = (bids, asks) => {
  if (!bids || !asks || bids.length === 0 || asks.length === 0) {
    return {
      spreadAmount: 0,
      spreadPercentage: 0,
      highestBid: 0,
      lowestAsk: 0
    };
  }

  // Get the best bid (highest) and best ask (lowest)
  const highestBid = Math.max(
    ...bids.map((bid) => bid.price).filter((p) => !isNaN(p) && isFinite(p))
  );
  const lowestAsk = Math.min(
    ...asks.map((ask) => ask.price).filter((p) => !isNaN(p) && isFinite(p))
  );

  if (!isFinite(highestBid) || !isFinite(lowestAsk) || highestBid <= 0 || lowestAsk <= 0) {
    return {
      spreadAmount: 0,
      spreadPercentage: 0,
      highestBid: 0,
      lowestAsk: 0
    };
  }

  const spreadAmount = lowestAsk - highestBid;
  const spreadPercentage = (spreadAmount / highestBid) * 100;

  return {
    spreadAmount,
    spreadPercentage: isNaN(spreadPercentage) ? 0 : spreadPercentage,
    highestBid,
    lowestAsk
  };
};

// Process raw XRPL orderbook offers
export const processOrderbookOffers = (offers, orderType = 'bids') => {
  if (!offers || offers.length === 0) return [];

  const processed = [];
  let sumAmount = 0;
  let sumValue = 0;

  // Check if we're dealing with XRP
  const firstOffer = offers[0];
  const isXRPGets =
    firstOffer &&
    (typeof firstOffer.TakerGets === 'string' || firstOffer.TakerGets?.currency === 'XRP');
  const isXRPPays =
    firstOffer &&
    (typeof firstOffer.TakerPays === 'string' || firstOffer.TakerPays?.currency === 'XRP');

  // XRP is represented in drops (1 XRP = 1,000,000 drops)
  const XRP_MULTIPLIER = 1000000;

  // Process offers first without sorting
  offers.forEach((offer) => {
    let price = parseFloat(offer.quality) || 1;
    let quantity = 0;
    let total = 0;

    // For asks: we're selling curr1 for curr2 (TakerGets = curr1, TakerPays = curr2)
    // For bids: we're buying curr1 with curr2 (TakerGets = curr2, TakerPays = curr1)

    if (orderType === 'asks') {
      // Asks: selling base currency (curr1) for quote currency (curr2)
      // TakerGets is what's being sold (quantity in base currency)
      if (typeof offer.TakerGets === 'string') {
        // XRP amount in drops
        quantity = parseFloat(offer.TakerGets) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerGets === 'object') {
        quantity = parseFloat(offer.TakerGets.value) || 0;
      }

      // TakerPays is what's being received (total in quote currency)
      if (typeof offer.TakerPays === 'string') {
        // XRP amount in drops
        total = parseFloat(offer.TakerPays) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerPays === 'object') {
        total = parseFloat(offer.TakerPays.value) || 0;
      }

      price = quantity > 0 ? total / quantity : 0;
    } else {
      // Bids: buying base currency (curr1) with quote currency (curr2)
      // TakerGets is what's being received (total in quote currency)
      if (typeof offer.TakerGets === 'string') {
        // XRP amount in drops
        total = parseFloat(offer.TakerGets) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerGets === 'object') {
        total = parseFloat(offer.TakerGets.value) || 0;
      }

      // TakerPays is what's being offered (quantity in base currency)
      if (typeof offer.TakerPays === 'string') {
        // XRP amount in drops
        quantity = parseFloat(offer.TakerPays) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerPays === 'object') {
        quantity = parseFloat(offer.TakerPays.value) || 0;
      }

      price = quantity > 0 ? total / quantity : 0;
    }

    // Only add valid offers
    if (price > 0 && quantity > 0 && total > 0 && !isNaN(price) && isFinite(price)) {
      sumAmount += quantity;
      sumValue += total;

      processed.push({
        price: price,
        amount: quantity,
        total: total,
        value: total,
        sumAmount: sumAmount,
        sumValue: sumValue,
        avgPrice: sumAmount > 0 ? sumValue / sumAmount : 0,
        isNew: false
      });
    }
  });

  // Sort the processed offers by price
  // For bids: highest price first (descending)
  // For asks: lowest price first (ascending)
  processed.sort((a, b) => {
    return orderType === 'bids' ? b.price - a.price : a.price - b.price;
  });

  // Recalculate cumulative sums after sorting
  let cumSum = 0;
  let cumValue = 0;
  processed.forEach((order) => {
    cumSum += order.amount;
    cumValue += order.total;
    order.sumAmount = cumSum;
    order.sumValue = cumValue;
    order.avgPrice = cumSum > 0 ? cumValue / cumSum : 0;
  });

  return processed;
};
