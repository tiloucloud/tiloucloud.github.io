package com.tiloucloud.waraqa;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.appopen.AppOpenAd;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * Entry screen: optionally shows one AdMob "app open" ad, then opens the app (Trusted Web Activity).
 *
 * Rules that keep the ad unobtrusive:
 *  - never on the very first launch;
 *  - at most once every {@link #MIN_INTERVAL_MS};
 *  - only when online, and only if the ad is ready within {@link #LOAD_TIMEOUT_MS};
 *  - never when the app is opened from a link (those go straight to LauncherActivity).
 * The ad unit ID lives in res/values/values.xml (admob_app_open_unit); it is Google's TEST unit for now.
 */
public class AdLauncherActivity extends Activity {

    private static final long MIN_INTERVAL_MS = 4L * 60L * 60L * 1000L; // 4 hours
    private static final long LOAD_TIMEOUT_MS = 3500L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean done = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final SharedPreferences prefs = getSharedPreferences("ads", MODE_PRIVATE);
        final int launches = prefs.getInt("launches", 0) + 1;
        prefs.edit().putInt("launches", launches).apply();
        final long lastAdAt = prefs.getLong("lastAdAt", 0L);
        final boolean adDue = launches > 1
                && System.currentTimeMillis() - lastAdAt > MIN_INTERVAL_MS
                && isOnline();

        if (!adDue) {
            openApp();
            return;
        }

        handler.postDelayed(this::openApp, LOAD_TIMEOUT_MS);
        try {
            MobileAds.initialize(this, status -> { });
            AppOpenAd.load(this, getString(R.string.admob_app_open_unit), new AdRequest.Builder().build(),
                    new AppOpenAd.AppOpenAdLoadCallback() {
                        @Override
                        public void onAdLoaded(AppOpenAd ad) {
                            if (done || isFinishing()) return;
                            handler.removeCallbacksAndMessages(null);
                            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                                @Override
                                public void onAdShowedFullScreenContent() {
                                    prefs.edit().putLong("lastAdAt", System.currentTimeMillis()).apply();
                                }

                                @Override
                                public void onAdDismissedFullScreenContent() {
                                    openApp();
                                }

                                @Override
                                public void onAdFailedToShowFullScreenContent(AdError error) {
                                    openApp();
                                }
                            });
                            ad.show(AdLauncherActivity.this);
                        }

                        @Override
                        public void onAdFailedToLoad(LoadAdError error) {
                            openApp();
                        }
                    });
        } catch (RuntimeException e) {
            openApp();
        }
    }

    private void openApp() {
        if (done) return;
        done = true;
        handler.removeCallbacksAndMessages(null);
        // NEW_TASK is required: without it LauncherActivity restarts itself in a new task, and the
        // second instance sees the first one still alive and finishes, closing the app on launch.
        Intent intent = new Intent(this, LauncherActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
        finish();
        overridePendingTransition(0, 0);
    }

    private boolean isOnline() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            Network network = cm.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities caps = cm.getNetworkCapabilities(network);
            return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        } catch (RuntimeException e) {
            return false;
        }
    }
}
