import { useParams, useNavigate } from 'react-router-dom';
import { getActivityById } from '../services/activityStorage';
import { updateActivityPhoto } from '../services/activityStorage'; // Need to add this
import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import MapView from '../components/MapView';
import StatBox from '../components/StatBox';
import RouteSvgRenderer from '../components/RouteSvgRenderer';
import { formatTime } from '../utils/paceCalculator';
import { Share2, ChevronLeft, Download, Loader2, Camera, User, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const ActivityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);

    // Export Refs
    const standardExportRef = useRef(null);
    const transparentExportRef = useRef(null);

    const [isExporting, setIsExporting] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            const data = await getActivityById(id);
            if (data) {
                setActivity(data);
            } else {
                console.error("Activity not found");
            }
            setLoading(false);
        };
        fetchDetail();
    }, [id, navigate]);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            const data = await getActivityById(id);
            if (data) {
                setActivity(data);
            } else {
                console.error("Activity not found");
            }
            setLoading(false);
        };
        fetchDetail();
    }, [id, navigate]);

    const [exportBgMode, setExportBgMode] = useState('photo'); // 'photo' | 'map'

    // Auto-switch to map if no photo available
    useEffect(() => {
        if (activity && !activity.photoUrl) {
            setExportBgMode('map');
        }
    }, [activity]);

    const handlePhotoUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file || !user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${activity.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('activity-photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('activity-photos')
                .getPublicUrl(fileName);

            // Update database record
            await updateActivityPhoto(activity.id, publicUrl);

            // Update local state
            setActivity(prev => ({ ...prev, photoUrl: publicUrl }));
            setExportBgMode('photo'); // Auto switch to photo after upload
            alert("Foto berhasil diupload!");

        } catch (error) {
            console.error(error);
            alert("Gagal upload foto. Pastikan bucket 'activity-photos' sudah dibuat di Supabase.");
        } finally {
            setUploading(false);
        }
    };

    const handleStandardExport = async () => {
        if (!standardExportRef.current) return;
        setIsExporting(true);
        try {
            // Wait for map to render if switching modes
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(standardExportRef.current, {
                useCORS: true,
                scale: 3, // Higher resolution
                allowTaint: true,
                logging: false,
                backgroundColor: null
            });
            downloadImage(canvas.toDataURL('image/png'), `este-run-post-${activity.id}.png`);
        } catch (err) {
            console.error(err);
            alert("Export gagal. Coba refresh halaman.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleTransparentExport = async () => {
        if (!transparentExportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(transparentExportRef.current, {
                backgroundColor: null,
                scale: 3
            });
            downloadImage(canvas.toDataURL('image/png'), `este-run-overlay-${activity.id}.png`);
        } catch (err) {
            console.error(err);
            alert("Export transparent gagal.");
        } finally {
            setIsExporting(false);
        }
    };

    const downloadImage = (dataUrl, filename) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    };

    if (loading) return <Layout><div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-navy-900" /></div></Layout>;
    if (!activity) return <Layout>Data tidak ditemukan.</Layout>;

    return (
        <Layout>
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigate('/stats')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="text-navy-900" />
                </button>
                <div className="flex gap-2">
                    <label className="p-2 hover:bg-gray-100 rounded-full text-navy-600 cursor-pointer">
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* --- STANDARD VIEW (With Map/Photo) --- */}
            <div ref={standardExportRef} className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-8 max-w-md mx-auto">
                {/* Background Layer (z-0) */}
                <div className="absolute inset-0 z-0">
                    {exportBgMode === 'photo' && activity.photoUrl ? (
                        <img src={activity.photoUrl} className="w-full h-full object-cover" alt="Activity" crossOrigin="anonymous" />
                    ) : (
                        <div className="w-full h-full relative">
                            <MapView routePath={activity.routePath} interactive={false} zoom={15} />
                        </div>
                    )}
                </div>

                {/* Gradient Layer (z-10) - Ensures visibility over Map */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Stronger Gradients for Readability - ALWAYS RENDERED */}
                    {/* Top Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-20" />
                    {/* Bottom Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none z-20" />
                </div>

                {/* Content Overlay (z-30) */}
                <div className="absolute inset-0 z-30 flex flex-col justify-between p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Este.RUN</h1>
                            <p className="text-white font-bold text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{new Date(activity.startTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="text-white font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-right text-[10px] bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 uppercase tracking-widest">
                            {activity.type}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-auto">
                        <div className="flex items-baseline mb-4">
                            <span className="text-[100px] leading-none font-black text-white italic tracking-tighter drop-shadow-2xl" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
                                {activity.distance.toFixed(2)}
                            </span>
                            <span className="text-3xl font-bold text-white italic ml-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-90">KM</span>
                        </div>

                        <div className="flex gap-8 border-t border-white/30 pt-4">
                            <div>
                                <p className="text-white/90 font-bold text-[10px] uppercase tracking-widest mb-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">WAKTU</p>
                                <p className="text-2xl font-black text-white italic tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{formatTime(activity.duration)}</p>
                            </div>
                            <div>
                                <p className="text-white/90 font-bold text-[10px] uppercase tracking-widest mb-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">PACE</p>
                                <p className="text-2xl font-black text-white italic tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{activity.pace}</p>
                            </div>
                            <div>
                                <p className="text-white/90 font-bold text-[10px] uppercase tracking-widest mb-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">KCAL</p>
                                <p className="text-2xl font-black text-white italic tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{(activity.distance * 60).toFixed(0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- HIDDEN TRANSPARENT OVERLAY TEMPLATE --- */}
            <div className="absolute top-[-9999px] left-[-9999px]">
                <div ref={transparentExportRef} className="w-[500px] h-[500px] flex flex-col justify-between p-8 relative" style={{ background: 'transparent' }}>

                    {/* Route Layer */}
                    <div className="absolute inset-0 flex items-center justify-center z-0 opacity-90 scale-90">
                        {/* Stroke White for outline, Orange for path */}
                        <div className="absolute inset-0 flex items-center justify-center drop-shadow-2xl">
                            <RouteSvgRenderer routePath={activity.routePath} width={450} height={450} strokeColor="#ffffff" strokeWidth={12} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <RouteSvgRenderer routePath={activity.routePath} width={450} height={450} strokeColor="#F97316" strokeWidth={8} />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="z-10 mt-2 flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Este.RUN</h1>
                            <p className="text-white/90 font-bold text-lg drop-shadow-md">{new Date(activity.startTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="text-white/80 font-bold drop-shadow-md text-right">
                            <p>{activity.type === 'running' ? 'LARI' : activity.type === 'cycling' ? 'SEPEDA' : 'JALAN'}</p>
                        </div>
                    </div>

                    {/* Main Stats (Bottom) */}
                    <div className="z-10 mt-auto">
                        {/* Huge Distance */}
                        <div className="flex items-baseline mb-4">
                            <span className="text-[110px] leading-none font-black text-white italic tracking-tighter drop-shadow-xl" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                {activity.distance.toFixed(2)}
                            </span>
                            <span className="text-4xl font-bold text-white italic ml-4 drop-shadow-lg">KM</span>
                        </div>

                        {/* Secondary Stats Row */}
                        <div className="flex gap-12 items-end border-t-2 border-white/50 pt-4">
                            <div>
                                <p className="text-white/90 font-bold text-xs uppercase tracking-widest mb-1 drop-shadow-md">WAKTU</p>
                                <p className="text-4xl font-black text-white italic tracking-tight drop-shadow-lg">{formatTime(activity.duration)}</p>
                            </div>
                            <div>
                                <p className="text-white/90 font-bold text-xs uppercase tracking-widest mb-1 drop-shadow-md">PACE</p>
                                <p className="text-4xl font-black text-white italic tracking-tight drop-shadow-lg">{activity.pace}</p>
                            </div>
                            <div>
                                <p className="text-white/90 font-bold text-xs uppercase tracking-widest mb-1 drop-shadow-md">KCAL</p>
                                <p className="text-4xl font-black text-white italic tracking-tight drop-shadow-lg">{(activity.distance * 60).toFixed(0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
                <button onClick={handleStandardExport} disabled={isExporting} className="w-full bg-navy-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform hover:bg-navy-800">
                    <Download size={20} />
                    Simpan Gambar Full
                </button>
                <button onClick={handleTransparentExport} disabled={isExporting} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform hover:bg-orange-700">
                    <ImageIcon size={20} />
                    Simpan Overlay (Transparan)
                </button>
            </div>
        </Layout>
    );
};

export default ActivityDetail;
