import { useEffect, useState } from 'react';

interface TimerState {
  time: string
  isGameActive: boolean;
}

const schedule = [
  { start: '08:00', end: '08:13', isBreak: false },
  { start: '08:13', end: '08:50', isBreak: true },
  { start: '08:50', end: '09:30', isBreak: false },
  { start: '09:30', end: '09:40', isBreak: true },
  { start: '09:40', end: '10:20', isBreak: false },
  { start: '10:20', end: '10:40', isBreak: true },
  { start: '10:40', end: '11:20', isBreak: false },
  { start: '11:20', end: '11:40', isBreak: true },
  { start: '11:40', end: '12:20', isBreak: false },
  { start: '12:20', end: '12:30', isBreak: true },
  { start: '12:30', end: '13:10', isBreak: false },
  { start: '13:10', end: '13:20', isBreak: true },
  { start: '13:20', end: '14:00', isBreak: false }
];

const getNextPeriod = () => {
  const now = new Date();
  for (const period of schedule) {
    const [startHour, startMinute] = period.start.split(':').map(Number);
    const [endHour, endMinute] = period.end.split(':').map(Number);

    const start = new Date(now);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(now);
    end.setHours(endHour, endMinute, 0, 0);

    if (now >= start && now < end) {
      return { isBreak: period.isBreak, timeLeft: end.getTime() - now.getTime() };
    }
  }
  return { isBreak: false, timeLeft: 0 };
};
const useSchoolTimer = (): TimerState => {
  const [time, setTime] = useState('00:00');
  const [isGameActive, setIsGameActive] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const { isBreak, timeLeft } = getNextPeriod();

      setIsGameActive(isBreak);

      const mins = Math.floor(timeLeft / 1000 / 60);
      const secs = Math.floor((timeLeft / 1000) % 60);

      setTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return { time, isGameActive };
};
export default useSchoolTimer;