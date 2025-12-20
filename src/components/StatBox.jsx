const StatBox = ({ label, value, unit }) => {
    return (
        <div className="text-center">
            <p className="text-xs text-navy-300 uppercase font-semibold mb-1">{label}</p>
            <p className="text-xl font-bold text-navy-900">
                {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
            </p>
        </div>
    );
};

export default StatBox;
