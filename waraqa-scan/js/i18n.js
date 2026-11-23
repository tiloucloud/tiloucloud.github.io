/*
 * Translations. Arabic is right-to-left; the UI flips automatically via <html dir>.
 * To add a language: copy the 'en' block, translate, and add the code to APP_CONFIG.languages.
 */
(function () {
  'use strict';
  const STRINGS = {
    ar: {
      langName: 'العربية',
      scan: 'مسح ضوئي', import: 'استيراد ملفات', documents: 'مستنداتي',
      emptyTitle: 'لا توجد مستندات بعد',
      emptyBody: 'صوّر ورقة أو استورد صورًا أو ملفات PDF وWord وExcel، وسنحوّلها إلى PDF واضح خلال ثوانٍ.',
      pages: (n) => (n === 1 ? 'صفحة واحدة' : n === 2 ? 'صفحتان' : n <= 10 ? `${n} صفحات` : `${n} صفحة`),
      newDocName: (d) => `مستند ${d}`,
      crop: 'قص الحواف', autoDetect: 'كشف تلقائي', fullImage: 'الصورة كاملة', rotate: 'تدوير',
      next: 'التالي', done: 'تم', cancel: 'إلغاء', back: 'رجوع', save: 'حفظ', delete: 'حذف',
      retake: 'إعادة', adjustHint: 'اسحب النقاط الأربع إلى زوايا الورقة',
      filters: { original: 'الأصلية', enhance: 'محسّنة', gray: 'رمادي', bw: 'أبيض وأسود' },
      addPage: 'إضافة صفحة', exportPdf: 'تصدير PDF', share: 'مشاركة', download: 'تنزيل',
      rename: 'إعادة التسمية', deleteDoc: 'حذف المستند',
      confirmDeleteDoc: 'حذف هذا المستند نهائيًا؟', confirmDeletePage: 'حذف هذه الصفحة؟',
      editPage: 'تعديل', moveBefore: 'تقديم', moveAfter: 'تأخير',
      page: 'صفحة', of: 'من',
      settings: 'الإعدادات', language: 'اللغة', defaultFilter: 'المرشح الافتراضي',
      pageSize: 'حجم صفحة PDF', sizes: { a4: 'A4', letter: 'Letter', fit: 'حسب الصورة' },
      about: 'حول التطبيق', privacyNote: 'كل المستندات تبقى على جهازك. لا يتم رفع أي شيء.',
      privacyPolicy: 'سياسة الخصوصية', contact: 'تواصل معنا',
      processing: 'جارٍ المعالجة…', exporting: 'جارٍ إنشاء PDF…',
      exported: 'تم إنشاء ملف PDF', saved: 'تم الحفظ',
      errorImage: 'تعذّر فتح هذه الصورة', errorGeneric: 'حدث خطأ، حاول مرة أخرى',
      notDetected: 'لم يتم العثور على حواف واضحة — عدّل النقاط يدويًا',
      storageWarning: 'التخزين غير متاح في هذا المتصفح: صدّر مستنداتك قبل الإغلاق.',
      install: 'تثبيت التطبيق', more: 'المزيد', docName: 'اسم المستند',
      camFind: 'وجّه الكاميرا نحو الورقة', camHold: 'ثبّت الهاتف… جارٍ الالتقاط', camShot: 'تم الالتقاط', camRetry: 'إعادة المحاولة', camSystem: 'كاميرا الهاتف', camHelpDenied: 'اسمح باستعمال الكاميرا: إعدادات الهاتف ← التطبيقات ← Chrome ← الأذونات ← الكاميرا، ثم في Chrome: الإعدادات ← إعدادات المواقع ← الكاميرا.', importGallery: 'صور من المعرض', importFiles: 'ملفات (PDF، Word، Excel…)', camTap: 'اضغط على الزر للالتقاط',
      camAuto: 'تلقائي', camManual: 'يدوي', torch: 'الفلاش', gallery: 'المعرض',
      cameraDenied: 'تعذّر فتح الكاميرا — اسمح للتطبيق باستعمالها', importing: 'جارٍ الاستيراد',
      unsupportedFile: 'نوع الملف غير مدعوم (حوّله إلى PDF أو DOCX)', errorFile: 'تعذّر فتح هذا الملف'
    },
    fr: {
      langName: 'Français',
      scan: 'Scanner', import: 'Importer', documents: 'Mes documents',
      emptyTitle: 'Aucun document pour le moment',
      emptyBody: 'Photographiez une feuille ou importez des images, PDF, Word ou Excel : vous obtenez un PDF net en quelques secondes.',
      pages: (n) => (n <= 1 ? `${n} page` : `${n} pages`),
      newDocName: (d) => `Document ${d}`,
      crop: 'Recadrer', autoDetect: 'Détection auto', fullImage: 'Image entière', rotate: 'Pivoter',
      next: 'Suivant', done: 'Terminé', cancel: 'Annuler', back: 'Retour', save: 'Enregistrer', delete: 'Supprimer',
      retake: 'Reprendre', adjustHint: 'Placez les quatre points sur les coins de la feuille',
      filters: { original: 'Originale', enhance: 'Améliorée', gray: 'Gris', bw: 'Noir et blanc' },
      addPage: 'Ajouter une page', exportPdf: 'Exporter en PDF', share: 'Partager', download: 'Télécharger',
      rename: 'Renommer', deleteDoc: 'Supprimer le document',
      confirmDeleteDoc: 'Supprimer définitivement ce document ?', confirmDeletePage: 'Supprimer cette page ?',
      editPage: 'Modifier', moveBefore: 'Avancer', moveAfter: 'Reculer',
      page: 'Page', of: 'sur',
      settings: 'Paramètres', language: 'Langue', defaultFilter: 'Filtre par défaut',
      pageSize: 'Format des pages PDF', sizes: { a4: 'A4', letter: 'Letter', fit: 'Taille de l’image' },
      about: 'À propos', privacyNote: 'Vos documents restent sur votre appareil. Rien n’est envoyé en ligne.',
      privacyPolicy: 'Politique de confidentialité', contact: 'Nous contacter',
      processing: 'Traitement…', exporting: 'Création du PDF…',
      exported: 'PDF créé', saved: 'Enregistré',
      errorImage: 'Impossible d’ouvrir cette image', errorGeneric: 'Une erreur est survenue, réessayez',
      notDetected: 'Bords non détectés — ajustez les points à la main',
      storageWarning: 'Stockage indisponible dans ce navigateur : exportez vos documents avant de fermer.',
      install: 'Installer l’application', more: 'Plus', docName: 'Nom du document',
      camFind: 'Visez le document', camHold: 'Ne bougez plus… capture', camShot: 'Capturé', camRetry: 'Réessayer', camSystem: 'Appareil photo du téléphone', camHelpDenied: 'Autorisez la caméra : Paramètres du téléphone → Applications → Chrome → Autorisations → Caméra, puis dans Chrome : Paramètres → Paramètres des sites → Caméra.', importGallery: 'Photos de la galerie', importFiles: 'Fichiers (PDF, Word, Excel…)', camTap: 'Appuyez sur le bouton pour capturer',
      camAuto: 'Auto', camManual: 'Manuel', torch: 'Flash', gallery: 'Galerie',
      cameraDenied: 'Impossible d’ouvrir la caméra — autorisez l’accès', importing: 'Importation',
      unsupportedFile: 'Format non pris en charge (convertissez-le en PDF ou DOCX)', errorFile: 'Impossible d’ouvrir ce fichier'
    },
    en: {
      langName: 'English',
      scan: 'Scan', import: 'Import files', documents: 'My documents',
      emptyTitle: 'No documents yet',
      emptyBody: 'Snap a page or import photos, PDF, Word or Excel files and get a clean PDF in seconds.',
      pages: (n) => (n === 1 ? '1 page' : `${n} pages`),
      newDocName: (d) => `Scan ${d}`,
      crop: 'Crop', autoDetect: 'Auto detect', fullImage: 'Full image', rotate: 'Rotate',
      next: 'Next', done: 'Done', cancel: 'Cancel', back: 'Back', save: 'Save', delete: 'Delete',
      retake: 'Retake', adjustHint: 'Drag the four points onto the corners of the page',
      filters: { original: 'Original', enhance: 'Enhanced', gray: 'Grayscale', bw: 'Black & white' },
      addPage: 'Add page', exportPdf: 'Export PDF', share: 'Share', download: 'Download',
      rename: 'Rename', deleteDoc: 'Delete document',
      confirmDeleteDoc: 'Delete this document permanently?', confirmDeletePage: 'Delete this page?',
      editPage: 'Edit', moveBefore: 'Move earlier', moveAfter: 'Move later',
      page: 'Page', of: 'of',
      settings: 'Settings', language: 'Language', defaultFilter: 'Default filter',
      pageSize: 'PDF page size', sizes: { a4: 'A4', letter: 'Letter', fit: 'Match image' },
      about: 'About', privacyNote: 'Your documents stay on your device. Nothing is uploaded.',
      privacyPolicy: 'Privacy policy', contact: 'Contact us',
      processing: 'Processing…', exporting: 'Creating PDF…',
      exported: 'PDF created', saved: 'Saved',
      errorImage: 'Could not open this image', errorGeneric: 'Something went wrong, please try again',
      notDetected: 'No clear edges found — adjust the points by hand',
      storageWarning: 'Storage is unavailable in this browser: export your documents before closing.',
      install: 'Install app', more: 'More', docName: 'Document name',
      camFind: 'Point the camera at the document', camHold: 'Hold still… capturing', camShot: 'Captured', camRetry: 'Try again', camSystem: 'Phone camera app', camHelpDenied: 'Allow the camera: phone Settings → Apps → Chrome → Permissions → Camera, then in Chrome: Settings → Site settings → Camera.', importGallery: 'Photos from gallery', importFiles: 'Files (PDF, Word, Excel…)', camTap: 'Tap the button to capture',
      camAuto: 'Auto', camManual: 'Manual', torch: 'Flash', gallery: 'Gallery',
      cameraDenied: 'Could not open the camera — allow camera access', importing: 'Importing',
      unsupportedFile: 'Unsupported file type (convert it to PDF or DOCX)', errorFile: 'Could not open this file'
    }
  };

  const RTL = new Set(['ar', 'he', 'fa', 'ur']);
  let lang = 'ar';

  function pickInitial(cfgDefault, available, saved) {
    if (saved && available.includes(saved)) return saved;
    if (cfgDefault && cfgDefault !== 'auto' && available.includes(cfgDefault)) return cfgDefault;
    const nav = (navigator.languages || [navigator.language || '']).map((l) => String(l).slice(0, 2).toLowerCase());
    for (const l of nav) if (available.includes(l)) return l;
    return available.includes('ar') ? 'ar' : available[0];
  }

  function setLang(l) {
    lang = STRINGS[l] ? l : 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.has(lang) ? 'rtl' : 'ltr';
  }

  function t(key, ...args) {
    const parts = key.split('.');
    let v = STRINGS[lang];
    for (const p of parts) v = v && v[p];
    if (v == null) { v = STRINGS.en; for (const p of parts) v = v && v[p]; }
    return typeof v === 'function' ? v(...args) : v == null ? key : v;
  }

  const locale = () => ({ ar: 'ar-MA', fr: 'fr-FR', en: 'en-GB' }[lang] || lang);

  window.I18n = { STRINGS, setLang, t, pickInitial, get lang() { return lang; }, locale };
})();
