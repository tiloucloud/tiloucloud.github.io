var C='ad-v28',F=["./", "index.html", "app.css?v=28", "app.js?v=28", "warsh.woff2", "icon-192.png", "icon-512.png", "manifest.webmanifest", "fonts/ibm-plex-sans-arabic-arabic-600.woff2", "fonts/reem-kufi-latin-700.woff2", "fonts/ibm-plex-sans-arabic-arabic-700.woff2", "fonts/reem-kufi-arabic-700.woff2", "fonts/ibm-plex-sans-arabic-latin-700.woff2", "fonts/reem-kufi-latin-600.woff2", "fonts/reem-kufi-arabic-600.woff2", "fonts/ibm-plex-sans-arabic-latin-400.woff2", "fonts/ibm-plex-sans-arabic-latin-600.woff2", "fonts/ibm-plex-sans-arabic-arabic-400.woff2"];
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
