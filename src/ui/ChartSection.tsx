import { useState } from "react"
import * as React from "react"
import { Averaging } from "./AveragingToggle"
import { Chart, XAxisType } from "./Chart"
import { CoronaData, DateEntry } from "../data"
import { Scale } from "./ScaleToggle"

export type ChartSectionProps = {
  title: string
  subtitleRelative: string
  subtitleTimeBased: string
  data: CoronaData
  metric: keyof DateEntry
  minMetric: number
  dataIsCumulative: boolean
}

export const ChartSection: React.FC<ChartSectionProps> = (props) => {
  const [averaging, setAveraging] = useState<Averaging>("three-day")
  const [scale, setScale] = useState<Scale>("log")
  const [xAxisType, setXAxisType] = useState<XAxisType>("relative")
  return (
    <div className="section">
      <div className="title">{props.title}</div>
      <div className="subtitle">{ xAxisType === "relative" ? props.subtitleRelative : props.subtitleTimeBased }</div>
      <div className="chart-wrapper">
        <Chart
          data={props.data}
          setAveraging={setAveraging}
          setScale={setScale}
          setXAxisType={setXAxisType}
          options={{
            averaging: averaging,
            metric: props.metric,
            minMetric: props.minMetric,
            dataIsCumulative: props.dataIsCumulative,
            scale: scale,
            xAxisType: xAxisType
          }}
        />
      </div>
    </div>
  )
}
