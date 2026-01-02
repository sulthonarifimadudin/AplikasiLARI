
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

export const openMusicApp = async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        // Try Spotify first
        try {
            const { value } = await AppLauncher.canOpenUrl({ url: 'spotify://' });
            if (value) {
                await AppLauncher.openUrl({ url: 'spotify://' });
                return;
            }
        } catch (e) {
            console.error("Error checking Spotify:", e);
        }

        // Try YouTube Music
        try {
            const { value } = await AppLauncher.canOpenUrl({ url: 'music.youtube://' });
            if (value) {
                await AppLauncher.openUrl({ url: 'music.youtube://' });
                return;
            }
        } catch (e) {
            console.error("Error checking YT Music:", e);
        }

        // Fallback: Open Spotify Web in Browser
        await AppLauncher.openUrl({ url: 'https://open.spotify.com' });
    } else {
        // Web Environment: Open in new tab
        window.open('https://open.spotify.com', '_blank');
    }
};
