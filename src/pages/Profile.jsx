import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <Layout>
            <div className="bg-navy-950 text-white rounded-2xl p-6 mb-6 shadow-lg shadow-navy-900/20">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-navy-500">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Halo, Runners!</h2>
                        <p className="text-navy-200 text-sm">{user?.email}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Keluar Akun</span>
                </button>
            </div>

            <p className="text-center text-gray-400 text-xs mt-8">Este.RUN v1.0.0</p>
        </Layout>
    );
};

export default Profile;
