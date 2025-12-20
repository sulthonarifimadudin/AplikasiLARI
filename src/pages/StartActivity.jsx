import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTimer } from '../hooks/useTimer';
import { haversineDistance } from '../utils/haversine';
import { calculatePace, formatTime } from '../utils/paceCalculator';
import { saveActivity } from '../services/activityStorage';
import { Play, Pause, Square, Map as MapIcon, Loader2, ChevronLeft } from 'lucide-react';

const StartActivity = () => {
    const [isTracking, setIsTracking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [distance, setDistance] = useState(0);
    const [currentActivityType, setCurrentActivityType] = useState('running');

    // GPS Logic: Always track location (for display), but only record when isTracking && !isPaused
    const isRecording = isTracking && !isPaused;
    const { location, error, routePath, setRoutePath, status, startTracking } = useGeolocation(isRecording);

    const { time, resetTimer } = useTimer(isRecording);
    const navigate = useNavigate();

    // Distance Calculation Logic 
    useEffect(() => {
        if (isRecording && routePath.length > 1) {
            const lastPoint = routePath[routePath.length - 1];
            const prevPoint = routePath[routePath.length - 2];

            const dist = haversineDistance(prevPoint, lastPoint);
            setDistance(prev => prev + dist);
        }
    }, [routePath, isRecording]);

    const handleStart = () => {
        setIsTracking(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        setIsPaused(true);
    };

    const handleResume = () => {
        setIsPaused(false);
    };

    const handleFinish = async () => {
        setIsTracking(false);
        setIsSaving(true);

        const activityData = {
            startTime: Date.now() - (time * 1000),
            duration: time,
            distance: distance,
            pace: calculatePace(distance, time),
            routePath: routePath,
            type: currentActivityType,
            // user_id will be handled by context later
        };

        const saved = await saveActivity(activityData);
        setIsSaving(false);

        if (saved) {
            navigate(`/activity/${saved.id}`);
        } else {
            alert("Gagal menyimpan aktivitas ke database!");
        }
    };

    const currentPace = calculatePace(distance, time);

    return (
        <div className="h-screen flex flex-col bg-navy-950 relative">

            {/* --- INITIAL STATE / ERROR STATE --- */}
            {status !== 'ready' && status !== 'searching' && (
                <div className="absolute inset-0 z-30 bg-navy-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                    <div className="bg-navy-800 p-6 rounded-full mb-6 relative">
                        <div className="absolute inset-0 bg-navy-500 rounded-full animate-ping opacity-20"></div>
                        <MapIcon size={48} className="text-white relative z-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Siapkan GPS</h1>
                    <p className="text-navy-200 mb-8 max-w-xs">
                        {status === 'error' ? (error || "Gagal mendapatkan lokasi.") : "Kami perlu akses lokasi untuk melacak rute lari kamu dengan akurat."}
                    </p>
                    <button
                        onClick={startTracking}
                        className="w-full max-w-xs bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {status === 'error' ? 'Coba Lagi' : '📡 Aktifkan GPS'}
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 text-navy-400 text-sm hover:text-white"
                    >
                        Kembali
                    </button>
                </div>
            )}

            {/* --- LOADING STATE --- */}
            {status === 'searching' && (
                <div className="absolute inset-0 z-30 bg-navy-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                    <Loader2 size={48} className="text-emerald-400 animate-spin mb-6" />
                    <h2 className="text-xl font-bold text-white mb-2">Mencari Satelit...</h2>
                    <p className="text-navy-300">Mohon tunggu sebentar ya.</p>
                </div>
            )}

            {/* --- READY STATE --- */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}>
                <MapView routePath={routePath} currentPos={location} zoom={18} interactive={false} />
            </div>

            {/* Overlay Gradient */}
            {status === 'ready' && <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-transparent to-navy-950/90 pointer-events-none z-0" />}

            {/* Top Bar (Only show when ready/recording) */}
            {status === 'ready' && (
                <div className="absolute top-0 w-full p-4 z-10 flex justify-between items-center text-white animate-in slide-in-from-top">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-navy-900/50 backdrop-blur-md p-2 rounded-full hover:bg-navy-800 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="bg-navy-900/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        GPS: {Math.round(location?.accuracy || 0)}m
                    </div>

                    <select
                        value={currentActivityType}
                        onChange={(e) => setCurrentActivityType(e.target.value)}
                        className="bg-navy-900/50 backdrop-blur-md text-white border border-white/20 rounded-full px-3 py-1 text-xs outline-none"
                        disabled={isTracking}
                    >
                        <option value="running">Lari</option>
                        <option value="walking">Jalan</option>
                        <option value="cycling">Sepeda</option>
                    </select>
                </div>
            )}

            {/* Main Stats Display */}
            {status === 'ready' && (
                <div className="absolute top-[20%] w-full flex flex-col items-center z-10 text-white transition-all duration-500"
                    style={{ transform: isTracking ? 'translateY(0)' : 'translateY(20px)' }}
                >
                    <h1 className="text-7xl font-bold font-mono tracking-tighter drop-shadow-lg">
                        {distance.toFixed(2)}<span className="text-2xl ml-2 font-sans font-medium opacity-80">km</span>
                    </h1>
                    <div className="text-xl opacity-90 mt-2 font-medium bg-navy-900/60 backdrop-blur px-4 py-1 rounded-full">
                        {formatTime(time)}
                    </div>
                </div>
            )}

            {/* Secondary Stats */}
            {status === 'ready' && (
                <div className="absolute bottom-[25%] w-full flex justify-around px-8 z-10">
                    <div className="bg-navy-900/60 backdrop-blur-sm p-3 rounded-xl min-w-[100px] text-center">
                        <p className="text-xs text-navy-200 uppercase tracking-widest">Pace</p>
                        <p className="text-xl font-bold text-white">{currentPace}</p>
                    </div>
                    <div className="bg-navy-900/60 backdrop-blur-sm p-3 rounded-xl min-w-[100px] text-center">
                        <p className="text-xs text-navy-200 uppercase tracking-widest">Kcal</p>
                        <p className="text-xl font-bold text-white">{(distance * 60).toFixed(0)}</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            {status === 'ready' && (
                <div className="absolute bottom-0 w-full p-8 pb-12 z-20 flex justify-center items-center gap-6 animate-in slide-in-from-bottom">
                    {!isTracking && !isSaving ? (
                        <button
                            onClick={handleStart}
                            className="w-24 h-24 bg-navy-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-navy-500/50 hover:scale-105 transition-all active:scale-95 group"
                        >
                            <Play size={40} className="ml-2 group-hover:text-navy-50" fill="currentColor" />
                        </button>
                    ) : isSaving ? (
                        <div className="w-20 h-20 bg-navy-800 rounded-full flex items-center justify-center text-white">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <>
                            {isPaused ? (
                                <>
                                    <button
                                        onClick={handleResume}
                                        className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                                    >
                                        <Play size={28} fill="currentColor" className="ml-1" />
                                    </button>
                                    <button
                                        onClick={handleFinish}
                                        className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                                    >
                                        <Square size={24} fill="currentColor" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-400/40 hover:scale-105 transition-transform active:scale-95 animate-pulse"
                                >
                                    <Pause size={32} fill="currentColor" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default StartActivity;
