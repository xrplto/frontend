import React, { lazy, Suspense } from 'react';

const PlaceOrder = lazy(() => import('./PlaceOrder'));
const AccountBalance = lazy(() => import('./AccountBalance'));

function TradePanel() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <PlaceOrder />
        <AccountBalance />
      </Suspense>
    </div>
  );
}
