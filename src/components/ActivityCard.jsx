import { useNavigate } from 'react-router-dom';
import { formatTime } from '../utils/paceCalculator';

const ActivityCard = ({ activity }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/activity/${activity.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-600">
                    {activity.type === 'cycling' ? '🚴' : activity.type === 'walking' ? '🚶' : '🏃'}
                </div>
                <div>
                    <h4 className="font-bold text-navy-900 capitalize">{activity.type === 'cycling' ? 'Bersepeda' : activity.type === 'walking' ? 'Jalan Santai' : 'Lari Pagi'}</h4>
                    <p className="text-xs text-gray-400">{new Date(activity.startTime).toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 divide-x divide-gray-100">
                <div className="px-2">
                    <p className="text-xs text-gray-400">Jarak</p>
                    <p className="font-semibold text-gray-800">{activity.distance ? activity.distance.toFixed(2) : '0.00'} km</p>
                </div>
                <div className="px-2">
                    <p className="text-xs text-gray-400">Waktu</p>
                    <p className="font-semibold text-gray-800">{formatTime(activity.duration)}</p>
                </div>
                <div className="px-2">
                    <p className="text-xs text-gray-400">Pace</p>
                    <p className="font-semibold text-gray-800">{activity.pace} /km</p>
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;
