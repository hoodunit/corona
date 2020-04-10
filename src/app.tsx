import { array, either, option, record } from "fp-ts"
import { pipe } from "fp-ts/es6/pipeable"
import { eqString } from "fp-ts/lib/Eq"
import { useState } from "react"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { LogChart } from "./charts"
import { CoronaData, DateEntry, getData } from "./data"
import { dataDateRange, DateRange } from "./dataHelpers"
import { DateSlider } from "./DateSlider"
import { LoadingIcon } from "./LoadingIcon"
import { decodeRoute, encodeRoute, Route } from "./route"
import { SelectionBar } from "./SelectionBar"
import { smallPlaces } from "./selections"
import { PlaceSelector } from "./selector"
import * as DateFns from "date-fns/fp"

type AppProps = {
  data?: CoronaData
  error?: string
  route: Route
}

const defaultSelected = smallPlaces

const defaultRoute = {
  lastDate: new Date(),
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
  const isSelected = (key: string) => array.elem(eqString)(key, selected)
  const filterSelected = record.filterWithIndex((index: string, entries: Array<DateEntry>) => isSelected(index))
  const selectedData = filterSelected(props.data)
  const dateRange: DateRange = pipe(
    dataDateRange(selectedData),
    option.getOrElse<DateRange>(() => { throw new Error("No date range!??") })
  )
  const [lastDate, setLastDate] = useState(dateRange.end)
  const filteredData = record.map(array.filter((d: DateEntry) => {
    return DateFns.isBefore(lastDate)(d.date) || DateFns.isEqual(d.date, lastDate)
  }))(selectedData)
  window.location.hash = encodeRoute({lastDate, selected})
  return (<div className="content">
    <div className="section">
      <div className="title">Covid-19 Metrics</div>
      <SelectionBar onSelected={setSelected} />
      <div className="date-selector">
        <div className="date-selector__titles">
          <div className="date-selector__titles__title">Last date shown: {DateFns.format("MMM d yyyy")(lastDate)}</div>
          <div className="button" onClick={() => setLastDate(dateRange.end)}>Today</div>
          <div className="button" onClick={() => setLastDate(DateFns.subWeeks(1, dateRange.end))}>One week ago</div>
          <div className="button" onClick={() => setLastDate(DateFns.subMonths(1, dateRange.end))}>One month ago</div>
        </div>
        <DateSlider
          range={dateRange}
          selected={lastDate}
          onSelect={setLastDate}
        />
      </div>
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
          data={record.map(dropWhileBelowCumulative("newDeaths", 5))(filteredData)}
          metric="newDeaths"
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 New Confirmed Cases</div>
      <div className="subtitle">New confirmed cases per day, by number of days since 50th case</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelowCumulative("newCases", 50))(filteredData)}
          metric="newCases"
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 Deaths</div>
      <div className="subtitle">Cumulative number of deaths, by number of days since 5th death</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelow("deaths", 5))(filteredData)}
          metric="deaths"
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 Confirmed Cases</div>
      <div className="subtitle">Cumulative number of confirmed cases, by number of days since 50th case (logarithmic)</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelow("confirmed", 50))(filteredData)}
          metric="confirmed"
        />
      </div>
    </div>
    <div className="section">
      <div className="title">Covid-19 Confirmed Recoveries</div>
      <div className="subtitle">Cumulative number of confirmed recoveries, by number of days since 50th recovery (logarithmic)</div>
      <div className="chart-wrapper">
        <LogChart
          data={record.map(dropWhileBelow("recovered", 50))(filteredData)}
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
