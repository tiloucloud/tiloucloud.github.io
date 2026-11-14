# ختمة العائلة · Android

Trusted Web Activity wrapper around https://tiloucloud.github.io/khatma/ for Google Play.

- Built by `.github/workflows/khatma-android.yml` on every change in this folder.
- Signed with the upload key stored in the `ANDROID_KEYSTORE_B64` / `ANDROID_KEYSTORE_PASSWORD` secrets.
- Output: https://tiloucloud.github.io/khatma/app/khatma-family.aab (Play Console) and `.apk` (direct install).
- Site verification: `/.well-known/assetlinks.json` lists the upload key fingerprint; add the Play App Signing fingerprint there too.
