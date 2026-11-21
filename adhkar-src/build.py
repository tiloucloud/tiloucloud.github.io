import sys, os, shutil, json
SRC = os.path.dirname(os.path.abspath(__file__))
DB = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/adhkar_site'
VER = 34
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT + '/fonts')
K = '/home/claude/tiloucloud.github.io/khatma'
for f in os.listdir(K + '/fonts'): shutil.copy(f'{K}/fonts/{f}', f'{OUT}/fonts/{f}')
shutil.copy(K + '/warsh.woff2', OUT)
for f in ['icon-512.png', 'icon-192.png', 'icon-180.png', 'icon-maskable-512.png', 'fav-32.png']:
    shutil.copy(f'{SRC}/icon/{f}', OUT)
fonts = open('/home/claude/tools/fonts.css').read()
fonts += "@font-face{font-family:'warsh';font-display:swap;src:url('warsh.woff2') format('woff2')}\n"
css = fonts + open(SRC + '/app.css').read()
ad = json.dumps(json.load(open(SRC + '/adhkar.json')), ensure_ascii=False, separators=(',', ':'))
js = open(SRC + '/app.js').read().replace('__DB__', DB).replace('__VAPID__', json.load(open('/home/claude/push/vapid.json'))['publicKey']).replace('__ADHKAR__', ad)
open(OUT + '/app.css', 'w').write(css)
open(OUT + '/app.js', 'w').write(js)
open(OUT + '/index.html', 'w').write(f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>أذكار العائلة</title><meta name="description" content="أذكار الصباح والمساء وبعد الصلاة والنوم، مع عدّاد، وسباق مداومة بين أفراد العائلة.">
<meta name="theme-color" content="#13284d"><link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="fav-32.png"><link rel="apple-touch-icon" href="icon-180.png">
<meta property="og:title" content="أذكار العائلة"><meta property="og:description" content="نتنافس في المداومة على الأذكار"><meta property="og:image" content="https://tiloucloud.github.io/adhkar/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="fonts/ibm-plex-sans-arabic-arabic-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="app.css?v={VER}"></head><body><div id="app"></div><script src="app.js?v={VER}"></script></body></html>''')
open(OUT + '/manifest.webmanifest', 'w').write(json.dumps({
    "name": "أذكار العائلة", "short_name": "أذكار العائلة", "lang": "ar", "dir": "rtl",
    "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#13284d", "theme_color": "#13284d",
    "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False))
files = ['./', 'index.html', f'app.css?v={VER}', f'app.js?v={VER}', 'warsh.woff2', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'] + ['fonts/' + f for f in os.listdir(OUT + '/fonts')]
open(OUT + '/sw.js', 'w').write('''var C='ad-v%d',F=%s;
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('push',function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'أذكار العائلة',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'أذكار العائلة',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',dir:'rtl',lang:'ar',tag:d.tag||'adhkar',renotify:true,data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){for(var i=0;i<cs.length;i++){if(cs[i].url.indexOf(self.registration.scope)===0&&'focus' in cs[i])return cs[i].focus()}return self.clients.openWindow(u)}))});
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
var nav=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
if(nav){e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request,{ignoreSearch:true})}));return}
e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request)}))});
''' % (VER, json.dumps(files)))
print('built', OUT, len(js))
