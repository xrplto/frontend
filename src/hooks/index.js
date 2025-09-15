import { useEffect, useState } from 'react'

// Debounce hook
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

        return () => {
            timer &&
                clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

// Default export for useDebounce for backwards compatibility
export default useDebounce;