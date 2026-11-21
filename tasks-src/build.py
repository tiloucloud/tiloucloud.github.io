# يبني «مهام العائلة» في المجلد /tasks/ — الاستعمال: python3 tasks-src/build.py
import os, re, shutil, json
SRC = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(SRC)
OUT = os.path.join(REPO, 'tasks')
DB = 'https://khatma-16d1b-default-rtdb.firebaseio.com'
VAPID = 'BK9pSZwhnJPm5ignUy7GkbfL49n9_lZbgnHEq6K5TeOaT5zDzkJp5RF0DbjShH-zWK-lDdx2SqQjcBrLsHDPNQc'  # public key, same as adhkar
VER = 5

os.makedirs(OUT + '/fonts', exist_ok=True)
AD = os.path.join(REPO, 'adhkar')
shutil.rmtree(OUT + '/fonts'); os.makedirs(OUT + '/fonts')
for f in [x for x in os.listdir(AD + '/fonts') if x.startswith(('ibm-', 'reem-'))]: shutil.copy(f'{AD}/fonts/{f}', f'{OUT}/fonts/{f}')
for f in ['icon-512.png', 'icon-192.png', 'icon-180.png', 'icon-maskable-512.png', 'fav-32.png']:
    shutil.copy(f'{SRC}/icon/{f}', OUT)
shutil.copy(f'{SRC}/privacy.html', OUT)
fonts = ''.join(x for x in re.findall(r"@font-face\{[^}]*\}", open(AD + '/app.css').read()) if 'warsh' not in x)
open(OUT + '/app.css', 'w').write(fonts + '\n' + open(SRC + '/app.css').read())
open(OUT + '/app.js', 'w').write(open(SRC + '/app.js').read().replace('__DB__', DB).replace('__VAPID__', VAPID))
open(OUT + '/index.html', 'w').write(f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>مهام العائلة</title><meta name="description" content="قائمة مشتريات مشتركة، ومهام ومواعيد العائلة مع التذكير.">
<meta name="theme-color" content="#312e81"><link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="fav-32.png"><link rel="apple-touch-icon" href="icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="مهام العائلة">
<meta property="og:title" content="مهام العائلة"><meta property="og:description" content="مشترياتنا ومهامنا ومواعيدنا معاً"><meta property="og:image" content="https://tiloucloud.github.io/tasks/icon-512.png">
<link rel="preload" href="fonts/ibm-plex-sans-arabic-arabic-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="app.css?v={VER}"></head><body><div id="app"></div><script src="app.js?v={VER}"></script></body></html>''')
open(OUT + '/manifest.webmanifest', 'w').write(json.dumps({
    "name": "مهام العائلة", "short_name": "مهام العائلة", "lang": "ar", "dir": "rtl",
    "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#312e81", "theme_color": "#312e81",
    "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False))
files = ['./', 'index.html', f'app.css?v={VER}', f'app.js?v={VER}', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'] + ['fonts/' + f for f in sorted(os.listdir(OUT + '/fonts'))]
open(OUT + '/sw.js', 'w').write('''var C='tk-v%d',F=%s;
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x.indexOf('tk-')===0&&x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('push',function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'مهام العائلة',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'مهام العائلة',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',dir:'rtl',lang:'ar',tag:d.tag||'tasks',renotify:true,data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){for(var i=0;i<cs.length;i++){if(cs[i].url.indexOf(self.registration.scope)===0&&'focus' in cs[i])return cs[i].focus()}return self.clients.openWindow(u)}))});
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.indexOf('/tasks/')!==0)return;
var nav=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
if(nav){e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request,{ignoreSearch:true})}));return}
e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request)}))});
''' % (VER, json.dumps(files)))
print('built', OUT, 'v%d' % VER)
