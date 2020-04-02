import { record } from "fp-ts"
import { useState } from "react"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { LogChart } from "./charts"
import { CoronaData, getData } from "./data"
import { PlaceSelector } from "./selector"

type AppProps = {
  data?: CoronaData
}

const defaultSelected = [
  "Finland",
  "Italy",
  "Spain",
  "US",
  "Sweden",
  "US-Arizona",
  "US-Minnesota",
  "US-New York",
  "US-Washington",
  "US-Minnesota-Hennepin",
  "US-Arizona-Coconino",
  "US-Washington-Clark",
]

  const App: React.FC<AppProps> = (props) => {
  if (!props.data) {
    return <div>Loading</div>
  }
  window["data"] = props.data;
  const allSelectable = record.keys(props.data)
  const [selected, setSelected] = useState(defaultSelected)
  return (<div>
    <div className="section">
      <div className="title">Covid-19 Metrics</div>
      <PlaceSelector
        all={allSelectable}
        selected={selected}
        onChange={setSelected}
      />
    </div>
    <div className="section">
      <div className="title">Covid-19 New Deaths</div>
      <div className="subtitle">New deaths per day, by number of days since first death</div>
      <div className="subtitle">Empty points are days where no new deaths were recorded </div>
      <div className="chart-wrapper">
        <LogChart
          data={props.data}
          selected={selected}
          metric="newDeaths"
          minMetric={1}
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 Deaths</div>
      <div className="subtitle">Cumulative number of deaths, by number of days since 1st death</div>
      <div className="chart-wrapper">
        <LogChart
          data={props.data}
          selected={selected}
          metric="deaths"
          minMetric={1}
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 Confirmed Cases</div>
      <div className="subtitle">Cumulative number of confirmed cases, by number of days since 50th case (logarithmic)</div>
      <div className="chart-wrapper">
        <LogChart
          data={props.data}
          selected={selected}
          metric="confirmed"
          minMetric={50}
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Data Sources</div>
      <div className="paragraph">Country-level data: <a href="https://github.com/pomber/covid19">https://github.com/pomber/covid19</a></div>
      <div className="paragraph">State and county-level data: <a href="https://github.com/nytimes/covid-19-data">https://github.com/nytimes/covid-19-data</a></div>
      <div className="paragraph">Source code: <a href="https://github.com/hoodunit/corona">https://github.com/hoodunit/corona</a></div>
    </div>
  </div>)
}

const startApp = () => {
  const appElem = document.getElementById("app")
  ReactDOM.render(<App />, appElem)
  getData()
    .then(data => {
      ReactDOM.render(<App data={data} />, appElem)
    })
}

startApp();
