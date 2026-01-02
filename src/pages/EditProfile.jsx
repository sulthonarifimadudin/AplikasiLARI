import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { ChevronLeft, Camera, Save, Loader2, Lock } from 'lucide-react';
import { getProfile, updateProfile, uploadAvatar, updateUserPassword } from '../services/profileService';

const EditProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                setLoading(true);
                const profile = await getProfile(user.id);
                if (profile) {
                    setUsername(profile.username || '');
                    setFullName(profile.full_name || '');
                    setBio(profile.bio || '');
                    setAvatarUrl(profile.avatar_url);
                }
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleAvatarChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setAvatarFile(file);
            // Create preview
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        // 1. Upload Avatar if changed
        let finalAvatarUrl = avatarUrl;
        if (avatarFile) {
            const uploadedUrl = await uploadAvatar(user.id, avatarFile);
            if (uploadedUrl) {
                finalAvatarUrl = uploadedUrl;
            }
        }

        // 2. Update Profile Data
        const updates = {
            username,
            full_name: fullName,
            bio,
            avatar_url: finalAvatarUrl,
        };

        const success = await updateProfile(user.id, updates);

        // 3. Update Password if provided
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                alert("Password konfirmasi tidak cocok!");
                setSaving(false);
                return;
            }
            if (newPassword.length < 6) {
                alert("Password minimal 6 karakter.");
                setSaving(false);
                return;
            }
            const passSuccess = await updateUserPassword(newPassword);
            if (!passSuccess) {
                alert("Gagal mengubah password.");
            } else {
                alert("Password berhasil diubah!");
            }
        }

        if (success) {
            alert("Profil berhasil disimpan!");
            navigate('/profile');
        } else {
            alert("Gagal memperbarui profil.");
        }
        setSaving(false);
    };

    if (loading) return <Layout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div></Layout>;

    return (
        <Layout>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-navy-800 dark:text-white">
                    <ChevronLeft />
                </button>
                <h1 className="text-2xl font-bold dark:text-white">Edit Profil</h1>
            </div>

            <form onSubmit={handleSave} className="space-y-6 pb-12">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-navy-500 bg-navy-800">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-navy-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-navy-500 transition-colors">
                            <Camera size={20} />
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">Klik ikon kamera untuk ganti foto</p>
                </div>

                {/* Info Section */}
                <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-800 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nama Anda"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@username"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Ceritakan sedikit tentang dirimu (Hobi, target lari, dll)"
                            rows="3"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                        />
                    </div>
                </div>

                {/* Password Section */}
                <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-800 space-y-4">
                    <h3 className="font-bold flex items-center gap-2 dark:text-white">
                        <Lock size={18} /> Ganti Password
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Kosongkan jika tidak ingin mengganti"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                    </div>
                    {newPassword && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konfirmasi Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ketik ulang password baru"
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-navy-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-navy-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    Simpan Perubahan
                </button>
            </form>
        </Layout>
    );
};

export default EditProfile;
