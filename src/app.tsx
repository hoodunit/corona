import { array, either, record } from "fp-ts"
import { eqString } from "fp-ts/lib/Eq"
import { useState } from "react"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { LogChart } from "./charts"
import { CoronaData, DateEntry, getData } from "./data"
import { LoadingIcon } from "./LoadingIcon"
import { decodeRoute, encodeRoute, Route } from "./route"
import { SelectionBar } from "./SelectionBar"
import { smallPlaces } from "./selections"
import { PlaceSelector } from "./selector"

type AppProps = {
  data?: CoronaData
  error?: string
  route: Route
}

const defaultSelected = smallPlaces

const defaultRoute = {
  selected: defaultSelected
}

const App: React.FC<AppProps> = (props) => {
  if (props.error) {
    return <div>{props.error}</div>
  }
  if (!props.data) {
    return <LoadingIcon />
  }
  window["data"] = props.data;
  const allSelectable = record.keys(props.data)
  const [selected, setSelected] = useState(props.route.selected)
  window.location.hash = encodeRoute({selected})
  const isSelected = (key: string) => array.elem(eqString)(key, selected)
  const filterSelected = record.filterWithIndex((index: string, entries: Array<DateEntry>) => isSelected(index))
  const selectedData = filterSelected(props.data)
  return (<div>
    <div className="section">
      <div className="title">Covid-19 Metrics</div>
      <SelectionBar onSelected={setSelected} />
      <PlaceSelector
        all={allSelectable}
        selected={selected}
        onChange={setSelected}
      />
    </div>
    <div className="section">
      <div className="title">Covid-19 New Deaths</div>
      <div className="subtitle">New deaths per day, by number of days since 5th death</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelowCumulative("newDeaths", 5))(selectedData)}
          metric="newDeaths"
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 New Confirmed Cases</div>
      <div className="subtitle">New confirmed cases per day, by number of days since 50th case</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelow("newCases", 50))(selectedData)}
          metric="newCases"
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 Deaths</div>
      <div className="subtitle">Cumulative number of deaths, by number of days since 5th death</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelow("deaths", 5))(selectedData)}
          metric="deaths"
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 Confirmed Cases</div>
      <div className="subtitle">Cumulative number of confirmed cases, by number of days since 50th case (logarithmic)</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelow("confirmed", 50))(selectedData)}
          metric="confirmed"
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

const dropWhileBelow = (metric: string, min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const isBelowMetric = (d: DateEntry) => d[metric] !== null && (d[metric] < min)
  return array.dropLeftWhile(isBelowMetric)(arr)
}

type PartialSum = {
  entries: Array<DateEntry>
  sum: number
}

const dropWhileBelowCumulative = (metric: string, min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const isBelowMetric = (d: DateEntry) => d[metric] !== null && (d[metric] < min)
  const drop = ({entries, sum}: PartialSum, next: DateEntry) => {
    const newSum = sum + (next[metric] || 0)
    if (newSum < min) {
      return {entries: [], sum: newSum}
    }
    return {entries: entries.concat(next), sum: newSum}
  }
  const {entries} = array.reduce({entries: [], sum: 0}, drop)(arr)
  return entries
}

const startApp = () => {
  const appElem = document.getElementById("app")
  const route = decodeRoute(window.location.hash, defaultRoute)
  ReactDOM.render(<App route={route} />, appElem)
  getData()
    .then(dataResult => {
      either.fold((error: string) => {
        ReactDOM.render(<App route={route} error={error} />, appElem)
      }, (data: CoronaData) => {
        ReactDOM.render(<App route={route} data={data} />, appElem)
      })(dataResult)
    })
}

startApp();
