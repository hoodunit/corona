import { array, either, option, record } from "fp-ts"
import { pipe } from "fp-ts/es6/pipeable"
import { eqString } from "fp-ts/lib/Eq"
import { useState } from "react"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { Chart } from "./charts"
import { ChartSection } from "./ChartSection"
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
    option.getOrElse<DateRange>(() => ({start: new Date(), end: new Date()}))
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
    <ChartSection
      title="Covid-19 New Deaths"
      subtitleRelative="New deaths per day, by number of days since 5th death"
      subtitleTimeBased="New deaths per day by date"
      data={filteredData}
      metric="newDeaths"
      minMetric={5}
      dataIsCumulative={false}
    />
    <ChartSection
      title="Covid-19 New Confirmed Cases"
      subtitleRelative="New confirmed cases per day, by number of days since 50th case"
      subtitleTimeBased="New confirmed cases by date"
      data={filteredData}
      metric="newCases"
      minMetric={50}
      dataIsCumulative={false}
    />
    <ChartSection
      title="Covid-19 Deaths"
      subtitleRelative="Cumulative number of deaths, by number of days since 5th death"
      subtitleTimeBased="Cumulative number of deaths by date"
      data={filteredData}
      metric="deaths"
      minMetric={5}
      dataIsCumulative={true}
    />
    <ChartSection
      title="Covid-19 Confirmed Cases"
      subtitleRelative="Cumulative number of confirmed cases, by number of days since 50th case"
      subtitleTimeBased="Cumulative number of confirmed cases by date"
      data={filteredData}
      metric="confirmed"
      minMetric={50}
      dataIsCumulative={true}
    />
    <ChartSection
      title="Covid-19 Confirmed Recoveries"
      subtitleRelative="Cumulative number of confirmed recoveries, by number of days since 50th recovery"
      subtitleTimeBased="Cumulative number of confirmed recoveries by date"
      data={filteredData}
      metric="recovered"
      minMetric={50}
      dataIsCumulative={true}
    />
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
