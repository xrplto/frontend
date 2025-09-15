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

// Snackbar hook
export const useSnackbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [msg, setMsg] = useState('')
    const [variant, setVariant] = useState('success')

    const openSnackbar = (msg, variant) => {
        setMsg(msg)
        setVariant(variant)
        setIsOpen(true)
    }

    const closeSnackbar = () => {
        setIsOpen(false)
    }

    return { isOpen, msg, variant, openSnackbar, closeSnackbar }
}

// Countdown hook
export const useCountdown = (targetDate) => {
    const countDownDate = new Date(targetDate).getTime();

    const [countDown, setCountDown] = useState(
        countDownDate - new Date().getTime()
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(countDownDate - new Date().getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [countDownDate]);

    return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
    // calculate time left
    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

    return [days, hours, minutes, seconds];
};

// Default export for useDebounce for backwards compatibility
export default useDebounce;