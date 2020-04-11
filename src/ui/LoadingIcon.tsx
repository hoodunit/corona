import * as React from 'react'

export const LoadingIcon = (_props: {}) => {
  return (
    <div className="loading-icon">
      <div className="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  )
}
