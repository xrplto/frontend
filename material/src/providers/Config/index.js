import { useContext } from 'react'
import Context from './Context'
export { default } from './Provider.js'

export function useConfig() {
  return useContext(Context)
}
