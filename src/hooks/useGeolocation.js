import { useState, useEffect, useRef } from 'react';

export const useGeolocation = (isRecording) => {
    // Status: 'idle' | 'searching' | 'ready' | 'error'
    const [status, setStatus] = useState('idle');
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [routePath, setRoutePath] = useState([]);

    const watchIdRef = useRef(null);

    // Function to manually start/request GPS
    const startTracking = () => {
        if (!navigator.geolocation) {
            setError("Geolocation tidak didukung di browser ini.");
            setStatus('error');
            return;
        }

        // Check for Secure Context (HTTPS)
        if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            setError("GPS Wajib HTTPS! Ganti alamat di atas dari http:// jadi https://");
            setStatus('error');
            return;
        }

        setStatus('searching');
        setError(null);

        const options = {
            enableHighAccuracy: true,
            timeout: 30000, // Increased to 30s for Cold Start
            maximumAge: 0
        };

        const onSuccess = (pos) => {
            const { latitude, longitude, accuracy, speed } = pos.coords;
            const newPoint = { lat: latitude, lng: longitude };
            const metaPoint = { ...newPoint, timestamp: pos.timestamp, accuracy, speed };

            setStatus('ready');
            setLocation(metaPoint);
        };

        const fail = (err) => {
            console.error("Geo Error High Accuracy:", err);

            // FALLBACK: Try invalidating high accuracy and using network location
            console.log("Attempting Low Accuracy Fallback...");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("Low Accuracy Success");
                    onSuccess(pos); // Use same success handler
                    // Re-watch with low accuracy if needed, or just accept this for now
                    // For tracking, we might want to keep watching, but let's at least get PAST the loading screen
                },
                (err2) => {
                    console.error("Geo Error Low Accuracy:", err2);
                    if (status !== 'ready') {
                        setStatus('error');
                        if (err.code === 1) setError("Izin lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.");
                        else if (err.code === 3) setError("Sinyal GPS lemah / Timeout. Coba di luar ruangan.");
                        else setError(err.message || "Gagal mendapatkan lokasi.");
                    }
                },
                { enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 }
            );
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, fail, options);
    };

    // Effect to append path ONLY when recording
    useEffect(() => {
        if (isRecording && location) {
            setRoutePath((prev) => [...prev, { lat: location.lat, lng: location.lng }]);
        }
    }, [isRecording, location]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return { location, error, routePath, setRoutePath, status, startTracking };
};
