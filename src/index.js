import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, Actions } from "@andyet/simplewebrtc";

import App from "./components/App";




// ====================================================================
// IMPORTANT SETUP
// ====================================================================
// Replace `YOUR_API_KEY` here with the API key you received when
// signing up for SimpleWebRTC
// --------------------------------------------------------------------
const API_KEY = 'YOUR_API_KEY';
// ====================================================================





const CONFIG_URL = `https://api.simplewebrtc.com/config/guest/${API_KEY}`


// The provided `createStore` function makes a basic Redux
// store useful for getting things started. If you want to
// make your own, import `reducer` from '@andyet/simplewebrtc' and
// be sure to assign it to `simplewebrtc` in the top level of
// your state object.
const store = createStore();
window.store = store;
window.actions = Actions;

const params = new URLSearchParams(window.location.search);

if (!params.get('room')) {
  window.location = '/?room=simplewebrtc-demo-app';
}

if (API_KEY === 'YOUR_API_KEY') {
  ReactDOM.render((
    <p>You need to configure the app with your API key. See <code>src/index.js</code></p>
  ), document.getElementById("app"))
} else {
  ReactDOM.render(
    <Provider store={store}>
      <App
        configUrl={CONFIG_URL}
        roomName={params.get('room')}
        roomPassword={params.get('key') || ''}
      />
    </Provider>,
    document.getElementById("app")
  );
}
