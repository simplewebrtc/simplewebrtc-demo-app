import ReactDOM from "react-dom"
import React from "react"
import App from "./index"

const render = () => ReactDOM.render(<App />, document.getElementById("app"))

if (module.hot) {
  module.hot.accept(() => render())
}

render()
