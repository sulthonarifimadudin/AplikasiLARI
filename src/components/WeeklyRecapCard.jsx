
import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Clock, Flame, Zap } from 'lucide-react';

const WeeklyRecapCard = ({ stats }) => {
    if (!stats) return null;

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatPace = (pace) => {
        const m = Math.floor(pace);
        const s = Math.round((pace - m) * 60);
        return `${m}'${s < 10 ? '0' : ''}${s}"`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl mb-6 bg-gradient-to-br ${stats.personaColor}`}
        >
            {/* Background Patttern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-black opacity-10 rounded-full blur-3xl"></div>

            {/* Header */}
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Weekly Wrap</p>
                    <h2 className="text-2xl font-black">Your Week <br />In Motion</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <span className="text-3xl filter drop-shadow-md">{stats.personaEmoji}</span>
                </div>
            </div>

            {/* Main Stat (Distance) */}
            <div className="mt-6 relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black tracking-tighter">
                        {stats.totalDistance.toFixed(1)}
                    </span>
                    <span className="text-lg font-medium opacity-80">km</span>
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mt-2 border border-white/10">
                    You're a {stats.persona}
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
                <div className="text-center">
                    <div className="flex justify-center mb-1 opacity-70"><Clock size={16} /></div>
                    <p className="font-bold text-lg leading-tight">{formatDuration(stats.totalDuration)}</p>
                    <p className="text-[10px] uppercase opacity-60">Time</p>
                </div>
                <div className="text-center border-l border-white/10">
                    <div className="flex justify-center mb-1 opacity-70"><Flame size={16} /></div>
                    <p className="font-bold text-lg leading-tight">{Math.round(stats.totalCalories)}</p>
                    <p className="text-[10px] uppercase opacity-60">Kcal</p>
                </div>
                <div className="text-center border-l border-white/10">
                    <div className="flex justify-center mb-1 opacity-70"><Zap size={16} /></div>
                    <p className="font-bold text-lg leading-tight">{formatPace(stats.bestPace)}</p>
                    <p className="text-[10px] uppercase opacity-60">Best Pace</p>
                </div>
            </div>

            {/* Share Hint (Optional) */}
            <div className="absolute bottom-2 right-4 opacity-50 text-[10px]">
                Powered by Este.RUN
            </div>
        </motion.div>
    );
};

export default WeeklyRecapCard;
