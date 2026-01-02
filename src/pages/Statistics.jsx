import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getActivities } from '../services/activityStorage';
import { filterActivities, getChartData, getActiveDays } from '../utils/statsHelper';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Statistics = () => {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState('week'); // week, month, year
    const [calendarDate, setCalendarDate] = useState(new Date());

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const data = await getActivities();
            setActivities(data || []);
            setLoading(false);
        };
        fetch();
    }, []);

    // Summary Stats
    const filteredActs = filterActivities(activities, viewType);
    const totalDist = filteredActs.reduce((acc, curr) => acc + (curr.distance || 0), 0);
    const totalTime = filteredActs.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 3600; // hours
    const totalKcal = totalDist * 60; // Est

    // Chart Data
    const chartData = getChartData(activities, viewType);

    // Calendar Data
    const calendarDays = eachDayOfInterval({
        start: startOfMonth(calendarDate),
        end: endOfMonth(calendarDate)
    });

    // Get array of date strings that have activity
    const activeDates = activities.map(a => format(new Date(a.startTime), 'yyyy-MM-dd'));

    const nextMonth = () => setCalendarDate(addMonths(calendarDate, 1));
    const prevMonth = () => setCalendarDate(subMonths(calendarDate, 1));

    if (loading) return (
        <Layout>
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-navy-900" /></div>
        </Layout>
    );

    return (
        <Layout>
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">{t('statistics')}</h2>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 dark:bg-navy-900 p-1 rounded-xl mb-6">
                {['week', 'month', 'year'].map(period => (
                    <button
                        key={period}
                        onClick={() => setViewType(period)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${viewType === period ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                        {period === 'week' ? t('this_week') : period === 'month' ? t('this_month') : t('this_year')}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-navy-50 dark:bg-navy-900 p-3 rounded-xl border border-navy-100 dark:border-navy-800 text-center">
                    <p className="text-xs text-navy-400 dark:text-navy-300 uppercase font-bold">{t('distance')}</p>
                    <p className="text-lg font-bold text-navy-900 dark:text-white">{totalDist.toFixed(1)}k</p>
                </div>
                <div className="bg-navy-50 dark:bg-navy-900 p-3 rounded-xl border border-navy-100 dark:border-navy-800 text-center">
                    <p className="text-xs text-navy-400 dark:text-navy-300 uppercase font-bold">{t('duration')}</p>
                    <p className="text-lg font-bold text-navy-900 dark:text-white">{totalTime.toFixed(1)}h</p>
                </div>
                <div className="bg-navy-50 dark:bg-navy-900 p-3 rounded-xl border border-navy-100 dark:border-navy-800 text-center">
                    <p className="text-xs text-navy-400 dark:text-navy-300 uppercase font-bold">{t('cal')}</p>
                    <p className="text-lg font-bold text-navy-900 dark:text-white">{totalKcal.toFixed(0)}</p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="mb-8">
                <h3 className="font-bold text-navy-900 dark:text-white mb-3">{t('statistics')}</h3>
                <div className="h-48 w-full p-2 bg-white dark:bg-navy-900 rounded-xl border border-gray-100 dark:border-navy-800">
                    <Bar
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { display: false },
                                    ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b' }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b' }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy-900 dark:text-white">Active Calendar</h3>
                    <div className="flex gap-2 text-navy-900 dark:text-gray-200">
                        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-navy-800 rounded"><ChevronLeft size={16} /></button>
                        <span className="text-sm font-medium">{format(calendarDate, 'MMMM yyyy', { locale: language === 'id' ? idLocale : enLocale })}</span>
                        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-navy-800 rounded"><ChevronRight size={16} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
                        <div key={i} className="text-gray-400 font-bold py-2">{d}</div>
                    ))}

                    {/* Empty slots for start of month */}
                    {Array.from({ length: (startOfMonth(calendarDate).getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {calendarDays.map((day, i) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isActive = activeDates.includes(dateStr);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div key={i} className="aspect-square flex items-center justify-center relative">
                                <div className={`
                                    w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors
                                    ${isActive ? 'bg-navy-900 dark:bg-navy-500 text-white font-bold' : 'text-gray-600 dark:text-gray-400'}
                                    ${isToday && !isActive ? 'border border-navy-900 dark:border-navy-500 text-navy-900 dark:text-navy-300' : ''}
                                `}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
};

export default Statistics;
