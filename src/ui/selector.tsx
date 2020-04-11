import { array } from "fp-ts"
import * as React from "react"
import Select, { ActionMeta } from "react-select"

type PlaceSelectorProps = {
  all: Array<string>
  selected: Array<string>
  onChange: (vals: Array<string>) => void
}

export const PlaceSelector: React.FC<PlaceSelectorProps> = (props) => {
  const options = array.map(mkOption)(props.all)
  const onChange = (newSelected: any, action: ActionMeta) => {
    props.onChange(array.map((s: any) => s.value)(newSelected ?? []))
  }
  return <Select
    value={array.map(mkOption)(props.selected)}
    options={options}
    isMulti
    onChange={onChange}
  />
}

const mkOption = (name: string) => {
  return {
    value: name,
    label: name
  }
}

