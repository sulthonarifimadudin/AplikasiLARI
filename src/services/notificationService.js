
import { LocalNotifications } from '@capacitor/local-notifications';

export const checkPermission = async () => {
    try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
            const request = await LocalNotifications.requestPermissions();
            return request.display === 'granted';
        }
        return true;
    } catch (error) {
        console.error("Error checking notification permission:", error);
        return false;
    }
};

export const scheduleReminder = async (hours, minutes) => {
    try {
        // Cancel existing first
        await cancelReminder();

        const now = new Date();
        let scheduleDate = new Date();
        scheduleDate.setHours(hours);
        scheduleDate.setMinutes(minutes);
        scheduleDate.setSeconds(0);

        if (scheduleDate <= now) {
            // If time has passed today, schedule for tomorrow
            scheduleDate.setDate(scheduleDate.getDate() + 1);
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "Waktunya Lari! 🏃💨",
                    body: "Jangan kasih kendor! Yuk bakar kalori hari ini.",
                    id: 1, // Fixed ID to easily replace
                    schedule: {
                        at: scheduleDate,
                        allowWhileIdle: true,
                        repeats: true,
                        every: 'day' // Trigger daily
                    },
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                }
            ]
        });

        // Save setting locally
        localStorage.setItem('reminderTime', `${hours}:${minutes}`);
        localStorage.setItem('reminderEnabled', 'true');
        return true;
    } catch (error) {
        console.error("Error scheduling reminder:", error);
        return false;
    }
};

export const cancelReminder = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        localStorage.setItem('reminderEnabled', 'false');
        return true;
    } catch (error) {
        console.error("Error canceling reminder:", error);
        return false;
    }
};

export const getReminderSettings = () => {
    const time = localStorage.getItem('reminderTime');
    const enabled = localStorage.getItem('reminderEnabled') === 'true';
    return { time, enabled };
};
