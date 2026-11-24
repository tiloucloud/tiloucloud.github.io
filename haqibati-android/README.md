# حقيبتي · Android

Trusted Web Activity wrapper around https://tiloucloud.github.io/haqibati/ for Google Play.

- Built by `.github/workflows/haqibati-android.yml` on every change in this folder, signed with the same upload key (secrets `ANDROID_KEYSTORE_B64` / `ANDROID_KEYSTORE_PASSWORD`).
- Output: https://tiloucloud.github.io/haqibati/app/haqibati.aab (Play Console) and `.apk`.
- Package: `com.tiloucloud.haqibati`. Add the Play App Signing fingerprint of this app to `/.well-known/assetlinks.json` after the first upload.
- Share target: WhatsApp → Share → حقيبتي posts the files to `/haqibati/share`, handled by the service worker (see `haqibati-src/build.py`).
