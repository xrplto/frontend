import React, { useState, useEffect } from 'react';
import { cn } from 'src/utils/cn';

const DateTimeDisplay = ({ value, type, isDanger }) => {
  return (
    <div className="flex flex-col items-center px-3">
      <div className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
        {value}
      </div>
      <div className={cn('text-[11px] font-normal', 'text-gray-600 dark:text-white/60')}>
        {type}
      </div>
    </div>
  );
};

// Inline countdown logic
const getReturnValues = (countDown) => {
  const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
  const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [days, hours, minutes, seconds];
};

export default function CountdownTimer({ targetDate }) {
  const countDownDate = new Date(targetDate).getTime();
  const [countDown, setCountDown] = useState(countDownDate - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownDate - new Date().getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [countDownDate]);

  const [days, hours, minutes, seconds] = getReturnValues(countDown);

  if (days + hours + minutes + seconds <= 0) {
    return (
      <div className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
        Time expired
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-2">
      <DateTimeDisplay value={days} type="Days" isDanger={days <= 3} />
      <span className={cn('text-[15px]', 'text-gray-600 dark:text-white/60')}>:</span>
      <DateTimeDisplay value={hours} type="Hours" isDanger={false} />
      <span className={cn('text-[15px]', 'text-gray-600 dark:text-white/60')}>:</span>
      <DateTimeDisplay value={minutes} type="Mins" isDanger={false} />
      <span className={cn('text-[15px]', 'text-gray-600 dark:text-white/60')}>:</span>
      <DateTimeDisplay value={seconds} type="Seconds" isDanger={false} />
    </div>
  );
}
