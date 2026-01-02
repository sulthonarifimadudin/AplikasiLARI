import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, searchUsers, followUser, unfollowUser, checkIsFollowing } from '../services/socialService';
import { UserPlus, UserCheck, Trophy, Search, Users, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Social = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('leaderboard'); // 'feed', 'explore', 'leaderboard'
    const [leaderboard, setLeaderboard] = useState([]);
    const [exploreQuery, setExploreQuery] = useState('');
    const [exploreResults, setExploreResults] = useState([]);
    const [followingStatus, setFollowingStatus] = useState({});
    const [loading, setLoading] = useState(false);

    // Fetch Leaderboard when tab active
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            const fetch = async () => {
                setLoading(true);
                const data = await getLeaderboard();
                setLeaderboard(data);
                setLoading(false);
            };
            fetch();
        }
    }, [activeTab]);

    // Handle Explore Search (Same Logic as FindFriends)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (activeTab === 'explore' && exploreQuery.length >= 3) {
                setLoading(true);
                const users = await searchUsers(exploreQuery);
                const filtered = users.filter(u => u.id !== user.id);
                setExploreResults(filtered);

                const statusMap = {};
                for (const u of filtered) {
                    const isFollowing = await checkIsFollowing(user.id, u.id);
                    statusMap[u.id] = isFollowing;
                }
                setFollowingStatus(prev => ({ ...prev, ...statusMap }));
                setLoading(false);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [exploreQuery, activeTab, user.id]);

    const handleToggleFollow = async (targetId) => {
        const isFollowing = followingStatus[targetId];
        setFollowingStatus(prev => ({ ...prev, [targetId]: !isFollowing }));

        let success;
        if (isFollowing) success = await unfollowUser(user.id, targetId);
        else success = await followUser(user.id, targetId);

        if (!success) setFollowingStatus(prev => ({ ...prev, [targetId]: isFollowing }));
    };

    return (
        <Layout>
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">{t('social')}</h2>

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-navy-900 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${activeTab === 'leaderboard' ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Trophy size={16} /> {t('leaderboard')}
                </button>
                <button
                    onClick={() => setActiveTab('explore')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${activeTab === 'explore' ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Search size={16} /> {t('find_friends')}
                </button>
            </div>

            {/* Content Area */}
            <div className="pb-20">
                {activeTab === 'leaderboard' && (
                    <div className="space-y-3">
                        {loading ? <div className="text-center py-8"><Loader2 className="animate-spin inline text-navy-900 dark:text-white" /></div> :
                            leaderboard.map((runner, index) => (
                                <div
                                    key={runner.user_id}
                                    onClick={() => navigate(`/profile/${runner.user_id}`)}
                                    className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-100 dark:border-navy-800 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                        w-8 h-8 flex items-center justify-center font-black italic text-lg rounded-full
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                                index === 1 ? 'bg-gray-100 text-gray-500' :
                                                    index === 2 ? 'bg-orange-100 text-orange-600' : 'text-navy-300'}
                                    `}>
                                            #{index + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                            {runner.avatar_url ? <img src={runner.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-navy-100 flex items-center justify-center text-navy-500 font-bold">{runner.full_name?.[0]}</div>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-navy-900 dark:text-white line-clamp-1">{runner.full_name}</p>
                                            <p className="text-xs text-gray-400">@{runner.username}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg text-navy-900 dark:text-white">{runner.total_distance.toFixed(1)}</p>
                                        <p className="text-[10px] uppercase text-gray-400 font-bold">KM</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {activeTab === 'explore' && (
                    <div>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={exploreQuery}
                                onChange={(e) => setExploreQuery(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                            />
                        </div>
                        <div className="space-y-3">
                            {exploreResults.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => navigate(`/profile/${u.id}`)}
                                    className="bg-white dark:bg-navy-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-navy-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-navy-100 overflow-hidden">
                                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-navy-500">{u.full_name?.[0]}</div>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-navy-900 dark:text-white">{u.full_name}</p>
                                            <p className="text-xs text-gray-400">@{u.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFollow(u.id);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${followingStatus[u.id] ? 'bg-gray-100 dark:bg-navy-800 text-gray-500' : 'bg-navy-600 text-white'}`}
                                    >
                                        {followingStatus[u.id] ? <UserCheck size={12} /> : <UserPlus size={12} />}
                                        {followingStatus[u.id] ? t('following') : t('follow')}
                                    </button>
                                </div>
                            ))}
                            {exploreQuery.length < 3 && <p className="text-center text-gray-400 text-sm mt-8">{t('search_hint')}</p>}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Social;
