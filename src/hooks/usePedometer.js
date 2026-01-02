import { useState, useEffect, useRef } from 'react';

export const usePedometer = (isRecording) => {
    const [steps, setSteps] = useState(0);
    const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
    const lastUpdate = useRef(0);

    // Threshold to detect a step (sensitivity)
    const THRESHOLD = 10;
    // Minimum time between steps (ms) to avoid double counting
    const STEP_DELAY = 300;

    useEffect(() => {
        if (!isRecording) return;

        const handleMotion = (event) => {
            const { x, y, z } = event.accelerationIncludingGravity;

            if (!x || !y || !z) return;

            const now = Date.now();
            if (now - lastUpdate.current < STEP_DELAY) return;

            const deltaX = Math.abs(lastAcceleration.current.x - x);
            const deltaY = Math.abs(lastAcceleration.current.y - y);
            const deltaZ = Math.abs(lastAcceleration.current.z - z);

            // Simple magnitude calculation
            const speed = deltaX + deltaY + deltaZ;

            if (speed > THRESHOLD) {
                setSteps(prev => prev + 1);
                lastUpdate.current = now;
            }

            lastAcceleration.current = { x, y, z };
        };

        // Add event listener
        window.addEventListener('devicemotion', handleMotion);

        // Request permission for iOS 13+ devices
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        // Permission granted
                    }
                })
                .catch(console.error);
        }

        return () => {
            window.removeEventListener('devicemotion', handleMotion);
        };
    }, [isRecording]);

    const resetSteps = () => setSteps(0);

    return { steps, resetSteps };
};
