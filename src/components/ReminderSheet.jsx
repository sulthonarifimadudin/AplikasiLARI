
import { useState, useEffect } from 'react';
import { X, Bell, AlarmClock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { scheduleReminder, cancelReminder, getReminderSettings, checkPermission } from '../services/notificationService';

const ReminderSheet = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const [enabled, setEnabled] = useState(false);
    const [time, setTime] = useState('06:00');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const settings = getReminderSettings();
            setEnabled(settings.enabled);
            if (settings.time) setTime(settings.time);
        }
    }, [isOpen]);

    const handleSave = async () => {
        setSaving(true);
        if (enabled) {
            const hasPermission = await checkPermission();
            if (!hasPermission) {
                alert("Izin notifikasi diperlukan untuk mengaktifkan pengingat.");
                setSaving(false);
                return;
            }
            const [hours, minutes] = time.split(':').map(Number);
            await scheduleReminder(hours, minutes);
        } else {
            await cancelReminder();
        }
        setSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-navy-900 w-full max-w-xs rounded-3xl p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-navy-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <AlarmClock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-navy-900 dark:text-white">Pengingat Lari</h3>
                        <p className="text-xs text-gray-500 dark:text-navy-300">Jangan sampai skip lari!</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Aktifkan Pengingat</span>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-navy-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className={`transition-opacity ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Waktu Pengingat</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full text-center text-3xl font-bold p-4 rounded-xl bg-gray-50 dark:bg-navy-950 dark:text-white border-2 border-transparent focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-navy-900 dark:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
                    >
                        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReminderSheet;
