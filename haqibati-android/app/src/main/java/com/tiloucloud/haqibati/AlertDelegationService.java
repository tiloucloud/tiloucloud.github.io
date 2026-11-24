package com.tiloucloud.haqibati;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import androidx.annotation.NonNull;

import com.google.androidbrowserhelper.trusted.DelegationService;

/**
 * Shows the web app's notifications (new lesson, lesson finished) on a high-importance
 * channel with the app's own loud alert sound and a strong vibration, instead of the
 * default quiet channel.
 */
public class AlertDelegationService extends DelegationService {
    private static final String CHANNEL_ID = "haqibati_alerts_v1";
    private static final long[] VIBRATION = {0, 500, 200, 500, 200, 800};

    private Uri sound() {
        return Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.alert);
    }

    @Override
    @SuppressWarnings("deprecation")
    public boolean onNotifyNotificationWithChannel(@NonNull String platformTag, int platformId,
            @NonNull Notification notification, @NonNull String channelName) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null || !nm.areNotificationsEnabled()) return false;
        Notification out;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = nm.getNotificationChannel(CHANNEL_ID);
            if (ch == null) {
                ch = new NotificationChannel(CHANNEL_ID, "دروس حقيبتي", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("درس أو واجب جديد، ورسائل العائلة");
                ch.setSound(sound(), new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
                ch.enableVibration(true);
                ch.setVibrationPattern(VIBRATION);
                ch.enableLights(true);
                nm.createNotificationChannel(ch);
            }
            if (ch.getImportance() == NotificationManager.IMPORTANCE_NONE) return false;
            out = Notification.Builder.recoverBuilder(this, notification).setChannelId(CHANNEL_ID).build();
        } else {
            out = notification;
            out.sound = sound();
            out.vibrate = VIBRATION;
            out.priority = Notification.PRIORITY_HIGH;
        }
        nm.notify(platformTag, platformId, out);
        return true;
    }
}
