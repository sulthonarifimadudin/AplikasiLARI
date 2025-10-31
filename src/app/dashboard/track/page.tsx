'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RunTracker } from '@/components/dashboard/run-tracker';
import { useState } from 'react';
import { LatLngTuple } from 'leaflet';

const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
});

export default function TrackRunPage() {
    const [route, setRoute] = useState<LatLngTuple[]>([]);

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">Track New Run</h1>
                <p className="text-muted-foreground">Start a new activity and watch your stats in real-time.</p>
            </div>
        </div>

        <RunTracker setRoute={setRoute}/>

        <Card>
            <CardHeader>
                <CardTitle>Route Map</CardTitle>
                <CardDescription>Your running route will be displayed here live.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="aspect-[4/3] w-full rounded-md overflow-hidden bg-muted flex items-center justify-center">
                   <MapView route={route} />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}