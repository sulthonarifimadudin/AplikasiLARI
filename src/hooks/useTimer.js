import { useState, useEffect, useRef } from 'react';

export const useTimer = (isRunning) => {
    const [time, setTime] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const resetTimer = () => setTime(0);

    return { time, resetTimer };
};
