import { Provider } from "react-redux"
import React from "react"
import ReactDOM from "react-dom"
import { createStore, Actions, Selectors } from "@andyet/simplewebrtc"
import App from "./components/App"
import { CONFIG_URL, ROOM_NAME, ROOM_PASSWORD } from "../config"

// The provided `createStore` function makes a basic Redux
// store useful for getting things started. If you want to
// make your own, import `reducer` from '@andyet/simplewebrtc' and
// be sure to assign it to `simplewebrtc` in the top level of
// your state object.
const store = createStore()

// We're exposing these here to make it easier for experimenting
// with the actions and selectors in the console.
//
// This is NOT required for SimpleWebRTC to function.
window.store = store
window.actions = Actions
window.selectors = Selectors

ReactDOM.render(
  <Provider store={store}>
    <App
      configUrl={CONFIG_URL}
      roomName={ROOM_NAME}
      roomPassword={ROOM_PASSWORD}
    />
  </Provider>,
  document.getElementById("app")
)
