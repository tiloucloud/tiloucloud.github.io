# يبني «حقيبتي» في المجلد /haqibati/ — الاستعمال: python3 haqibati-src/build.py [DB_URL]
import os, re, shutil, json, sys
SRC = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(SRC)
OUT = os.path.join(REPO, 'haqibati')
DB = sys.argv[1] if len(sys.argv) > 1 else 'https://khatma-16d1b-default-rtdb.firebaseio.com'
VER = 2
VAPID = 'BK9pSZwhnJPm5ignUy7GkbfL49n9_lZbgnHEq6K5TeOaT5zDzkJp5RF0DbjShH-zWK-lDdx2SqQjcBrLsHDPNQc'

os.makedirs(OUT, exist_ok=True)
AD = os.path.join(REPO, 'adhkar')
shutil.rmtree(OUT + '/fonts', ignore_errors=True); os.makedirs(OUT + '/fonts')
for f in [x for x in os.listdir(AD + '/fonts') if x.startswith(('ibm-', 'reem-'))]: shutil.copy(f'{AD}/fonts/{f}', f'{OUT}/fonts/{f}')
for f in ['icon-512.png', 'icon-192.png', 'icon-180.png', 'icon-maskable-512.png', 'fav-32.png']:
    shutil.copy(f'{SRC}/icon/{f}', OUT)
shutil.copy(f'{SRC}/privacy.html', OUT)
shutil.rmtree(OUT + '/pdf', ignore_errors=True); shutil.copytree(f'{SRC}/vendor/pdf', OUT + '/pdf')
shutil.copy(f'{SRC}/vendor/qr.js', OUT + '/qr.js')
fonts = ''.join(x for x in re.findall(r"@font-face\{[^}]*\}", open(AD + '/app.css').read()) if 'warsh' not in x)
open(OUT + '/app.css', 'w').write(fonts + '\n' + open(SRC + '/app.css').read())
open(OUT + '/app.js', 'w').write(open(SRC + '/app.js').read().replace('__DB__', DB).replace('__VAPID__', VAPID))
open(OUT + '/index.html', 'w').write(f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>حقيبتي</title><meta name="description" content="دروس الأستاذ وواجباته تصل إلى التلميذ عبر عائلته فقط، دون واتساب ودون غرباء.">
<meta name="theme-color" content="#0F5F57"><link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="fav-32.png"><link rel="apple-touch-icon" href="icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="حقيبتي">
<meta property="og:title" content="حقيبتي"><meta property="og:description" content="دروس الأستاذ تصل إلى أولادنا عبر العائلة فقط"><meta property="og:image" content="https://tiloucloud.github.io/haqibati/icon-512.png">
<link rel="preload" href="fonts/ibm-plex-sans-arabic-arabic-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="app.css?v={VER}"></head><body><div id="app"></div><script src="app.js?v={VER}"></script></body></html>''')
ACCEPT = ['image/*', 'application/pdf', 'audio/*', 'video/*']
open(OUT + '/manifest.webmanifest', 'w').write(json.dumps({
    "name": "حقيبتي", "short_name": "حقيبتي", "lang": "ar", "dir": "rtl", "id": "./",
    "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#0F5F57", "theme_color": "#0F5F57",
    "share_target": {"action": "share", "method": "POST", "enctype": "multipart/form-data",
                     "params": {"title": "title", "text": "text", "url": "url", "files": [{"name": "f", "accept": ACCEPT}]}},
    "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False))
files = ['./', 'index.html', f'app.css?v={VER}', f'app.js?v={VER}', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', 'qr.js?v=1'] + ['fonts/' + f for f in sorted(os.listdir(OUT + '/fonts'))]
open(OUT + '/sw.js', 'w').write('''var C='hq-v%d',F=%s;
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return /^hq-v/.test(x)&&x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
function share(req){return req.formData().then(function(fd){var fs=fd.getAll('f').filter(function(x){return x&&typeof x==='object'&&x.size>0});
  return caches.delete('hq-share').then(function(){return caches.open('hq-share')}).then(function(c){
    var ps=fs.map(function(f,i){return c.put('__share/'+i,new Response(f,{headers:{'content-type':f.type||'application/octet-stream','x-name':encodeURIComponent(f.name||'file')}}))});
    ps.push(c.put('__share/meta',new Response(JSON.stringify({n:fs.length,title:fd.get('title')||'',text:fd.get('text')||'',url:fd.get('url')||'',t:Date.now()}),{headers:{'content-type':'application/json'}})));
    return Promise.all(ps)})}).catch(function(){}).then(function(){return Response.redirect('./#share',303)})}
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(u.origin!==location.origin||u.pathname.indexOf('/haqibati/')!==0)return;
if(e.request.method==='POST'&&/\\/haqibati\\/share$/.test(u.pathname)){e.respondWith(share(e.request));return}
if(e.request.method!=='GET')return;
if(u.pathname.indexOf('/haqibati/pdf/')===0){e.respondWith(caches.open('hq-pdf').then(function(c){return c.match(e.request).then(function(r){return r||fetch(e.request).then(function(n){if(n.ok)c.put(e.request,n.clone());return n})})}));return}
var nav=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
if(nav){e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request,{ignoreSearch:true})}));return}
e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request)}))});
self.addEventListener('push',function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'حقيبتي',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'حقيبتي',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',dir:'rtl',lang:'ar',tag:d.tag||'hq',renotify:true,silent:false,vibrate:[300,120,300],data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(L){for(var i=0;i<L.length;i++){if(L[i].url.indexOf(self.registration.scope)===0&&'focus' in L[i]){L[i].navigate(u).catch(function(){});return L[i].focus()}}return self.clients.openWindow(u)}))});
''' % (VER, json.dumps(files)))
print('built', OUT, 'v%d' % VER, 'db', DB)
