
import React, { useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2, Instagram, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import MapView from './MapView';
import RouteSvgRenderer from './RouteSvgRenderer';
import { formatTime } from '../utils/paceCalculator';

const TEMPLATES = [
    { id: 'classic', name: 'Classic', ratio: 'aspect-[4/5]', width: 1080, height: 1350 },
    { id: 'story', name: 'Story', ratio: 'aspect-[9/16]', width: 1080, height: 1920 },
    { id: 'grid', name: 'Grid', ratio: 'aspect-square', width: 1080, height: 1080 },
    { id: 'transparent', name: 'Overlay', ratio: 'aspect-[4/5]', width: 1080, height: 1350, transparent: true },
    { id: 'transparent_story', name: 'Overlay Story', ratio: 'aspect-[9/16]', width: 1080, height: 1920, transparent: true },
];

const ShareModal = ({ isOpen, onClose, activity }) => {
    const [activeTemplate, setActiveTemplate] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef(null);

    if (!isOpen || !activity) return null;

    const currentTemplate = TEMPLATES[activeTemplate];

    const handleShare = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);

        try {
            // Wait for map/images to load
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(exportRef.current, {
                useCORS: true,
                scale: 2, // High resolution
                backgroundColor: currentTemplate.transparent ? null : '#111827', // Transparent or Dark Navy
                logging: false,
            });

            const dataUrl = canvas.toDataURL('image/png');
            const filename = `este-run-${currentTemplate.id}-${activity.id}.png`;

            if (Capacitor.isNativePlatform()) {
                const base64Data = dataUrl.split(',')[1];
                const savedFile = await Filesystem.writeFile({
                    path: filename,
                    data: base64Data,
                    directory: Directory.Cache
                });

                await Share.share({
                    files: [savedFile.uri],
                });
            } else {
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Gagal export gambar.");
        } finally {
            setIsExporting(false);
        }
    };

    // --- TEMPLATE RENDERERS ---

    const renderClassic = () => (
        <div className="w-full h-full relative bg-navy-950 text-white overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                {activity.photoUrl ? (
                    <img src={activity.photoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                    <MapView routePath={activity.routePath} interactive={false} zoom={15} />
                )}
                {/* Strong Gradients (Restored from previous design) */}
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10" />
                {/* Overall Darken for Photo readability */}
                <div className="absolute inset-0 bg-black/20 z-0" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-20 flex flex-col justify-between h-full p-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-black italic tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Este.RUN</h1>
                    <div className="text-right">
                        <h2 className="text-xl font-bold italic drop-shadow-md">{activity.title}</h2>
                        <p className="text-xs opacity-90 drop-shadow-md">{new Date(activity.startTime).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="mt-auto">
                    <div className="flex items-baseline mb-4">
                        <span className="text-[100px] leading-none font-black italic tracking-tighter drop-shadow-2xl" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
                            {activity.distance.toFixed(2)}
                        </span>
                        <span className="text-3xl font-bold ml-3 italic opacity-90 drop-shadow-lg">KM</span>
                    </div>

                    <div className="grid grid-cols-3 gap-6 border-t border-white/40 pt-6">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest opacity-90 mb-1 drop-shadow-md">Duration</p>
                            <p className="text-3xl font-black italic drop-shadow-lg">{formatTime(activity.duration)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest opacity-90 mb-1 drop-shadow-md">
                                {activity.type === 'walking' ? 'Steps' : 'Pace'}
                            </p>
                            <p className="text-3xl font-black italic drop-shadow-lg">
                                {activity.type === 'walking' ? activity.steps : activity.pace}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest opacity-90 mb-1 drop-shadow-md">Cals</p>
                            <p className="text-3xl font-black italic drop-shadow-lg">{(activity.distance * 60).toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStory = () => (
        <div className="w-full h-full relative bg-navy-950 text-white overflow-hidden">
            {/* Full Height Background */}
            <div className="absolute inset-0 z-0">
                {activity.photoUrl ? (
                    <img src={activity.photoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                    <div className="w-full h-full relative">
                        <MapView routePath={activity.routePath} interactive={false} zoom={15} />
                        <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-[1px]" />
                        <div className="absolute inset-0 flex items-center justify-center p-12">
                            <RouteSvgRenderer routePath={activity.routePath} strokeColor="#fdba74" strokeWidth={8} />
                        </div>
                    </div>
                )}
                {/* Stronger Gradients for Story */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full p-10 py-20">
                <div className="text-center">
                    <h1 className="text-5xl font-black italic tracking-tighter mb-4 drop-shadow-2xl">Este.RUN</h1>
                    <div className="inline-block px-5 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/20 shadow-lg">
                        <p className="font-bold text-base drop-shadow-md">{activity.title}</p>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <div className="flex items-baseline justify-center mb-8">
                        <span className="text-[150px] leading-none font-black italic tracking-tighter drop-shadow-2xl" style={{ textShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                            {activity.distance.toFixed(2)}
                        </span>
                        <span className="text-4xl font-bold ml-4 italic opacity-90 drop-shadow-lg">KM</span>
                    </div>
                    <div className="flex justify-center gap-12">
                        <div className="text-center">
                            <p className="text-4xl font-black italic drop-shadow-xl">{formatTime(activity.duration)}</p>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1 drop-shadow-md">Duration</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black italic drop-shadow-xl">{activity.type === 'walking' ? activity.steps : activity.pace}</p>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1 drop-shadow-md">{activity.type === 'walking' ? 'Steps' : 'Pace'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGrid = () => (
        <div className="w-full h-full relative bg-white text-navy-900 overflow-hidden flex flex-col">
            <div className="h-3/5 relative bg-gray-100">
                {activity.photoUrl ? (
                    <img src={activity.photoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                    <MapView routePath={activity.routePath} interactive={false} zoom={15} />
                )}
                {/* Branding Badge */}
                <div className="absolute top-6 left-6 bg-navy-950 text-white px-4 py-1.5 font-black italic text-lg -skew-x-12 shadow-xl">
                    Este.RUN
                </div>
            </div>
            <div className="h-2/5 p-8 bg-white flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold tracking-tight">{activity.title}</h2>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{new Date(activity.startTime).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-6 gap-x-10">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-wider">Distance</p>
                        <p className="text-4xl font-black italic text-navy-950 tracking-tight">{activity.distance.toFixed(2)} <span className="text-base font-bold not-italic text-gray-400">km</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-wider">Time</p>
                        <p className="text-4xl font-black italic text-navy-950 tracking-tight">{formatTime(activity.duration)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-wider">Avg Pace</p>
                        <p className="text-4xl font-black italic text-navy-950 tracking-tight">{activity.pace}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-wider">Calories</p>
                        <p className="text-4xl font-black italic text-navy-950 tracking-tight">{(activity.distance * 60).toFixed(0)}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTransparent = () => (
        // KEY FIX: bg-transparent explicitly
        <div className="w-full h-full relative bg-transparent flex flex-col justify-between p-10">
            {/* Route & Brand Centered - Opacity increased for visibility */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <h1 className="text-[180px] font-black italic text-white rotate-[-30deg] tracking-tighter drop-shadow-2xl">Este.RUN</h1>
            </div>

            <div className="relative z-10 w-full">
                <img src="/ESTE_LOGO.png" className="h-16 w-auto mb-4 drop-shadow-lg" />
                <h2 className="text-5xl font-black italic text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-tight leading-tight w-3/4">{activity.title}</h2>
            </div>

            <div className="relative z-10">
                <div className="flex items-baseline">
                    <span className="text-[140px] leading-none font-black italic text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] tracking-tighter">{activity.distance.toFixed(2)}</span>
                    <span className="text-5xl font-bold text-white ml-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] italic">KM</span>
                </div>
                <div className="flex gap-12 mt-6 border-t-4 border-white/40 pt-6 w-max">
                    <div className="text-white">
                        <p className="text-sm font-bold opacity-100 uppercase drop-shadow-md tracking-widest mb-1">Time</p>
                        <p className="text-4xl font-black italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">{formatTime(activity.duration)}</p>
                    </div>
                    <div className="text-white">
                        <p className="text-sm font-bold opacity-100 uppercase drop-shadow-md tracking-widest mb-1">Pace</p>
                        <p className="text-4xl font-black italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">{activity.pace}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {/* Header */}
                    <div className="px-4 py-2 flex justify-between items-center text-white">
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <X size={20} />
                        </button>
                        <span className="font-bold text-sm uppercase tracking-wider">Share Activity</span>
                        <div className='w-10' /> {/* Spacer */}
                    </div>

                    {/* PREVIEW AREA */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`relative shadow-2xl overflow-hidden bg-gray-900 ${currentTemplate.ratio} max-h-full max-w-full rounded-xl`}
                            ref={exportRef}
                        >
                            {/* Render Active Template */}
                            {activeTemplate === 0 && renderClassic()}
                            {activeTemplate === 1 && renderStory()}
                            {activeTemplate === 2 && renderGrid()}
                            {/* Transparents share same render logic with slight layout tweaks usually, but here same */}
                            {(activeTemplate === 3 || activeTemplate === 4) && renderTransparent()}
                        </motion.div>
                    </div>

                    {/* CAROUSEL SELECTOR */}
                    <div className="px-4 py-4">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                            {TEMPLATES.map((tmpl, idx) => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => setActiveTemplate(idx)}
                                    className={`snap-center flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-all
                                        ${activeTemplate === idx
                                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-white/10 border-white/10 text-gray-400 hover:bg-white/20'}`}
                                >
                                    {tmpl.name}
                                </button>
                            ))}
                        </div>

                        {/* ACTION BUTTON */}
                        <button
                            onClick={handleShare}
                            disabled={isExporting}
                            className="w-full mt-2 bg-white text-navy-950 font-black italic py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            {isExporting ? (
                                <>Loading...</>
                            ) : (
                                <>
                                    <Share2 size={20} />
                                    SHARE NOW
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
