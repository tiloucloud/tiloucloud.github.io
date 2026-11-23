/*
 * Waraqa Scan — brand & behaviour configuration.
 * Everything a buyer usually wants to rebrand lives in this one file.
 * (Also update manifest.webmanifest and the icons in /icons for a full rebrand.)
 */
window.APP_CONFIG = {
  appName: { ar: 'ورقة Scan', fr: 'Waraqa Scan', en: 'Waraqa Scan' },
  tagline: {
    ar: 'ماسح المستندات إلى PDF',
    fr: 'Scanner de documents PDF',
    en: 'Document scanner to PDF'
  },

  // Brand colours (CSS colours). Applied at start-up.
  colors: {
    primary: '#0F766E',      // buttons, highlights
    primaryDark: '#115E59',
    accent: '#F59E0B'        // crop handles, badges
  },

  // First-launch language: 'auto' picks from the device language, falling back to 'ar'.
  defaultLanguage: 'auto',
  languages: ['ar', 'fr', 'en'],

  // Default scan filter: 'original' | 'enhance' | 'gray' | 'bw'
  defaultFilter: 'enhance',

  // Default PDF page size: 'a4' | 'letter' | 'fit'
  defaultPageSize: 'a4',

  // Longest side (px) kept for each scanned page. Higher = sharper, bigger PDFs.
  maxPageResolution: 2200,

  // JPEG quality used inside exported PDFs (0.5 – 0.95).
  jpegQuality: 0.85,

  // Optional monetisation hook: text stamped at the bottom of exported pages.
  // Leave empty for no watermark (e.g. for a paid / "Pro" build).
  exportWatermark: '',

  // Optional ads (Google AdSense). OFF by default — read "Enable ads" in README.md first:
  // you need your own domain, an approved AdSense account, an ads.txt file, and updated
  // Play Console declarations (Ads + Data safety) and privacy policy.
  // Ads are shown only on the home screen and in the "PDF created" sheet — never in the editor.
  ads: {
    enabled: false,
    client: '',          // e.g. 'ca-pub-1234567890123456'
    slots: {
      home: '',          // AdSense ad-unit ID for the banner under the document list
      afterExport: ''    // AdSense ad-unit ID for the banner in the "PDF created" sheet
    }
  },

  // Shown in Settings > About. Replace with your own pages before publishing.
  privacyPolicyUrl: 'https://tiloucloud.github.io/waraqa-scan/privacy.html',
  supportEmail: 'paytllt2020@gmail.com'
};
