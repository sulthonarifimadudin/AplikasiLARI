import { useParams, useNavigate } from 'react-router-dom';
import { getActivityById, updateActivityPhoto, updateActivityTitle, deleteActivity, updateActivityLocation } from '../services/activityStorage';
import { searchPlaces } from '../services/geocoding';
import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import MapView from '../components/MapView';
import StatBox from '../components/StatBox';
import RouteSvgRenderer from '../components/RouteSvgRenderer';
import { formatTime } from '../utils/paceCalculator';
import { Share2, ChevronLeft, Download, Loader2, Camera, User, Image as ImageIcon, Pencil, Trash2, X, Check, MapPin, Search } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

import ShareModal from '../components/ShareModal';

const ActivityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false); // New State

    // Edit State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitleInput, setEditTitleInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Location State
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // (Old export refs removed)

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            const data = await getActivityById(id);
            if (data) {
                setActivity(data);
                setEditTitleInput(data.title || 'Lari Santuy');
                setLocationInput(data.location || '');
            } else {
                console.error("Activity not found");
            }
            setLoading(false);
        };
        fetchDetail();
    }, [id, navigate]);

    // Search Places Handler (Debounced roughly by manual typing speed or onEnter)
    useEffect(() => {
        if (!locationInput || locationInput.length < 3) {
            setSearchResults([]);
            return;
        }

        // Only search if we are ACTIVELY editing and the input changed, to avoid spamming on load
        if (isEditingLocation) {
            const timeoutId = setTimeout(async () => {
                setIsSearching(true);
                const results = await searchPlaces(locationInput);
                setSearchResults(results);
                setIsSearching(false);
            }, 500); // 500ms debounce
            return () => clearTimeout(timeoutId);
        }
    }, [locationInput, isEditingLocation]);

    const handleSelectLocation = async (place) => {
        const placeName = place.display_name; // Short name
        const success = await updateActivityLocation(activity.id, placeName);
        if (success) {
            setActivity(prev => ({ ...prev, location: placeName }));
            setLocationInput(placeName);
            setIsEditingLocation(false);
            setSearchResults([]);
        } else {
            alert("Gagal menyimpan lokasi.");
        }
    };

    const [exportBgMode, setExportBgMode] = useState('photo'); // 'photo' | 'map'

    // Auto-switch to map if no photo available
    useEffect(() => {
        if (activity && !activity.photoUrl) {
            setExportBgMode('map');
        }
    }, [activity]);

    const handleSaveTitle = async () => {
        if (!editTitleInput.trim()) return;
        const success = await updateActivityTitle(activity.id, editTitleInput);
        if (success) {
            setActivity(prev => ({ ...prev, title: editTitleInput }));
            setIsEditingTitle(false);
        } else {
            alert("Gagal menyimpan judul.");
        }
    };

    const handleDeleteActivity = async () => {
        if (window.confirm("Yakin ingin menghapus aktivitas ini? Data tidak bisa dikembalikan.")) {
            setIsDeleting(true);
            const success = await deleteActivity(activity.id);
            if (success) {
                navigate('/');
            } else {
                alert("Gagal menghapus aktivitas.");
                setIsDeleting(false);
            }
        }
    };

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
                backgroundColor: null,
                ignoreElements: (element) => element.classList.contains('no-export') // Ignore edit buttons
            });
            downloadImage(canvas.toDataURL('image/png'), `este-run-post-${activity.title || activity.id}.png`);
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
                scale: 3,
                ignoreElements: (element) => element.classList.contains('no-export')
            });
            downloadImage(canvas.toDataURL('image/png'), `este-run-overlay-${activity.title || activity.id}.png`);
        } catch (err) {
            console.error(err);
            alert("Export transparent gagal.");
        } finally {
            setIsExporting(false);
        }
    };



    const downloadImage = async (dataUrl, filename) => {
        if (Capacitor.isNativePlatform()) {
            try {
                const base64Data = dataUrl.split(',')[1];
                const savedFile = await Filesystem.writeFile({
                    path: filename,
                    data: base64Data,
                    directory: Directory.Cache
                });

                await Share.share({
                    files: [savedFile.uri],
                });
            } catch (error) {
                console.error("Native export failed:", error);
                alert("Gagal membagikan gambar.");
            }
        } else {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
        }
    };

    const handleShareLink = async () => {
        setIsExporting(true);
        const shareUrl = window.location.href;
        const shareTitle = `Lihat lari gue: ${activity.title} (${activity.distance.toFixed(1)}km)`;
        const shareText = `Gue baru aja lari sejauh ${activity.distance.toFixed(2)}km di Este.RUN! Cek detailnya:`;

        try {
            // 1. Capture Image
            if (!standardExportRef.current) return;
            // Wait for map
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(standardExportRef.current, {
                useCORS: true,
                scale: 2,
                allowTaint: true,
                logging: false,
                backgroundColor: null,
                ignoreElements: (element) => element.classList.contains('no-export')
            });

            const dataUrl = canvas.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();
            const fileName = `este-run-${activity.id}.png`;

            if (Capacitor.isNativePlatform()) {
                const base64Data = dataUrl.split(',')[1];
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                    files: [savedFile.uri],
                    dialogTitle: 'Bagikan Aktivitas',
                });
            } else {
                const file = new File([blob], fileName, { type: 'image/png' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl,
                        files: [file]
                    });
                } else if (navigator.share) {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl
                    });
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    alert("Link disalin ke clipboard! (Browser tidak support share gambar)");
                }
            }
        } catch (error) {
            console.error("Error sharing:", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <Layout><div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-navy-900" /></div></Layout>;
    if (!activity) return <Layout>Data tidak ditemukan.</Layout>;

    return (
        <Layout>
            {/* Top Navigation Bar with Delete */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigate('/stats')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="text-navy-900" />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 text-navy-600 dark:text-gray-300 rounded-full transition-colors"
                        title="Bagikan"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={handleDeleteActivity}
                        disabled={isDeleting}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                        title="Hapus Aktivitas"
                    >
                        {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                    </button>
                    <label className="p-2 hover:bg-gray-100 rounded-full text-navy-600 cursor-pointer">
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                activity={activity}
            />

            {/* Standard View (Just for display now, not for export ref) */}
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-8 max-w-md mx-auto">
                {/* Background Layer (z-0) */}
                <div className="absolute inset-0 z-0">
                    {activity.photoUrl ? (
                        <img src={activity.photoUrl} className="w-full h-full object-cover" alt="Activity" />
                    ) : (
                        <div className="w-full h-full relative">
                            <MapView routePath={activity.routePath} interactive={false} zoom={15} />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/20 to-navy-950/40 pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 bg-gradient-to-b from-black/40 via-transparent to-black/80">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <h1 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md">Este.RUN</h1>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-white italic">{activity.title}</h2>
                            <p className="text-white/80 text-xs">{new Date(activity.startTime).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-auto">
                        <div className="flex items-baseline mb-4">
                            <span className="text-[80px] leading-none font-black text-white italic tracking-tighter drop-shadow-2xl">
                                {activity.distance.toFixed(2)}
                            </span>
                            <span className="text-2xl font-bold text-white italic ml-2 opacity-90">KM</span>
                        </div>

                        <div className="flex justify-between border-t border-white/30 pt-4">
                            <div>
                                <p className="text-xs text-white/80 uppercase mb-1">{t('duration')}</p>
                                <p className="text-xl font-bold text-white italic">{formatTime(activity.duration)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/80 uppercase mb-1">{activity.type === 'walking' ? t('steps') : t('pace')}</p>
                                <p className="text-xl font-bold text-white italic">{activity.type === 'walking' ? activity.steps : activity.pace}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/80 uppercase mb-1">{t('cal')}</p>
                                <p className="text-xl font-bold text-white italic">{(activity.distance * 60).toFixed(0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Action Button for Share */}
            <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center">
                <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-orange-600 text-white font-bold italic py-3 px-8 rounded-full shadow-xl shadow-orange-600/40 hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Share2 size={20} />
                    SHARE ACTIVITY
                </button>
            </div>
        </Layout>
    );
};
        </Layout >
    );
};

export default ActivityDetail;
