'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Pause } from 'lucide-react';
import { LatLngTuple } from 'leaflet';

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

type RunTrackerProps = {
  setRoute: React.Dispatch<React.SetStateAction<LatLngTuple[]>>;
};

export function RunTracker({ setRoute }: RunTrackerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0); // in km

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let locationWatcher: number | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);

      locationWatcher = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          setRoute((prevRoute) => {
            const newPoint: LatLngTuple = [latitude, longitude];
            if (prevRoute.length > 0) {
              const lastPoint = prevRoute[prevRoute.length - 1];
              const R = 6371; // Radius of the Earth in km
              const dLat = (newPoint[0] - lastPoint[0]) * (Math.PI / 180);
              const dLon = (newPoint[1] - lastPoint[1]) * (Math.PI / 180);
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lastPoint[0] * (Math.PI / 180)) *
                  Math.cos(newPoint[0] * (Math.PI / 180)) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const newDistance = R * c;
              setDistance((d) => d + newDistance);
            }
            return [...prevRoute, newPoint];
          });
        },
        (error) => {
          console.error('Error getting location', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (interval) clearInterval(interval);
      if (locationWatcher) navigator.geolocation.clearWatch(locationWatcher);
    };
  }, [isActive, isPaused, setRoute]);

  const handleStart = () => {
    if (!isActive) {
        setTime(0);
        setDistance(0);
        setRoute([]);
    }
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(true);
    // In a real app, you would save the run data here
  };

  const pace = distance > 0 ? time / distance : 0;
  const paceMinutes = Math.floor(pace / 60);
  const paceSeconds = Math.floor(pace % 60);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card className="lg:col-span-1 xl:col-span-1">
        <CardHeader>
          <CardTitle>Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-bold tracking-tighter">
            {formatTime(time)}
          </p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1 xl:col-span-1">
        <CardHeader>
          <CardTitle>Distance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-bold tracking-tighter">
            {distance.toFixed(2)} <span className="text-xl font-normal">km</span>
          </p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1 xl:col-span-1">
        <CardHeader>
          <CardTitle>Pace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-bold tracking-tighter">
            {paceMinutes}:{paceSeconds.toString().padStart(2, '0')}
            <span className="text-xl font-normal"> /km</span>
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 rounded-lg border bg-card p-6 md:col-span-2 lg:col-span-3 xl:col-span-1">
        {!isActive ? (
          <Button
            size="lg"
            onClick={handleStart}
            className="h-24 w-24 rounded-full"
            variant="default"
          >
            <Play className="h-10 w-10 fill-current" />
            <span className="sr-only">Start Run</span>
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={handlePauseResume}
              className="h-24 w-24 rounded-full"
            >
              {isPaused ? <Play className="h-10 w-10 fill-current" /> : <Pause className="h-10 w-10 fill-current" />}
              <span className="sr-only">{isPaused ? "Resume Run" : "Pause Run"}</span>
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={handleStop}
              className="h-24 w-24 rounded-full"
            >
              <Square className="h-10 w-10 fill-current" />
              <span className="sr-only">Stop Run</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}