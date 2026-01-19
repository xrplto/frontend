import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';

const DateTimeDisplay = ({ value, type, isDanger, isDark }) => {
  return (
    <div className="flex flex-col items-center px-3">
      <div className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
        {value}
      </div>
      <div className={cn('text-[11px] font-normal', isDark ? 'text-white/60' : 'text-gray-600')}>
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
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

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
      <div className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
        Time expired
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-2">
      <DateTimeDisplay value={days} type="Days" isDanger={days <= 3} isDark={isDark} />
      <span className={cn('text-[15px]', isDark ? 'text-white/60' : 'text-gray-600')}>:</span>
      <DateTimeDisplay value={hours} type="Hours" isDanger={false} isDark={isDark} />
      <span className={cn('text-[15px]', isDark ? 'text-white/60' : 'text-gray-600')}>:</span>
      <DateTimeDisplay value={minutes} type="Mins" isDanger={false} isDark={isDark} />
      <span className={cn('text-[15px]', isDark ? 'text-white/60' : 'text-gray-600')}>:</span>
      <DateTimeDisplay value={seconds} type="Seconds" isDanger={false} isDark={isDark} />
    </div>
  );
}
