import * as UUID from "uuid"

// ====================================================================
// IMPORTANT SETUP
// ====================================================================
// Replace `YOUR_API_KEY` here with the API key you received when
// signing up for SimpleWebRTC
// --------------------------------------------------------------------
const API_KEY = process.env.API_KEY || "YOUR_API_KEY"
// ====================================================================

if (API_KEY === "YOUR_API_KEY") {
  document.body.innerHTML =
    "<p>You need to configure the app with your API key. See <code>./src/config.js</code>.</p>"
  throw new Error("You need to configure the app with your API key.")
}

export const CONFIG_URL = `https://api.simplewebrtc.com/config/guest/${API_KEY}`

const params = new URLSearchParams(window.location.search)

// We're using a UUID for a random room name here, but that is
// NOT a requirement for SimpleWebRTC to function.
export const ROOM_NAME =
  process.env.ROOM_NAME ||
  params.get("room") ||
  (window.location = `/?room=${UUID.v4()}`)

export const ROOM_PASSWORD =
  process.env.ROOM_PASSWORD || params.get("key") || ""
