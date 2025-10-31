'use client';

import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  LayerGroup,
  LayersControl,
  Circle,
} from 'react-leaflet';
import { useEffect, useState } from 'react';
import { LatLng, LatLngTuple } from 'leaflet';
import L from 'leaflet';

// Fix for default icon issues with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});


type MapViewProps = {
  route: LatLngTuple[];
};

function CurrentLocationMarker({ route }: { route: LatLngTuple[] }) {
  const map = useMap();
  const [position, setPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    if (route.length > 0) {
      const lastPosition = route[route.length - 1];
      map.setView(lastPosition, map.getZoom() < 15 ? 16 : map.getZoom());
      setPosition(new LatLng(lastPosition[0], lastPosition[1]));
    } else {
        // Fallback to geolocation API if route is empty on first load
        map.locate().on('locationfound', function (e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, 16);
            setAccuracy(e.accuracy);
        });
    }
  }, [route, map]);
  

  if (!position) return null;

  return (
    <>
      <Circle center={position} radius={accuracy} weight={1} />
      <Marker position={position} />
    </>
  );
}

export default function MapView({ route }: MapViewProps) {
  const defaultCenter: LatLngTuple = [51.505, -0.09]; // Default location

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
        <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Maps">
                 <TileLayer
                    url='http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}'
                    maxZoom={19}
                    subdomains={['mt0','mt1','mt2','mt3']}
                />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Satellite">
                 <TileLayer
                    url='http://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}'
                    maxZoom={19}
                    subdomains={['mt0','mt1','mt2','mt3']}
                />
            </LayersControl.BaseLayer>
        </LayersControl>
      
      <CurrentLocationMarker route={route} />
      {route.length > 1 && (
        <Polyline positions={route} color="blue" weight={5} />
      )}
    </MapContainer>
  );
}