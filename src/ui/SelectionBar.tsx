import * as React from "react"
import { CoronaData } from "../data"
import { topByDeaths } from "../dataHelpers"
import {
  largeAndSmall,
  epicenters,
  smallPlaces,
  usStates,
  nordicsPlus,
  europeanUnion,
  finlandSweden
} from "../selections"

type SelectionOption = {
  label: string
  selected: Array<string>
}

export type SelectionBarProps = {
  data: CoronaData
  onSelected: (selected: Array<string>) => void
}

export const SelectionBar: React.FC<SelectionBarProps> = (props) => {
  const options: Array<SelectionOption> = [
    {label: "Top 10 By Deaths", selected: topByDeaths(props.data, 10)},
    {label: "Epicenters", selected: epicenters},
    {label: "U.S. states", selected: usStates},
    {label: "Nordics+", selected: nordicsPlus},
    {label: "European Union", selected: europeanUnion},
    {label: "Large and small", selected: largeAndSmall},
    {label: "Local areas", selected: smallPlaces},
    {label: "Finland & Sweden", selected: finlandSweden},
  ]
  return <div className="selection-bar">
    { options.map((opts) => {
      return <SelectOption
        {...opts}
        key={opts.label}
        onClick={props.onSelected}
      />
    })}
  </div>
}

export type SelectOptionProps = {
  label: string
  selected: Array<string>
  onClick: (selected: Array<string>) => void
}

export const SelectOption: React.FC<SelectOptionProps> = (props) => {
  const onClick = () => {
    props.onClick(props.selected)
  }
  return <div className="button" onClick={onClick}>{props.label}</div>
}
