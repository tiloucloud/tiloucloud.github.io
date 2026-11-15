var C='kf-v25';
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','warsh.woff2','manifest.webmanifest','icon2-192.png','fonts/reem-kufi-arabic-700.woff2','fonts/ibm-plex-sans-arabic-arabic-400.woff2','fonts/ibm-plex-sans-arabic-arabic-600.woff2'])}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('push',function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'ختمة العائلة',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'ختمة العائلة',{body:d.body||'',icon:'icon2-192.png',badge:'icon2-192.png',dir:'rtl',lang:'ar',tag:d.tag||'khatma',renotify:true,data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var u=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){if(cs[i].url.indexOf(self.registration.scope)===0&&'focus' in cs[i])return cs[i].focus()}
    return self.clients.openWindow(u);
  }));
});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(new Request(e.request.url,{cache:'no-cache',credentials:'same-origin'})).then(function(r){if(r.ok){var cp=r.clone();caches.open(C).then(function(c){c.put('./',cp)})}return r}).catch(function(){return caches.match('./')}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(h){return h||fetch(e.request).then(function(r){if(r.ok){var cp=r.clone();caches.open(C).then(function(c){c.put(e.request,cp)})}return r})}));
});
