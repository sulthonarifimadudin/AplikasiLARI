import { startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { ChevronDown, TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ActivityCard from '../components/ActivityCard';
import { getActivities } from '../services/activityStorage';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getWeeklyStats } from '../services/recapService';
import WeeklyRecapCard from '../components/WeeklyRecapCard';

const Dashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user } = useAuth(); // Get authenticated user
    const [activities, setActivities] = useState([]);
    const [weeklyStats, setWeeklyStats] = useState(null); // State for Recap
    const [filteredDistance, setFilteredDistance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week'); // week, month, year, all
    const [showRangeMenu, setShowRangeMenu] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const stored = await getActivities();
            setActivities(stored || []);

            // Fetch Weekly Recap Stats
            if (user) {
                const stats = await getWeeklyStats(user.id);
                setWeeklyStats(stats);
            }

            setLoading(false);
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        if (!activities.length) {
            setFilteredDistance(0);
            return;
        }

        const now = new Date();
        let startPeriod;

        switch (timeRange) {
            case 'week':
                startPeriod = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
                break;
            case 'month':
                startPeriod = startOfMonth(now);
                break;
            case 'year':
                startPeriod = startOfYear(now);
                break;
            default:
                startPeriod = null; // All time
        }

        const filtered = activities.filter(act => {
            if (!startPeriod) return true;
            return isAfter(new Date(act.startTime), startPeriod);
        });

        const total = filtered.reduce((acc, curr) => acc + (curr.distance || 0), 0);
        setFilteredDistance(total);
    }, [activities, timeRange]);

    const getRangeLabel = () => {
        switch (timeRange) {
            case 'week': return t('this_week') || 'Minggu Ini';
            case 'month': return t('this_month') || 'Bulan Ini';
            case 'year': return t('this_year') || 'Tahun Ini';
            default: return t('all_time') || 'Semua Waktu';
        }
    };

    return (
        <Layout>
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-40 -mx-4 -mt-6 px-4 pt-2 pb-4 mb-4 transition-all">
                <div className="relative inline-block z-50">
                    <button
                        onClick={() => setShowRangeMenu(!showRangeMenu)}
                        className="bg-navy-950/90 backdrop-blur-sm rounded-xl px-4 py-2 mb-2 shadow-lg flex items-center gap-2 text-white active:scale-95 transition-transform"
                    >
                        <span className="text-lg font-bold leading-none">{getRangeLabel()}</span>
                        <ChevronDown size={16} className={`transition-transformDuration-200 ${showRangeMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showRangeMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowRangeMenu(false)}></div>
                            <div className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-navy-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 border border-gray-100 dark:border-navy-700">
                                {['week', 'month', 'year', 'all'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => {
                                            setTimeRange(range);
                                            setShowRangeMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 dark:border-navy-700 last:border-0
                                            ${timeRange === range
                                                ? 'bg-navy-50 dark:bg-navy-700 text-navy-900 dark:text-white'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700'
                                            }`}
                                    >
                                        {range === 'week' ? (t('this_week') || 'Minggu Ini') :
                                            range === 'month' ? (t('this_month') || 'Bulan Ini') :
                                                range === 'year' ? (t('this_year') || 'Tahun Ini') :
                                                    (t('all_time') || 'Semua Waktu')}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                </div>

                {/* Weekly Recap Card (Spotify Wrapped Style) */}
                {weeklyStats && weeklyStats.totalDistance > 0 && (
                    <WeeklyRecapCard stats={weeklyStats} />
                )}

                <div
                    onClick={() => navigate('/stats')}
                    className="bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl p-6 text-white shadow-lg shadow-navy-900/20 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-navy-100 font-medium text-sm">{t('total_distance')}</p>
                            <h3 className="text-4xl font-bold tracking-tight">{filteredDistance.toFixed(1)} <span className="text-lg font-normal text-navy-200">km</span></h3>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex justify-between items-end">
                <h3 className="font-bold text-navy-900 dark:text-white text-lg">{t('last_activity')}</h3>
                <span className="text-xs text-navy-600 dark:text-navy-400 font-medium cursor-pointer hover:underline">{t('view_all')}</span>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-navy-600" size={32} />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-navy-900 rounded-xl border border-dashed border-gray-300 dark:border-navy-700">
                        <p className="text-gray-400">{t('no_activities')}</p>
                    </div>
                ) : (
                    activities.map(activity => (
                        <ActivityCard key={activity.id} activity={activity} />
                    ))
                )}
            </div>
        </Layout >
    );
};

export default Dashboard;
