import * as React from "react"
import * as ReactDOM from "react-dom"


const App: React.FC<{}> = () => {
  return (
    <div>Hello!</div>
  )
}

const startApp = () => {
  const appElem = document.getElementById("app")
  console.log("Got elem")
  ReactDOM.render(<App />, appElem)
}

startApp();
