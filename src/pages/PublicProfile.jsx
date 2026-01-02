import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ActivityCard from '../components/ActivityCard';
import { ChevronLeft, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile } from '../services/profileService';
import { getSocialStats, followUser, unfollowUser, checkIsFollowing } from '../services/socialService';
import { getActivitiesByUserId } from '../services/activityStorage';
import { useLanguage } from '../contexts/LanguageContext';

const PublicProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [activities, setActivities] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect to own profile if ID matches
        if (user && id === user.id) {
            navigate('/profile');
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const [prof, st, acts, following] = await Promise.all([
                    getProfile(id),
                    getSocialStats(id),
                    getActivitiesByUserId(id),
                    user ? checkIsFollowing(user.id, id) : Promise.resolve(false)
                ]);
                setProfile(prof);
                setStats(st);
                setActivities(acts);
                setIsFollowing(following);
            } catch (error) {
                console.error("Error loading public profile:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, user, navigate]);

    const handleFollow = async () => {
        if (!user) return;

        // Optimistic update
        setIsFollowing(!isFollowing);
        setStats(prev => ({
            ...prev,
            followers: isFollowing ? prev.followers - 1 : prev.followers + 1
        }));

        let success;
        if (isFollowing) {
            success = await unfollowUser(user.id, id);
        } else {
            success = await followUser(user.id, id);
        }

        if (!success) {
            // Revert
            setIsFollowing(isFollowing);
            setStats(prev => ({
                ...prev,
                followers: isFollowing ? prev.followers + 1 : prev.followers - 1
            }));
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-navy-600" />
            </div>
        </Layout>
    );

    if (!profile) return (
        <Layout>
            <div className="p-4 text-center mt-20">
                <p>{t('user_not_found')}</p>
                <button onClick={() => navigate(-1)} className="text-navy-600 font-bold mt-4">{t('back')}</button>
            </div>
        </Layout>
    );

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full dark:text-white">
                    <ChevronLeft />
                </button>
                <h2 className="font-bold text-lg dark:text-white">{t('runner_profile')}</h2>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 dark:border-navy-800">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-navy-100 dark:bg-navy-800 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white dark:border-navy-700 shadow-lg overflow-hidden mb-4">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-navy-600 dark:text-navy-300">{profile.full_name?.[0] || 'U'}</span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-navy-900 dark:text-white text-center">{profile.full_name}</h2>
                    <p className="text-gray-500 text-sm mb-2">@{profile.username}</p>
                    {profile.bio && <p className="text-navy-600 dark:text-navy-300 text-xs text-center italic mb-4 max-w-[80%]">"{profile.bio}"</p>}

                    <div className="flex gap-8 mb-6">
                        <div className="text-center">
                            <p className="font-bold text-lg dark:text-white">{stats.followers}</p>
                            <p className="text-[10px] uppercase text-gray-400 font-bold">{t('followers')}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg dark:text-white">{stats.following}</p>
                            <p className="text-[10px] uppercase text-gray-400 font-bold">{t('following')}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg dark:text-white">{activities.length}</p>
                            <p className="text-[10px] uppercase text-gray-400 font-bold">{t('activities')}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleFollow}
                        className={`
                            px-8 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg
                            ${isFollowing
                                ? 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700'
                                : 'bg-navy-600 text-white hover:bg-navy-700 shadow-navy-600/30'}
                        `}
                    >
                        {isFollowing ? (
                            <> <UserCheck size={16} /> {t('following')} </>
                        ) : (
                            <> <UserPlus size={16} /> {t('follow_runner')} </>
                        )}
                    </button>
                </div>
            </div>

            {/* Activities List */}
            <h3 className="font-bold text-navy-900 dark:text-white mb-4 pl-1">{t('activity_history')}</h3>
            <div className="space-y-4 pb-20">
                {activities.length > 0 ? (
                    activities.map(activity => (
                        <ActivityCard key={activity.id} activity={activity} />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        {t('no_activities_found')}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PublicProfile;
