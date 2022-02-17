import React, { useCallback } from 'react'
import { Scrollbars } from 'react-custom-scrollbars-2'
import { useTheme as useAppTheme } from '../../providers/Theme'

const Scrollbar = (props) => {
  const { forwardedRef = () => {}, ...rest } = props

  const refSetter = useCallback(
    (scrollbarsRef) => {
      if (scrollbarsRef) {
        forwardedRef(scrollbarsRef.view)
      } else {
        forwardedRef(null)
      }
    },
    [forwardedRef]
  )
  return (
    /* native scrollbars needs to be conditionally turned off in rtl */
    <Scrollbars
      hideTracksWhenNotNeeded
      ref={refSetter}
      renderView={(props) =>
          <div
            {...props}
            style={{
              ...props.style,
            }}
          />
      }
      {...rest}
    />
  )
}

export default Scrollbar
