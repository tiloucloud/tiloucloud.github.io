var C='tj-v15';
var SHELL=['./','warsh.woff2','manifest.webmanifest','icon-192.png','fonts/reem-kufi-arabic-700.woff2','fonts/ibm-plex-sans-arabic-arabic-400.woff2','fonts/ibm-plex-sans-arabic-arabic-600.woff2','fonts/ibm-plex-sans-arabic-arabic-700.woff2','fonts/bism.woff2'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(new Request(e.request.url,{cache:'no-cache',credentials:'same-origin'})).then(function(r){if(r.ok){var cp=r.clone();caches.open(C).then(function(c){c.put('./',cp)})}return r}).catch(function(){return caches.match('./')}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(h){return h||fetch(e.request).then(function(r){if(r.ok){var cp=r.clone();caches.open(C).then(function(c){c.put(e.request,cp)})}return r})}));
});
