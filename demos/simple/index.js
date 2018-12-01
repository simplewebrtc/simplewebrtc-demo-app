import { Provider } from "react-redux"
import React from "react"
import * as SWRTC from "@andyet/simplewebrtc"
import { CONFIG_URL, ROOM_NAME, ROOM_PASSWORD } from "../config"

const store = SWRTC.createStore()

export default () => (
  <Provider store={store}>
    <SWRTC.Provider configUrl={CONFIG_URL}>
      {/* Render based on the connection state */}
      <SWRTC.Connecting>
        <h1>Connecting...</h1>
      </SWRTC.Connecting>

      <SWRTC.Connected>
        <h1>Connected!</h1>
        {/* Request the user's media */}
        <SWRTC.RequestUserMedia audio video auto />

        {/* Connect to a room with a name and optional password */}
        <SWRTC.Room name={ROOM_NAME} password={ROOM_PASSWORD}>
          {props => {
            /* Use the rest of the SWRTC React Components to render your UI */
            return <pre>{JSON.stringify(props, null, 4)}</pre>
          }}
        </SWRTC.Room>
      </SWRTC.Connected>
    </SWRTC.Provider>
  </Provider>
)
