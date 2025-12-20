import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, format, isSameDay, subMonths, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';

export const filterActivities = (activities, type) => {
    const now = new Date();
    let start, end;

    switch (type) {
        case 'week':
            start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
            end = endOfWeek(now, { weekStartsOn: 1 });
            break;
        case 'month':
            start = startOfMonth(now);
            end = endOfMonth(now);
            break;
        case 'year':
            start = startOfYear(now);
            end = endOfYear(now);
            break;
        default:
            return activities;
    }

    return activities.filter(act => {
        const actDate = new Date(act.startTime);
        return isWithinInterval(actDate, { start, end });
    });
};

export const getChartData = (activities, type) => {
    const now = new Date();
    let labels = [];
    let dataPoints = [];

    if (type === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });

        labels = days.map(d => format(d, 'EEE', { locale: id }));
        dataPoints = days.map(d => {
            const dailyActs = activities.filter(a => isSameDay(new Date(a.startTime), d));
            return dailyActs.reduce((sum, a) => sum + (a.distance || 0), 0);
        });
    } else if (type === 'month') {
        // Show weeks of month? Or days? Let's show days for detail
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        const days = eachDayOfInterval({ start, end });

        labels = days.map(d => format(d, 'd'));
        dataPoints = days.map(d => {
            const dailyActs = activities.filter(a => isSameDay(new Date(a.startTime), d));
            return dailyActs.reduce((sum, a) => sum + (a.distance || 0), 0);
        });
    } else if (type === 'year') {
        // Show months
        const months = Array.from({ length: 12 }, (_, i) => i);
        labels = months.map(m => format(new Date(now.getFullYear(), m, 1), 'MMM', { locale: id }));

        dataPoints = months.map(m => {
            const monthlyActs = activities.filter(a => new Date(a.startTime).getMonth() === m && new Date(a.startTime).getFullYear() === now.getFullYear());
            return monthlyActs.reduce((sum, a) => sum + (a.distance || 0), 0);
        });
    }

    return {
        labels,
        datasets: [
            {
                label: 'Jarak (km)',
                data: dataPoints,
                backgroundColor: 'rgba(55, 48, 163, 0.8)', // navy-800
                borderColor: 'rgba(30, 27, 75, 1)', // navy-900
                borderWidth: 1,
                borderRadius: 4,
            }
        ]
    };
};

export const getActiveDays = (activities, currentMonthDate) => {
    // Return array of date strings 'YYYY-MM-DD' that have activity in the viewed month
    const start = startOfMonth(currentMonthDate);
    const end = endOfMonth(currentMonthDate);

    return activities
        .filter(a => isWithinInterval(new Date(a.startTime), { start, end }))
        .map(a => format(new Date(a.startTime), 'yyyy-MM-dd'));
};
