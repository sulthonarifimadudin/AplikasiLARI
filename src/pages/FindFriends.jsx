import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Search, ChevronLeft, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { searchUsers, followUser, unfollowUser, checkIsFollowing } from '../services/socialService';

const FindFriends = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [followingStatus, setFollowingStatus] = useState({}); // { userId: true/false }

    // Debounce Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length >= 3) {
                setIsSearching(true);
                const users = await searchUsers(query);
                // Filter out self
                const filtered = users.filter(u => u.id !== user.id);
                setResults(filtered);

                // Check following status for each result
                const statusMap = {};
                for (const u of filtered) {
                    const isFollowing = await checkIsFollowing(user.id, u.id);
                    statusMap[u.id] = isFollowing;
                }
                setFollowingStatus(statusMap);

                setIsSearching(false);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query, user.id]);

    const handleToggleFollow = async (targetId) => {
        const isFollowing = followingStatus[targetId];

        // Optimistic Update
        setFollowingStatus(prev => ({ ...prev, [targetId]: !isFollowing }));

        let success;
        if (isFollowing) {
            success = await unfollowUser(user.id, targetId);
        } else {
            success = await followUser(user.id, targetId);
        }

        if (!success) {
            // Revert if failed
            setFollowingStatus(prev => ({ ...prev, [targetId]: isFollowing }));
            alert("Gagal mengubah status follow.");
        }
    };

    return (
        <Layout>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-navy-800 dark:text-white">
                    <ChevronLeft />
                </button>
                <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Cari Teman</h1>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari ID atau Nama Runner..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 shadow-sm"
                />
            </div>

            {/* Results */}
            <div className="space-y-3">
                {isSearching ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-navy-500" />
                    </div>
                ) : results.length > 0 ? (
                    results.map(u => (
                        <div key={u.id} className="bg-white dark:bg-navy-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center text-navy-700 dark:text-navy-200 font-bold border border-navy-200 dark:border-navy-700 overflow-hidden">
                                    {u.avatar_url ? (
                                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                                    ) : (
                                        u.full_name?.[0] || u.username?.[0] || '?'
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-navy-900 dark:text-white">{u.full_name || 'Runner'}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{u.username || 'user'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleToggleFollow(u.id)}
                                className={`
                                    px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1
                                    ${followingStatus[u.id]
                                        ? 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700'
                                        : 'bg-navy-600 text-white hover:bg-navy-700 shadow-lg shadow-navy-600/20'}
                                `}
                            >
                                {followingStatus[u.id] ? (
                                    <>
                                        <UserCheck size={14} /> Mengikuti
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={14} /> Ikuti
                                    </>
                                )}
                            </button>
                        </div>
                    ))
                ) : query.length >= 3 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <p>Tidak ditemukan runner dengan nama itu.</p>
                    </div>
                ) : (
                    <div className="text-center py-12 opacity-50">
                        <UserPlus size={48} className="mx-auto text-gray-300 dark:text-navy-700 mb-4" />
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Ketuk kolom pencarian untuk mulai mencari teman lari.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default FindFriends;
