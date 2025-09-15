import React, { useState, useEffect } from 'react';

// Material
import {
    styled,
    Typography
} from '@mui/material'

const ShowCounterContainer = styled('div') (
    () => `
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        text-decoration: none;
  `
);

const CountDown = styled('div') (
    () => `
        line-height: 1.25rem;
        padding: 0 0.75rem 0 0.75rem;
        align-items: center;
        display: flex;
        flex-direction: column;
  `
);

const DateTimeDisplay = ({ value, type, isDanger }) => {
    return (
        <CountDown>
            <Typography variant='subtitle1'>{value}</Typography>
            <Typography>{type}</Typography>
        </CountDown>
    );
};

// Inline countdown logic (previously useCountdown hook)
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

export default function CountdownTimer({ targetDate }) {
    // Inline countdown hook logic
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

    const [days, hours, minutes, seconds] = getReturnValues(countDown);

    if (days + hours + minutes + seconds <= 0) {
        return (
            <Typography variant='subtitle1'>Time expired</Typography>
        );
    } else {
        return (
            <ShowCounterContainer>
                <DateTimeDisplay value={days} type={'Days'} isDanger={days <= 3} />
                <p>:</p>
                <DateTimeDisplay value={hours} type={'Hours'} isDanger={false} />
                <p>:</p>
                <DateTimeDisplay value={minutes} type={'Mins'} isDanger={false} />
                <p>:</p>
                <DateTimeDisplay value={seconds} type={'Seconds'} isDanger={false} />
            </ShowCounterContainer>
        );
    }
};
