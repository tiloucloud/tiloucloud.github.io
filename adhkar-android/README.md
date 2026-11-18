# أذكار العائلة · Android

Trusted Web Activity wrapper around https://tiloucloud.github.io/adhkar/ for Google Play.

- Built by `.github/workflows/adhkar-android.yml` on every change in this folder, signed with the same upload key (secrets `ANDROID_KEYSTORE_B64` / `ANDROID_KEYSTORE_PASSWORD`).
- Output: https://tiloucloud.github.io/adhkar/app/adhkar-family.aab (Play Console) and `.apk`.
- Package: `com.tiloucloud.adhkar`. Add the Play App Signing fingerprint of this app to `/.well-known/assetlinks.json` after the first upload.
