import React from 'react';

const RouteSvgRenderer = ({ routePath, width = 500, height = 500, strokeColor = "#4f46e5", strokeWidth = 5 }) => {
    // Defensive check
    if (!routePath || routePath.length === 0) return null;

    // 1. Calculate Bounding Box
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    routePath.forEach(p => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
    });

    // Add padding (approx 10%)
    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;
    const paddingLat = latSpan * 0.1;
    const paddingLng = lngSpan * 0.1;

    minLat -= paddingLat;
    maxLat += paddingLat;
    minLng -= paddingLng;
    maxLng += paddingLng;

    // 2. Map coordinates to SVG viewbox
    const points = routePath.map(p => {
        // SVG coordinate system: 0,0 is top-left
        // Longitude maps to X (minLng -> 0, maxLng -> width)
        // Latitude maps to Y (maxLat -> 0, minLat -> height) because Y goes down in SVG but Lat goes up

        const x = ((p.lng - minLng) / (maxLng - minLng)) * width;
        const y = ((maxLat - p.lat) / (maxLat - minLat)) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
            <polyline
                points={points}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Start Marker (Green Circle) */}
            {points.split(' ').length > 0 && (
                <circle cx={points.split(' ')[0].split(',')[0]} cy={points.split(' ')[0].split(',')[1]} r={strokeWidth * 1.5} fill="#10b981" stroke="white" strokeWidth="2" />
            )}
            {/* End Marker (Red Square-ish) */}
            {points.split(' ').length > 0 && (
                <circle cx={points.split(' ').slice(-1)[0].split(',')[0]} cy={points.split(' ').slice(-1)[0].split(',')[1]} r={strokeWidth * 1.5} fill="#ef4444" stroke="white" strokeWidth="2" />
            )}
        </svg>
    );
};

export default RouteSvgRenderer;
