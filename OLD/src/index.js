import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import store from './store'
import reportWebVitals from './reportWebVitals';
import './index.scss';
import './i18n';

const LazyApp = lazy(() => import("./App"))

ReactDOM.render(
    <Provider store={store}>
      <Suspense fallback={<div/>}>
        <LazyApp />
      </Suspense>
    </Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
