export const haversineDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return 0;

    // Adaptasi untuk input {lat, lng} (Gmaps) atau {latitude, longitude} (Geolocation API lama)
    const lat1 = coords1.lat || coords1.latitude;
    const lon1 = coords1.lng || coords1.longitude;
    const lat2 = coords2.lat || coords2.latitude;
    const lon2 = coords2.lng || coords2.longitude;

    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Radius Bumi dalam km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d; // Jarak dalam km
};
