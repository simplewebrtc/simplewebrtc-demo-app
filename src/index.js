import { Provider } from "react-redux";
import * as UUID from "uuid";
import React from "react";
import ReactDOM from "react-dom";

import { createStore, Actions, Selectors } from "@andyet/simplewebrtc";

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

// We're exposing these here to make it easier for experimenting
// with the actions and selectors in the console.
//
// This is NOT required for SimpleWebRTC to function.
window.store = store;
window.actions = Actions;
window.selectors = Selectors;

const params = new URLSearchParams(window.location.search);

if (!params.get('room')) {
  // We're using a UUID for a random room name here, but that is
  // NOT a requirement for SimpleWebRTC to function.
  window.location = `/?room=${UUID.v4()}`;
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
