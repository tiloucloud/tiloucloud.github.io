var C='hq-v2',F=["./", "index.html", "app.css?v=2", "app.js?v=2", "icon-192.png", "icon-512.png", "manifest.webmanifest", "qr.js?v=1", "fonts/ibm-plex-sans-arabic-arabic-400.woff2", "fonts/ibm-plex-sans-arabic-arabic-600.woff2", "fonts/ibm-plex-sans-arabic-arabic-700.woff2", "fonts/ibm-plex-sans-arabic-latin-400.woff2", "fonts/ibm-plex-sans-arabic-latin-600.woff2", "fonts/ibm-plex-sans-arabic-latin-700.woff2", "fonts/reem-kufi-arabic-600.woff2", "fonts/reem-kufi-arabic-700.woff2", "fonts/reem-kufi-latin-600.woff2", "fonts/reem-kufi-latin-700.woff2"];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return /^hq-v/.test(x)&&x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
function share(req){return req.formData().then(function(fd){var fs=fd.getAll('f').filter(function(x){return x&&typeof x==='object'&&x.size>0});
  return caches.delete('hq-share').then(function(){return caches.open('hq-share')}).then(function(c){
    var ps=fs.map(function(f,i){return c.put('__share/'+i,new Response(f,{headers:{'content-type':f.type||'application/octet-stream','x-name':encodeURIComponent(f.name||'file')}}))});
    ps.push(c.put('__share/meta',new Response(JSON.stringify({n:fs.length,title:fd.get('title')||'',text:fd.get('text')||'',url:fd.get('url')||'',t:Date.now()}),{headers:{'content-type':'application/json'}})));
    return Promise.all(ps)})}).catch(function(){}).then(function(){return Response.redirect('./#share',303)})}
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(u.origin!==location.origin||u.pathname.indexOf('/haqibati/')!==0)return;
if(e.request.method==='POST'&&/\/haqibati\/share$/.test(u.pathname)){e.respondWith(share(e.request));return}
if(e.request.method!=='GET')return;
if(u.pathname.indexOf('/haqibati/pdf/')===0){e.respondWith(caches.open('hq-pdf').then(function(c){return c.match(e.request).then(function(r){return r||fetch(e.request).then(function(n){if(n.ok)c.put(e.request,n.clone());return n})})}));return}
var nav=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
if(nav){e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request,{ignoreSearch:true})}));return}
e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request)}))});
self.addEventListener('push',function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'حقيبتي',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'حقيبتي',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',dir:'rtl',lang:'ar',tag:d.tag||'hq',renotify:true,silent:false,vibrate:[300,120,300],data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(L){for(var i=0;i<L.length;i++){if(L[i].url.indexOf(self.registration.scope)===0&&'focus' in L[i]){L[i].navigate(u).catch(function(){});return L[i].focus()}}return self.clients.openWindow(u)}))});
