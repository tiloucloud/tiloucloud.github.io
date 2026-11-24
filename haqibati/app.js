/* حقيبتي — دروس الأستاذ تصل إلى التلميذ عبر العائلة فقط */
'use strict';
function ls0(k){try{return localStorage.getItem(k)}catch(e){return null}}
var DB='https://khatma-16d1b-default-rtdb.firebaseio.com'.replace(/\/+$/,''),root=document.getElementById('app');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
function jget(k,d){try{var v=JSON.parse(ls(k));return v==null?d:v}catch(e){return d}}
function pad(n){return(n<10?'0':'')+n}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function rid(p){return (p||'i')+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function rcode(){var a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',b=new Uint8Array(20),s='';crypto.getRandomValues(b);for(var i=0;i<20;i++)s+=a[b[i]%62];return s}
var CODE_RE=/^[A-Za-z0-9_-]{12,64}$/;
var PAL=[['#0F5F57','#DDEFE9'],['#2F4F8A','#DEE7F5'],['#B4500F','#FDEBD9'],['#6B3FA0','#EDE4F7'],['#3F6B1F','#E6F0DC'],['#A3344F','#F8E1E7'],['#4A5560','#E7EAEC']];
var DEF_SUBS=['العربية','الفرنسية','الرياضيات','أخرى'];
var MAXF=7*1024*1024;

/* ---------- state ---------- */
var code=(location.hash.match(/[#&]a=([A-Za-z0-9_-]{12,64})/)||[])[1]||ls('hq_code')||'';
if(!code){['kf_code','ad_code','tk_code'].some(function(k){var c=ls0(k);if(c&&CODE_RE.test(c)){code=c;return true}})}
(function(){var o=ls('hq_code');if(code&&o&&o!==code){ls('hq_home',null);ls('hq_mine',null);ls('hq_me',null)}})();
var HU=(location.hash.match(/[#&]u=([A-Za-z0-9_-]{1,40})/)||[])[1]||'';
var SHARE=/[#&]share\b/.test(location.hash);
if(code)ls('hq_code',code);if(code&&HU)ls('hq_me',HU);
if(location.hash)history.replaceState(null,'',location.pathname);
var M=jget('hq_M_'+code,[]),H=jget('hq_H_'+code,{}),FN=ls('hq_fn_'+code)||'',OWN='',loaded=M.length>0;
var me=ls('hq_me')||null,home=ls('hq_home')||'',mine=jget('hq_mine',[]),unlocked=null,hidAt=0;
function inherit(p){if(ls0(p+'_code')!==code)return;
  if(!me&&!HU&&ls0(p+'_me')){me=ls0(p+'_me');ls('hq_me',me)}
  var h=ls0(p+'_home');if(!home&&h){home=h;ls('hq_home',h)}if(h&&mine.indexOf(h)<0){mine.push(h);ls('hq_mine',JSON.stringify(mine))}}
if(code&&!HU){inherit('kf');inherit('ad');inherit('tk')}
var seen=jget('hq_seen',{});
var pinBuf='',pinFirst='',pinErr='',pinFails=0,pinWait=0,pinChange=false;
var TAB=ls('hq_tab')||'home',SUBF='',OPEN=null,sheet=null,draft=null,dirty=false,pending=0,toast='',sending=false,qrFor=null;
var FSZ=[1,1.15,1.3,1.5],FL=parseInt(ls('hq_fs'),10);if(!(FL>=0&&FL<=3))FL=0;
function applyFs(){var z=FSZ[FL];document.documentElement.style.zoom=z===1?'':String(z)}applyFs();

function mem(id){for(var i=0;i<M.length;i++)if(M[i].id===id)return M[i];return null}
function nm(id){var m=mem(id);return m?m.name:'—'}
function vis(){return M.filter(function(m){return !m.x})}
function kids(){return vis().filter(function(m){return H.kids&&H.kids[m.id]})}
function isKid(id){return !!(H.kids&&H.kids[id])}
function adults(){return vis().filter(function(m){return !isKid(m.id)})}
function subs(){var s=H.subs;return Array.isArray(s)&&s.length?s.filter(Boolean):DEF_SUBS}
function subCol(s){var i=subs().indexOf(s);return PAL[(i<0?PAL.length-1:i)%PAL.length]}
function cache(){ls('hq_M_'+code,JSON.stringify(M));ls('hq_fn_'+code,FN);ls('hq_H_'+code,JSON.stringify(H))}
function arr(o){return Object.keys(o||{}).map(function(k){var x=o[k]||{};x.id=k;return x})}
function items(){return arr(H.items).filter(function(x){return x.c}).sort(function(a,b){return b.c-a.c})}

/* ---------- sync (same Firebase REST scheme as the other family apps) ---------- */
function url(p){return DB+'/k/'+code+p+'.json'}
function gj(p){return fetch(url(p),{cache:'no-store'}).then(function(r){if(!r.ok)throw r.status;return r.json()})}
function famVid(){var h=5381;for(var i=0;i<(code||'').length;i++)h=((h*33)^code.charCodeAt(i))>>>0;return h===1887904206}
function wr(p,method,body){pending++;return fetch(url(p),{method:method,body:body==null?undefined:JSON.stringify(body)}).then(function(r){if(!r.ok)throw r.status}).catch(function(e){flash('تعذّر الحفظ، تحقّق من الاتصال');throw e}).then(function(){pending--},function(e){pending--;throw e})}
function wq(p,m,b){wr(p,m,b).catch(function(){})}
function pull(){if(!code||!DB)return;
  Promise.all([gj('/members'),gj('/khatma/own'),gj('/khatma/name'),gj('/hq')]).then(function(R){
    if(pending)return;
    var h=R[3]||{},ms=[],km=R[0]||{},lm=h.mem||{},id,x;
    for(id in km){x=km[id];if(x&&x.name)ms.push({id:id,name:String(x.name),i:+x.i||0,k:x.k||'',h:x.h?'1':'',x:x.x?'1':''})}
    for(id in lm){x=lm[id];if(x&&x.name&&!km[id])ms.push({id:id,name:String(x.name),i:1000+(+x.i||0),k:x.k||'',h:x.h?'1':'',x:x.x?'1':'',l:1})}
    ms.sort(function(a,b){return a.i-b.i});
    M=ms;H=h;OWN=h.own||R[1]||(famVid()?'mmwf6wd6v':'');FN=h.name||R[2]||FN||'';loaded=true;cache();soft()}).catch(function(){})}
function busy(){var a=document.activeElement;return sheet||(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'))}
function soft(){if(busy()){dirty=true;return}render()}
document.addEventListener('focusout',function(){setTimeout(function(){if(dirty&&!busy()){dirty=false;render()}},50)});
setInterval(function(){if(!document.hidden)pull()},20000);
function flash(t){toast=t;render();setTimeout(function(){if(toast===t){toast='';soft()}},3500)}
function mPath(m){return m.l?'/hq/mem/'+m.id:'/members/'+m.id}
function putMember(x){fetch(url(mPath(x)),{method:'PATCH',body:JSON.stringify({k:x.k||'',h:x.h||''})}).catch(function(){})}

/* ---------- PIN (same scheme as ختمة/أذكار/مهام العائلة) ---------- */
function setHome(id){if(!home){home=id;ls('hq_home',id)}if(mine.indexOf(id)<0){mine.push(id);ls('hq_mine',JSON.stringify(mine))}}
function pinHash(id,pin){var t=code+':'+id+':'+pin;
  if(window.crypto&&crypto.subtle&&window.TextEncoder)return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.prototype.map.call(new Uint8Array(b).slice(0,12),function(x){return(x<16?'0':'')+x.toString(16)}).join('')});
  var h=5381;for(var i=0;i<t.length;i++)h=((h*33)^t.charCodeAt(i))>>>0;return Promise.resolve('d'+h.toString(16))}
function kidDevice(){return home&&isKid(home)}
function gate(){var m=mem(me);if(!(code&&m))return 'open';
  if(home&&!mem(home)){home='';ls('hq_home',null)}
  if(pinChange)return 'set';
  if(!home&&isKid(me)&&!m.k){setHome(me);return 'open'}
  if(kidDevice()&&me!==home){if(isKid(me))return 'open';return m.k?(unlocked===me?'open':'enter'):'nopin'}
  if(OWN&&me===OWN&&(!m.k||!home||mine.indexOf(me)>=0)){setHome(me);return 'open'}
  if(me===home)return 'open';
  if(isKid(me)&&!m.k)return 'open';
  if(m.k)return unlocked===me?'open':'enter';
  if(m.h)return 'blocked';
  if(!home){setHome(me);m.h='1';putMember(m);return 'open'}
  return unlocked===me?'open':'set'}
function vLock(){
  var m=mem(me),g=gate(),set=g==='set',dots='';
  var back='<button class="gbtn" data-act="me" data-v="'+(kidDevice()?esc(home):'')+'">'+(kidDevice()?'رجوع':'اختر اسماً آخر')+'</button>';
  if(g==='nopin')return '<div class="lock"><div class="lk-in"><img class="appic" src="icon-192.png" alt=""><h2>'+esc(m.name)+' لم يختر رمزاً سرياً بعد</h2><p class="lk-sub">هذا جهاز التلميذ. ليدخل وليّ الأمر منه، يختار أولاً رمزه السري من هاتفه هو: الإعدادات ← اختر رمزي السري.</p>'+back+'</div></div>';
  if(g==='blocked')return '<div class="lock"><div class="lk-in"><img class="appic" src="icon-192.png" alt=""><p class="lk-hi">اسم <b>'+esc(m.name)+'</b> سبق اختياره من هاتف آخر</p><h2>لم يُنشأ رمزه بعد</h2><p class="lk-sub">إن كان هذا هاتفك أنت، فاختر رمزاً سرياً من 4 أرقام.</p><button class="gbtn" data-act="claim">هذا هاتفي: اختر رمزي السري</button>'+back+'</div></div>';
  for(var i=0;i<4;i++)dots+='<i class="'+(i<pinBuf.length?'on':'')+'"></i>';
  var keys=[1,2,3,4,5,6,7,8,9,'',0,'del'].map(function(k){return k===''?'<span></span>':'<button class="pk" data-act="pk" data-v="'+k+'"'+(k==='del'?' aria-label="امسح"':'')+'>'+(k==='del'?'⌫':k)+'</button>'}).join('');
  var wait=pinWait>Date.now();
  return '<div class="lock"><div class="lk-in"><img class="appic" src="icon-192.png" alt=""><p class="lk-hi">السلام عليكم يا <b>'+esc(m.name)+'</b></p>'+
    '<h2>'+(set?(pinFirst?'أعد كتابة الرمز للتأكيد':(pinChange?'اختر رمزك الجديد':'اختر رمزك السري')):'اكتب رمزك السري')+'</h2>'+
    '<p class="lk-sub">هو نفسه في كل تطبيقات العائلة</p>'+
    '<div class="lk-dots'+(pinErr?' bad':'')+'">'+dots+'</div><p class="lk-err" role="alert">'+esc(wait?'انتظر قليلاً ثم حاول من جديد':pinErr)+'</p>'+
    '<div class="lk-pad">'+keys+'</div>'+
    (pinChange?'<button class="lnk lk-sw" data-act="pinx">إلغاء</button>':back.replace('gbtn','lnk lk-sw'))+
    '</div></div>'}
function pinKey(k){
  if(pinWait>Date.now())return;
  if(k==='del'){pinBuf=pinBuf.slice(0,-1);pinErr='';render();return}
  if(pinBuf.length>=4)return;pinBuf+=k;pinErr='';render();
  if(pinBuf.length<4)return;
  var m=mem(me),id=me,p=pinBuf;
  setTimeout(function(){
    if(!m.k||pinChange){
      if(!pinFirst){pinFirst=p;pinBuf='';render();return}
      if(pinFirst!==p){pinFirst='';pinBuf='';pinErr='الرمزان مختلفان، اختر رمزك من جديد';render();return}
      pinHash(id,p).then(function(h){m.k=h;m.h='1';unlocked=id;pinFirst='';pinBuf='';pinChange=false;if(mine.indexOf(id)<0){mine.push(id);ls('hq_mine',JSON.stringify(mine))}putMember(m);cache();render()});return}
    pinHash(id,p).then(function(h){
      if(h===m.k){unlocked=id;pinFails=0;pinBuf='';render()}
      else{pinFails++;pinBuf='';pinErr='الرمز غير صحيح';if(pinFails>=5){pinFails=0;pinWait=Date.now()+30000;setTimeout(render,30100)}render()}})},120)}
document.addEventListener('visibilitychange',function(){
  if(document.hidden){hidAt=Date.now();return}
  pull();if(hidAt&&Date.now()-hidAt>10*60000&&unlocked){unlocked=null;pinBuf='';if(kidDevice()&&me!==home){me=home;ls('hq_me',me)}render()}});

/* ---------- files ---------- */
var FC='hq-files';
function fkey(fid){return location.origin+'/haqibati/__f/'+fid}
function getFile(fid){
  var c=window.caches?caches.open(FC):Promise.reject();
  return c.then(function(cc){return cc.match(fkey(fid)).then(function(r){if(r)return r.blob();throw 0})})
  .catch(function(){return fetch(url('/hqf/'+fid),{cache:'no-store'}).then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(d){
    if(!d||typeof d!=='string')throw 'nf';var i=d.indexOf(','),mt=d.slice(5,d.indexOf(';')),bin=atob(d.slice(i+1)),u=new Uint8Array(bin.length);
    for(var j=0;j<bin.length;j++)u[j]=bin.charCodeAt(j);var b=new Blob([u],{type:mt});
    if(window.caches)caches.open(FC).then(function(cc){cc.put(fkey(fid),new Response(b,{headers:{'content-type':mt}}))}).catch(function(){});
    return b})})}
function readURL(b){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=no;r.readAsDataURL(b)})}
function shrink(file){
  if(!/^image\/(jpeg|png|webp|heic|heif)/.test(file.type)||file.size<350*1024)return Promise.resolve(file);
  return new Promise(function(ok){var u=URL.createObjectURL(file),im=new Image();
    im.onload=function(){var s=Math.min(1,1800/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
      var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);
      c.toBlob(function(b){ok(b&&b.size<file.size?new File([b],(file.name||'image').replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):file)},'image/jpeg',.82)};
    im.onerror=function(){URL.revokeObjectURL(u);ok(file)};im.src=u})}
function kind(mt){return /^image\//.test(mt)?'img':mt==='application/pdf'?'pdf':/^audio\//.test(mt)?'aud':/^video\//.test(mt)?'vid':'doc'}
var KIC={img:'🖼️',pdf:'📄',aud:'🎧',vid:'🎬',doc:'📎'},KLB={img:'صورة',pdf:'PDF',aud:'تسجيل صوتي',vid:'فيديو',doc:'ملف'};
function kb(n){return n>1048576?(n/1048576).toFixed(1)+' م.ب':Math.max(1,Math.round(n/1024))+' ك.ب'}

/* ---------- share target (from WhatsApp via the Android share menu) ---------- */
function takeShare(){if(!window.caches)return Promise.resolve(false);
  return caches.open('hq-share').then(function(c){return c.match('__share/meta').then(function(r){if(!r)return false;
    return r.json().then(function(meta){var ps=[];for(var i=0;i<(meta.n||0);i++)ps.push(c.match('__share/'+i).then(function(x){if(!x)return null;
        return x.blob().then(function(b){return new File([b],decodeURIComponent(x.headers.get('x-name')||'file'),{type:b.type||x.headers.get('content-type')||''})})}));
      return Promise.all(ps).then(function(fs){
        return caches.delete('hq-share').then(function(){
          if(Date.now()-(meta.t||0)>36e5)return false;
          var txt=[meta.title,meta.text,meta.url].filter(Boolean).join('\n').trim();
          newDraft({files:fs.filter(Boolean),txt:txt});return true})})})})}).catch(function(){return false})}

/* ---------- helpers for views ---------- */
function ago(ms){var s=(Date.now()-ms)/1000;if(s<90)return 'الآن';if(s<3600)return 'منذ '+Math.round(s/60)+' د';if(s<86400)return 'منذ '+Math.round(s/3600)+' س';var n=Math.round(s/86400);return n===1?'أمس':'منذ '+n+' أيام'}
function dLab(d){if(!d)return '';var p=d.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('ar-u-nu-latn',{weekday:'long',day:'numeric',month:'long'})}
function forKid(x,k){return !x.to||!Object.keys(x.to).length||!!x.to[k]}
function isDone(x,k){return !!(x.dn&&x.dn[k])}
function ttl(x){if(x.t)return x.t;var l=(x.txt||'').split('\n')[0].trim();if(l)return l.slice(0,70);var f=x.f&&x.f[0],w=x.ty==='h'?'الواجب':'الدرس';if(!f)return w.slice(2);
  var n=f.nm.replace(/\.\w+$/,'');if(/^(IMG|VID|PTT|AUD|DOC|Screenshot|WhatsApp|image|photo|file)[-_ ]|^\d+$|^[A-F0-9-]{16,}$/i.test(n)||n.length<2){var k=kind(f.mt);return k==='img'?'صورة '+w:k==='aud'?'تسجيل صوتي':k==='vid'?'فيديو '+w:'ملف '+w}return n.replace(/[_-]+/g,' ').slice(0,70)}
function from(x){return (x.src==='t'?'من الأستاذ، أرسله ':'من ')+esc(nm(x.by))}
function tag(s){var c=subCol(s);return '<span class="tag" style="color:'+c[0]+';background:'+c[1]+'">'+esc(s||'أخرى')+'</span>'}
function ico(x){var k=x.f&&x.f.length?kind(x.f[0].mt):'txt',c=subCol(x.s);return '<span class="ic" style="background:'+c[1]+'" aria-hidden="true">'+(k==='txt'?'📝':KIC[k])+'</span>'}
function hdr(sub){return '<header class="top"><div class="brand"><img class="appic" src="icon-192.png" alt=""><div><h1>حقيبتي</h1><p>'+esc(sub)+'</p></div></div>'+
  '<div class="tb"><button class="ib" data-act="big" aria-label="تكبير الخط"><b>أ</b><small>'+(FL+1)+'</small></button>'+
  '<button class="ib" data-act="set" aria-label="الإعدادات">⚙️</button></div></header>'}
function chips(){var S=subs();return '<nav class="chips sc" aria-label="المواد"><button class="chip'+(!SUBF?' on':'')+'" data-act="subf" data-v="">الكل</button>'+S.map(function(s){return '<button class="chip'+(SUBF===s?' on':'')+'" data-act="subf" data-v="'+esc(s)+'">'+esc(s)+'</button>'}).join('')+'</nav>'}

/* ---------- views: join / who ---------- */
function vJoin(){
  return '<div class="wrap">'+hdr('دروس الأستاذ، من العائلة فقط')+
    '<section class="card stack hero"><h2 class="ctitle">أهلاً بكم في حقيبتي</h2><p>تطبيق عائلي خاص: يرسل الأب أو الأم أو الجدة دروس الأستاذ وواجباته، فيجدها التلميذ مرتبة حسب المادة، دون واتساب ودون غرباء.</p></section>'+
    '<section class="card stack"><h2 class="ctitle sm">عندك رابط أو رمز من عائلتك؟</h2><form class="form" data-form="join"><input id="joinIn" dir="ltr" autocomplete="off" placeholder="الصق الرابط أو الرمز" aria-label="رابط العائلة أو رمزها"><button class="btn" type="submit">انضم</button></form><p class="err" id="joinErr" role="alert"></p>'+
    '<p class="sub">على جهاز التلميذ: افتح كاميرا الجهاز ووجّهها إلى رمز QR الظاهر في هاتف وليّ الأمر.</p></section>'+
    '<section class="card stack"><h2 class="ctitle sm">أول مرة؟</h2><form class="stack" data-form="create"><label>اسم العائلة<input id="cF" maxlength="40" required placeholder="مثلاً: عائلة الأمين"></label><label>اسمك<input id="cM" maxlength="30" required placeholder="مثلاً: بابا، ماما"></label><button class="btn" type="submit">أنشئ مجموعة العائلة</button></form></section></div>'}
function vWho(){
  if(!loaded)return '<section class="card"><p class="sub">جارٍ التحميل…</p></section>';
  if(!M.length)return '<section class="card stack"><h2 class="ctitle">لم نجد أفراد العائلة</h2><p class="sub">تأكّد من الرابط، أو اطلب من وليّ الأمر إضافتك.</p><button class="btn ghost" data-act="leave">استعمل رابطاً آخر</button></section>';
  return '<section class="card stack"><h2 class="ctitle">من أنت؟</h2><p class="sub">اختر اسمك مرة واحدة، ويتذكّرك جهازك بعدها.</p><div class="chips">'+vis().map(function(m){return '<button class="chip big" data-act="me" data-v="'+m.id+'">'+esc(m.name)+'</button>'}).join('')+'</div></section>'}

/* ---------- kid views ---------- */
function kRow(x,k){var nw=!seen[x.id]&&!isDone(x,k),dn=isDone(x,k);
  return '<li><button class="row" data-act="open" data-v="'+x.id+'">'+ico(x)+'<span class="rx"><small style="color:'+subCol(x.s)[0]+'">'+esc(x.s||'أخرى')+' · '+(x.ty==='h'?'واجب':'درس')+(x.f&&x.f.length?' · '+KLB[kind(x.f[0].mt)]:'')+'</small><b>'+esc(ttl(x))+'</b><small>'+from(x)+' · '+ago(x.c)+(x.ty==='h'&&x.due&&!dn?' · <em class="due">قبل '+esc(dLab(x.due))+'</em>':'')+'</small></span>'+
    (dn?'<span class="ok" aria-label="أنهيته">✓</span>':nw?'<span class="dot" aria-label="جديد"></span>':'')+'</button></li>'}
function kidHome(){var k=me,L=items().filter(function(x){return forKid(x,k)}),F=SUBF?L.filter(function(x){return x.s===SUBF}):L;
  var hw=L.filter(function(x){return x.ty==='h'&&!isDone(x,k)}),nw=F.filter(function(x){return !seen[x.id]&&!isDone(x,k)}),old=F.filter(function(x){return seen[x.id]||isDone(x,k)});
  var ms=arr(H.msgs).filter(function(x){return x.c&&forKid(x,k)}).sort(function(a,b){return b.c-a.c}).slice(0,3);
  var hr=new Date().getHours();
  return '<section class="hello"><small>'+(hr<12?'صباح الخير':hr<18?'مساء الخير':'مساء النور')+'</small><h2>مرحباً يا '+esc(nm(k))+'</h2></section>'+
    (TAB==='home'&&hw.length?'<button class="card hw" data-act="tab" data-v="hw"><span class="ic o" aria-hidden="true">✅</span><span class="rx"><b>'+(hw.length===1?'عندك واجب واحد':hw.length===2?'عندك واجبان':'عندك '+hw.length+(hw.length<=10?' واجبات':' واجباً'))+'</b><small>اضغط لتراها</small></span></button>':'')+
    chips()+
    (TAB==='hw'?'<h3 class="gh">الواجبات</h3>'+(F.filter(function(x){return x.ty==='h'}).length?'<ul class="ls">'+F.filter(function(x){return x.ty==='h'}).sort(function(a,b){return isDone(a,k)-isDone(b,k)}).map(function(x){return kRow(x,k)}).join('')+'</ul>':'<p class="empty">لا واجبات هنا، بارك الله فيك</p>'):
    (nw.length?'<h3 class="gh">الجديد</h3><ul class="ls">'+nw.map(function(x){return kRow(x,k)}).join('')+'</ul>':'')+
    (old.length?'<h3 class="gh">'+(nw.length?'السابق':'دروسي')+'</h3><ul class="ls">'+old.slice(0,60).map(function(x){return kRow(x,k)}).join('')+'</ul>':'')+
    (!F.length?'<p class="empty">لا شيء هنا بعد. ستظهر الدروس عندما ترسلها لك عائلتك.</p>':''))+
    (TAB==='home'&&ms.length?'<h3 class="gh">رسائل العائلة</h3>'+ms.map(function(x){return vMsg(x,k)}).join(''):'')}
function vMsg(x,k){var lv=x.r&&x.r[k];
  return '<div class="msg"><span class="av">'+esc(nm(x.by).slice(0,1))+'</span><div class="rx"><small><b>'+esc(nm(x.by))+'</b> · '+ago(x.c)+'</small><p>'+esc(x.t)+'</p>'+
    (k&&isKid(me)?'<button class="pill'+(lv?' on':'')+'" data-act="love" data-v="'+x.id+'">'+(lv?'❤️ أرسلتِ شكراً':'🤍 شكراً')+'</button>':(x.r?'<small>'+Object.keys(x.r).map(function(i){return '❤️ '+esc(nm(i))}).join(' ')+'</small>':''))+'</div></div>'}

/* ---------- item detail ---------- */
function vItem(x){var kid=isKid(me),K=kids().filter(function(m){return forKid(x,m.id)});
  return '<div class="wrap"><header class="top"><button class="ib" data-act="back" aria-label="رجوع">→</button>'+tag(x.s)+'<span class="tag n">'+(x.ty==='h'?'واجب':'درس')+'</span><span class="sp"></span><button class="ib" data-act="big" aria-label="تكبير الخط"><b>أ</b><small>'+(FL+1)+'</small></button></header>'+
    '<section class="stack"><h2 class="title">'+esc(ttl(x))+'</h2><p class="sub">'+from(x)+' · '+ago(x.c)+(x.due?' · للتسليم '+esc(dLab(x.due)):'')+'</p></section>'+
    (x.n?'<div class="note"><small>ملاحظة من '+esc(nm(x.by))+'</small><p>'+esc(x.n)+'</p></div>':'')+
    (x.txt?'<section class="card"><p class="txt">'+esc(x.txt)+'</p></section>':'')+
    (x.f||[]).map(function(f,i){return '<section class="card att" id="att'+i+'" data-fid="'+esc(f.id)+'" data-mt="'+esc(f.mt)+'"><p class="sub">'+KIC[kind(f.mt)]+' '+esc(f.nm)+' · '+kb(f.sz||0)+'</p><div class="aw"><p class="sub">جارٍ التحميل…</p></div></section>'}).join('')+
    (kid?'<button class="btn big'+(isDone(x,me)?' done':' ghost2')+'" data-act="done" data-v="'+x.id+'">'+(isDone(x,me)?'✓ أنهيته الحمد لله':(x.ty==='h'?'أنهيت الواجب':'أنهيت الدرس'))+'</button>'+(isDone(x,me)?'':'<p class="sub c">سيرى أهلك أنك أنهيته</p>'):
      '<section class="card stack"><h3 class="ctitle sm">من أنهاه؟</h3>'+(K.length?K.map(function(m){var d=isDone(x,m.id);return '<p>'+(d?'✅ ':'⏳ ')+esc(m.name)+(d?' <small class="sub">'+ago(x.dn[m.id])+'</small>':'')+(seen[x.id]===undefined?'':'')+'</p>'}).join(''):'<p class="sub">لم تحدّد تلميذاً بعد. أضفه من تبويب العائلة.</p>')+
      '<button class="lnk dang" data-act="idel" data-v="'+x.id+'">حذف</button></section>')+'</div>'}
var pdfLib=null;
function loadPdf(){if(pdfLib)return pdfLib;pdfLib=import('./pdf/pdf.min.mjs?v=4').then(function(p){p.GlobalWorkerOptions.workerSrc='pdf/pdf.worker.min.mjs?v=4';return p});pdfLib.catch(function(){pdfLib=null});return pdfLib}
function fillAtt(){document.querySelectorAll('.att').forEach(function(el){var fid=el.dataset.fid,mt=el.dataset.mt,w=el.querySelector('.aw');
  getFile(fid).then(function(b){if(!document.body.contains(el))return;var u=URL.createObjectURL(b),k=kind(mt);
    if(k==='img'){w.innerHTML='<img class="pic" src="'+u+'" alt="صورة الدرس"><button class="pill zm" data-act="zoom">🔍 تكبير</button>';return}
    if(k==='aud'){w.innerHTML='<audio controls preload="metadata" src="'+u+'"></audio>';return}
    if(k==='vid'){w.innerHTML='<video controls playsinline preload="metadata" src="'+u+'"></video>';return}
    if(k==='pdf'){w.innerHTML='<p class="sub">جارٍ فتح الصفحات…</p>';
      return loadPdf().then(function(p){return b.arrayBuffer().then(function(ab){return p.getDocument({data:ab}).promise})}).then(function(doc){
        w.innerHTML='<div class="pdf"></div><button class="pill zm" data-act="zoom">🔍 تكبير</button>';var box=w.querySelector('.pdf'),W=Math.min(box.clientWidth||340,900),dpr=Math.min(2.5,(window.devicePixelRatio||1)*1.4),ch=Promise.resolve();
        for(var n=1;n<=Math.min(doc.numPages,40);n++)(function(n){ch=ch.then(function(){return doc.getPage(n).then(function(pg){var v=pg.getViewport({scale:1}),s=W/v.width*dpr,vp=pg.getViewport({scale:s}),c=document.createElement('canvas');
          c.width=vp.width;c.height=vp.height;c.setAttribute('aria-label','صفحة '+n);box.appendChild(c);return pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise})})})(n)})
      .catch(function(){w.innerHTML='<a class="btn ghost" href="'+u+'" download="'+esc(el.querySelector('p').textContent)+'">افتح الملف</a>'})}
    w.innerHTML='<a class="btn ghost" href="'+u+'" download>افتح الملف</a>'})
  .catch(function(){w.innerHTML='<p class="err">تعذّر تحميل الملف. تحقّق من الاتصال ثم أعد المحاولة.</p><button class="pill" data-act="retry">أعد المحاولة</button>'})})}

/* ---------- parent views ---------- */
function pRow(x){var K=kids().filter(function(m){return forKid(x,m.id)}),d=K.filter(function(m){return isDone(x,m.id)}).length;
  return '<li><button class="row" data-act="open" data-v="'+x.id+'">'+ico(x)+'<span class="rx"><small style="color:'+subCol(x.s)[0]+'">'+esc(x.s||'أخرى')+' · '+(x.ty==='h'?'واجب':'درس')+'</small><b>'+esc(ttl(x))+'</b><small>'+from(x)+' · '+ago(x.c)+'</small></span>'+
    (K.length?'<span class="cnt'+(d===K.length?' all':'')+'">'+(d===K.length?'✓':d+'/'+K.length)+'</span>':'')+'</button></li>'}
function parentHome(){var L=items(),F=SUBF?L.filter(function(x){return x.s===SUBF}):L;
  var k=kids();
  return (k.length?'':'<section class="card stack warn"><h2 class="ctitle sm">خطوة أولى: أضف التلميذ</h2><p>أضف اسم ابنك أو ابنتك، ثم جهّز جهازه ليرى الدروس.</p><button class="btn" data-act="tab" data-v="fam">إلى تبويب العائلة</button></section>')+
    '<section class="card stack how"><b>لإرسال درس من واتساب</b><p class="sub">اضغط مطوّلاً على الدرس في قناة الأستاذ ← مشاركة ← حقيبتي. أو اضغط زر ＋ واختر الملف من جهازك.</p></section>'+
    chips()+(F.length?'<ul class="ls">'+F.slice(0,80).map(pRow).join('')+'</ul>':'<p class="empty">لم تُرسل دروس بعد.</p>')}
function vFam(){var me0=mem(me),K=kids(),A=adults();
  var ms=arr(H.msgs).filter(function(x){return x.c}).sort(function(a,b){return b.c-a.c}).slice(0,6);
  return '<section class="card stack"><h2 class="ctitle sm">رسالة إلى '+(K.length===1?esc(K[0].name):'التلاميذ')+'</h2><form class="form" data-form="msg"><input id="msgIn" maxlength="200" autocomplete="off" placeholder="مثلاً: أحسنتِ في واجب الأمس"><button class="btn" type="submit">أرسل</button></form>'+
    (ms.length?ms.map(function(x){return vMsg(x,null)}).join(''):'')+'</section>'+
    '<section class="card stack"><h2 class="ctitle sm">التلاميذ</h2>'+(K.length?K.map(function(m){return '<div class="mrow"><span class="av k">'+esc(m.name.slice(0,1))+'</span><b>'+esc(m.name)+'</b><button class="pill go" data-act="qr" data-v="'+m.id+'">📲 جهّز جهازه</button><button class="pill" data-act="unkid" data-v="'+m.id+'" aria-label="ليس تلميذاً">✕</button></div>'}).join(''):'<p class="sub">لا تلاميذ بعد.</p>')+
    '<form class="form" data-form="kid"><input id="kidIn" maxlength="30" autocomplete="off" placeholder="اسم التلميذ"><button class="btn" type="submit">أضف</button></form>'+
    (A.length>1?'<p class="sub">أو اختر من أفراد العائلة:</p><div class="chips">'+A.filter(function(m){return m.id!==me}).map(function(m){return '<button class="chip" data-act="mkkid" data-v="'+m.id+'">+ '+esc(m.name)+'</button>'}).join('')+'</div>':'')+'</section>'+
    (qrFor?vQR():'')+
    '<section class="card stack"><h2 class="ctitle sm">من يرسل الدروس</h2>'+A.map(function(m){return '<p>'+(m.k?'🔒 ':'')+esc(m.name)+(m.id===me?' <small class="sub">(أنت)</small>':'')+'</p>'}).join('')+
    '<form class="form" data-form="adult"><input id="adIn" maxlength="30" autocomplete="off" placeholder="مثلاً: الجدة"><button class="btn" type="submit">أضف</button></form>'+
    '<button class="btn ghost" data-act="invite">🔗 أرسل رابط حقيبتي لأحد الأهل</button>'+
    (me0&&!me0.k?'<div class="note"><b>احمِ حسابك برمز سري</b><p>حتى لا يستطيع أحد من جهاز التلميذ الدخول باسمك.</p><button class="pill go" data-act="pinchg">🔑 اختر رمزي السري</button></div>':'')+'</section>'+
    '<section class="card stack"><h2 class="ctitle sm">المواد</h2><div class="chips">'+subs().map(function(s){return tag(s)}).join('')+'</div><form class="form" data-form="subs"><input id="subIn" maxlength="200" autocomplete="off" value="'+esc(subs().join('، '))+'" aria-label="المواد مفصولة بفاصلة"><button class="btn" type="submit">احفظ</button></form><p class="sub">اكتب المواد مفصولة بفاصلة.</p></section>'}
function vQR(){var m=mem(qrFor);if(!m)return '';var link=location.origin+'/haqibati/#a='+code+'&u='+m.id;
  return '<section class="card stack qr" id="qrbox"><h2 class="ctitle sm">جهّز جهاز '+esc(m.name)+'</h2>'+
    '<ol class="steps"><li>ثبّت «حقيبتي» على جهازه من Google Play.</li><li>افتح كاميرا جهازه (أو Google Lens) ووجّهها إلى هذا الرمز، ثم اضغط الرابط.</li><li>سيفتح التطبيق باسمه مباشرة، ولا يرى إلا دروسه.</li></ol>'+
    '<div class="qrc" id="qrc" aria-label="رمز QR لربط جهاز '+esc(m.name)+'"></div>'+
    '<details><summary>لا توجد كاميرا؟</summary><p class="sub">اكتب هذا الرمز في خانة «انضم» على جهازه، ثم اختر اسمه:</p><p class="code" dir="ltr">'+esc(code)+'</p></details>'+
    '<button class="lnk" data-act="qr" data-v="">إغلاق</button><input type="hidden" id="qrlink" value="'+esc(link)+'"></section>'}
function drawQR(){var el=document.getElementById('qrc'),l=document.getElementById('qrlink');if(!el||!l)return;
  function go(){var q=qrcode(0,'M');q.addData(l.value);q.make();el.innerHTML=q.createSvgTag({cellSize:6,margin:3,scalable:true})}
  if(window.qrcode)go();else{var s=document.createElement('script');s.src='qr.js?v=1';s.onload=go;document.head.appendChild(s)}}

/* ---------- new item sheet ---------- */
function newDraft(o){var K=kids();draft={files:(o&&o.files)||[],txt:(o&&o.txt)||'',s:SUBF||'',ty:'l',t:'',n:'',src:(o&&(o.files||o.txt))?'t':'t',to:{},due:''};
  if(K.length===1)draft.to[K[0].id]=1;
  if(!draft.s){var hay=(draft.txt+' '+draft.files.map(function(f){return f.name||''}).join(' ')).toLowerCase(),AL={'الفرنسية':['فرنس','franç','franc'],'الرياضيات':['رياضي','math'],'العربية':['عربي','arabe'],'الإنجليزية':['إنجليز','انجليز','anglais','english'],'التربية الإسلامية':['إسلامي','اسلامي'],'النشاط العلمي':['علمي','science']};
    subs().some(function(s){var keys=(AL[s]||[]).concat([s.replace(/^ال/,'')]);return keys.some(function(k){if(k&&hay.indexOf(k.toLowerCase())>=0){draft.s=s;return true}})})}
  sheet='new'}
function vNew(){var d=draft,S=subs(),K=kids();
  return '<div class="ov" data-act="ovx"><form class="sht stack" data-form="send" role="dialog" aria-label="إرسال درس"><div class="sh2"><h2 class="ctitle">إرسال إلى '+(K.length===1?esc(K[0].name):'التلاميذ')+'</h2><button type="button" class="ib" data-act="close" aria-label="إغلاق">✕</button></div>'+
    (d.files.length?'<ul class="fl">'+d.files.map(function(f,i){return '<li>'+KIC[kind(f.type)]+' <span>'+esc(f.name||'ملف')+'</span><small>'+kb(f.size)+'</small><button type="button" class="ib s" data-act="frm" data-v="'+i+'" aria-label="احذف الملف">✕</button></li>'}).join('')+'</ul>':'')+
    '<div class="two"><label class="btn ghost fileb">📎 ملف أو صورة<input type="file" id="fIn" multiple accept="image/*,application/pdf,audio/*,video/*"></label><label class="btn ghost fileb">📷 صوّر الصفحة<input type="file" id="cIn" accept="image/*" capture="environment"></label></div>'+
    '<label><span>النص <small>(اختياري)</small></span><textarea id="dTx" rows="3" maxlength="4000" placeholder="انسخ هنا نص رسالة الأستاذ إن وُجد">'+esc(d.txt)+'</textarea></label>'+
    '<div class="lb">المادة</div><div class="chips">'+S.map(function(s){return '<button type="button" class="chip'+(d.s===s?' on':'')+'" data-act="dsub" data-v="'+esc(s)+'">'+esc(s)+'</button>'}).join('')+'</div>'+
    '<div class="seg"><button type="button" class="'+(d.ty==='l'?'on':'')+'" data-act="dty" data-v="l">درس</button><button type="button" class="'+(d.ty==='h'?'on':'')+'" data-act="dty" data-v="h">واجب</button></div>'+
    (d.ty==='h'?'<label><span>آخر أجل <small>(اختياري)</small></span><input type="date" id="dDu" value="'+esc(d.due)+'"></label>':'')+
    '<label><span>العنوان <small>(اختياري)</small></span><input id="dT" maxlength="80" autocomplete="off" value="'+esc(d.t)+'" placeholder="مثلاً: الجملة الفعلية"></label>'+
    '<label class="chk"><input type="checkbox" id="dSrc"'+(d.src==='t'?' checked':'')+'> من الأستاذ</label>'+
    (K.length>1?'<div class="lb">إلى <small>(بلا اختيار = الجميع)</small></div><div class="chips">'+K.map(function(m){return '<button type="button" class="chip'+(d.to[m.id]?' on':'')+'" data-act="dto" data-v="'+m.id+'">'+esc(m.name)+'</button>'}).join('')+'</div>':'')+
    '<label><span>ملاحظة منك <small>(اختياري)</small></span><input id="dN" maxlength="200" autocomplete="off" value="'+esc(d.n)+'" placeholder="مثلاً: اقرئي الدرس مرتين"></label>'+
    '<p class="err" id="dErr" role="alert"></p><button class="btn big" type="submit"'+(sending?' disabled':'')+'>'+(sending?'جارٍ الإرسال…':'أرسل')+'</button></form></div>'}
function readDraft(){if(!draft||sheet!=='new')return;var g=function(i){return document.getElementById(i)};
  if(g('dTx'))draft.txt=g('dTx').value;if(g('dT'))draft.t=g('dT').value;if(g('dN'))draft.n=g('dN').value;if(g('dDu'))draft.due=g('dDu').value;if(g('dSrc'))draft.src=g('dSrc').checked?'t':'f'}
function send(){readDraft();var d=draft,e=document.getElementById('dErr');
  if(!d.files.length&&!d.txt.trim()){e.textContent='أضف ملفاً أو صورة أو نصاً';return}
  if(!d.s){e.textContent='اختر المادة';return}
  sending=true;render();
  var id=rid('i'),metas=[];
  var ch=Promise.resolve();
  d.files.forEach(function(f0){ch=ch.then(function(){return shrink(f0)}).then(function(f){if(f.size>MAXF)throw new Error('الملف «'+(f.name||'')+'» أكبر من 7 ميغابايت');
    return readURL(f).then(function(du){var fid=rid('f'),mt=f.type||'application/octet-stream';if(du.indexOf('data:;')===0)du='data:'+mt+du.slice(5);
      return wr('/hqf/'+fid,'PUT',du).then(function(){metas.push({id:fid,nm:(f.name||'ملف').slice(0,80),mt:mt,sz:f.size});
        if(window.caches)caches.open(FC).then(function(c){c.put(fkey(fid),new Response(f,{headers:{'content-type':mt}}))}).catch(function(){})})})})});
  ch.then(function(){var o={s:d.s,ty:d.ty,t:d.t.trim().slice(0,80),n:d.n.trim().slice(0,200),txt:d.txt.trim().slice(0,4000),src:d.src,by:me,c:Date.now(),f:metas.length?metas:null,to:Object.keys(d.to).length?d.to:null,due:d.ty==='h'&&d.due?d.due:null};
    H.items=H.items||{};H.items[id]=o;cache();return wr('/hq/items/'+id,'PUT',o)})
  .then(function(){sending=false;sheet=null;draft=null;flash('وصل الدرس إلى '+(kids().length===1?kids()[0].name:'التلاميذ'))})
  .catch(function(err){sending=false;render();var x=document.getElementById('dErr');if(x)x.textContent=(err&&err.message&&/[؀-ۿ]/.test(err.message))?err.message:'تعذّر الإرسال، تحقّق من الاتصال وأعد المحاولة'})}
function addFiles(list){readDraft();for(var i=0;i<list.length;i++)draft.files.push(list[i]);render()}

/* ---------- settings ---------- */
function vSet(){var m=mem(me),kid=isKid(me);
  return '<div class="ov" data-act="ovx"><div class="sht stack" role="dialog" aria-label="الإعدادات"><div class="sh2"><h2 class="ctitle">⚙️ الإعدادات</h2><button class="ib" data-act="set" aria-label="إغلاق">✕</button></div>'+
    (kid?'<p class="sub">هذا جهاز '+esc(m.name)+'. لا يرى إلا الدروس والرسائل التي ترسلها له عائلته.</p>'+
      '<button class="btn ghost" data-act="adm">🔒 دخول وليّ الأمر</button>':
      (m?'<button class="btn ghost" data-act="me" data-v="">👤 لستُ '+esc(m.name)+'؟ بدّل الاسم</button>':'')+
      (m&&(me===home||unlocked===me||mine.indexOf(me)>=0)?'<button class="btn ghost" data-act="pinchg">🔑 '+(m.k?'تغيير رمزي السري':'اختر رمزي السري')+'</button>':'')+
      (kidDevice()&&me!==home?'<button class="btn ghost" data-act="me" data-v="'+esc(home)+'">↩ رجوع إلى حساب '+esc(nm(home))+'</button>':''))+
    '<p class="sub">مجاني، بلا إعلانات وبلا غرباء. <a href="privacy.html">الخصوصية</a> · الإصدار '+ver()+'</p></div></div>'}
function vAdm(){return '<div class="ov" data-act="ovx"><div class="sht stack" role="dialog" aria-label="دخول وليّ الأمر"><div class="sh2"><h2 class="ctitle">دخول وليّ الأمر</h2><button class="ib" data-act="close" aria-label="إغلاق">✕</button></div><p class="sub">اختر اسمك، ثم اكتب رمزك السري.</p><div class="chips">'+
  adults().map(function(m){return '<button class="chip big" data-act="me" data-v="'+m.id+'">'+esc(m.name)+'</button>'}).join('')+'</div></div></div>'}
function ver(){return (document.querySelector('script[src*="app.js"]')||{src:''}).src.split('v=')[1]||''}
function nav(kid){var T=kid?[['home','📚','دروسي'],['hw','✅','واجباتي']]:[['home','📚','الدروس'],['fam','👨‍👩‍👧','العائلة']];
  var hw=kid?items().filter(function(x){return x.ty==='h'&&forKid(x,me)&&!isDone(x,me)}).length:0;
  return '<nav class="bn">'+T.map(function(x){var c=x[0]==='hw'?hw:0;return '<button class="'+(TAB===x[0]?'on':'')+'" data-act="tab" data-v="'+x[0]+'"'+(TAB===x[0]?' aria-current="page"':'')+'><span>'+x[1]+(c?'<em>'+c+'</em>':'')+'</span>'+x[2]+'</button>'}).join('')+'</nav>'}

/* ---------- render ---------- */
function render(){
  if(!code){root.innerHTML=vJoin();return}
  applyFs();readDraft();
  if(gate()!=='open'){root.innerHTML=vLock();return}
  var m=mem(me),kid=m&&isKid(me),body;
  if(m&&kid&&TAB==='fam')TAB='home';if(m&&!kid&&TAB==='hw')TAB='home';
  if(m&&OPEN&&H.items&&H.items[OPEN]){var x=H.items[OPEN];x.id=OPEN;
    if(kid&&!seen[OPEN]){seen[OPEN]=1;ls('hq_seen',JSON.stringify(seen))}
    root.innerHTML=vItem(x)+(toast?'<div class="toast" role="status">'+esc(toast)+'</div>':'');fillAtt();return}
  OPEN=null;
  if(!m)body=vWho();else if(kid)body=kidHome();else body=TAB==='fam'?vFam():parentHome();
  var sub=m?(kid?(FN||'عائلتي'):(FN||'عائلتي')+' · '+nm(me)):'دروس الأستاذ، من العائلة فقط';
  root.innerHTML='<div class="wrap">'+hdr(sub)+body+'</div>'+(m?nav(kid)+(!kid&&TAB==='home'?'<button class="fab" data-act="new" aria-label="إرسال درس">＋</button>':''):'')+
    (sheet==='new'&&draft?vNew():'')+(sheet==='set'?vSet():'')+(sheet==='adm'?vAdm():'')+(toast?'<div class="toast" role="status">'+esc(toast)+'</div>':'');
  if(qrFor)drawQR()}

/* ---------- actions ---------- */
function addMember(name,local,kidFlag){var id=rid('m'),i=M.length;var o={name:name,i:i};
  M.push({id:id,name:name,i:local?1000+i:i,l:local?1:0});
  if(kidFlag){H.kids=H.kids||{};H.kids[id]=true}
  if(local){H.mem=H.mem||{};H.mem[id]=o;wq('/hq/mem/'+id,'PUT',o)}else wq('/members/'+id,'PUT',o);
  if(kidFlag)wq('/hq/kids/'+id,'PUT',true);cache();return id}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t)return;var a=t.dataset.act,v=t.dataset.v;
  if(a==='ovx'){if(e.target===t){readDraft();if(sheet!=='new'){sheet=null}render()}return}
  if(a==='tab'){TAB=v;ls('hq_tab',v);OPEN=null;render();window.scrollTo(0,0);return}
  if(a==='subf'){SUBF=v;render();return}
  if(a==='big'){FL=(FL+1)%4;ls('hq_fs',String(FL));applyFs();render();return}
  if(a==='set'){sheet=sheet==='set'?null:'set';render();return}
  if(a==='adm'){sheet='adm';render();return}
  if(a==='pk'){pinKey(v);return}
  if(a==='claim'){pinChange=true;pinBuf='';pinFirst='';pinErr='';render();return}
  if(a==='pinchg'){if(me===home||unlocked===me||mine.indexOf(me)>=0){sheet=null;pinChange=true;pinBuf='';pinFirst='';pinErr='';render();window.scrollTo(0,0)}return}
  if(a==='pinx'){pinChange=false;pinBuf='';pinFirst='';pinErr='';render();return}
  if(a==='me'){pinBuf='';pinFirst='';pinErr='';pinChange=false;unlocked=null;sheet=null;OPEN=null;TAB='home';me=v||null;ls('hq_me',me);render();window.scrollTo(0,0);return}
  if(a==='leave'){code='';ls('hq_code',null);me=null;ls('hq_me',null);render();return}
  if(a==='open'){OPEN=v;render();window.scrollTo(0,0);return}
  if(a==='back'){OPEN=null;render();return}
  if(a==='retry'){render();return}
  if(a==='zoom'){var w=t.parentNode;w.classList.toggle('zoomed');t.textContent=w.classList.contains('zoomed')?'🔍 تصغير':'🔍 تكبير';return}
  if(a==='done'){var x=H.items&&H.items[v];if(!x)return;x.dn=x.dn||{};if(x.dn[me]){delete x.dn[me];wq('/hq/items/'+v+'/dn/'+me,'DELETE')}else{x.dn[me]=Date.now();wq('/hq/items/'+v+'/dn/'+me,'PUT',x.dn[me]);try{navigator.vibrate&&navigator.vibrate([20,40,30])}catch(z){}}cache();render();return}
  if(a==='love'){var g=H.msgs&&H.msgs[v];if(!g)return;g.r=g.r||{};if(g.r[me]){delete g.r[me];wq('/hq/msgs/'+v+'/r/'+me,'DELETE')}else{g.r[me]=Date.now();wq('/hq/msgs/'+v+'/r/'+me,'PUT',g.r[me])}cache();render();return}
  if(a==='idel'){var y=H.items&&H.items[v];if(!y||!confirm('حذف «'+ttl(y)+'» من حقيبة التلميذ؟'))return;(y.f||[]).forEach(function(f){wq('/hqf/'+f.id,'DELETE')});delete H.items[v];wq('/hq/items/'+v,'DELETE');cache();OPEN=null;render();return}
  if(a==='new'){newDraft();render();return}
  if(a==='close'){readDraft();sheet=null;draft=null;render();return}
  if(a==='frm'){readDraft();draft.files.splice(+v,1);render();return}
  if(a==='dsub'){readDraft();draft.s=v;render();return}
  if(a==='dty'){readDraft();draft.ty=v;render();return}
  if(a==='dto'){readDraft();if(draft.to[v])delete draft.to[v];else draft.to[v]=1;render();return}
  if(a==='mkkid'){H.kids=H.kids||{};H.kids[v]=true;wq('/hq/kids/'+v,'PUT',true);cache();render();return}
  if(a==='unkid'){if(!confirm('إزالة '+nm(v)+' من التلاميذ؟'))return;delete H.kids[v];wq('/hq/kids/'+v,'DELETE');cache();render();return}
  if(a==='qr'){qrFor=v||null;render();var q=document.getElementById('qrbox');if(q)q.scrollIntoView({behavior:'smooth'});return}
  if(a==='invite'){var u=location.origin+'/haqibati/#a='+code,txt='السلام عليكم، هذا تطبيق «حقيبتي» لنرسل منه دروس الأستاذ للأولاد. ثبّته ثم افتح هذا الرابط واختر اسمك:\n'+u;
    if(navigator.share)navigator.share({title:'حقيبتي',text:txt}).catch(function(){});else window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');return}
});
document.addEventListener('change',function(e){var t=e.target;if((t.id==='fIn'||t.id==='cIn')&&t.files&&t.files.length)addFiles(t.files)});
document.addEventListener('submit',function(e){
  var f=e.target.dataset.form;if(!f)return;e.preventDefault();var g=function(i){var x=document.getElementById(i);return (x&&x.value||'').trim()};
  if(f==='send'){if(!sending)send();return}
  if(f==='join'){var s=g('joinIn'),m=s.match(/[#&]a=([A-Za-z0-9_-]{12,64})/)||s.match(/^([A-Za-z0-9_-]{12,64})$/),u=s.match(/[#&]u=([A-Za-z0-9_-]{1,40})/);
    if(!m){document.getElementById('joinErr').textContent='الرابط أو الرمز غير صحيح';return}
    code=m[1];ls('hq_code',code);M=[];H={};loaded=false;if(u){me=u[1];ls('hq_me',me)}else{inherit('kf');inherit('ad');inherit('tk')}render();pull();return}
  if(f==='create'){var fn=g('cF').slice(0,40),mn=g('cM').slice(0,30);if(!fn||!mn)return;
    code=rcode();ls('hq_code',code);M=[];H={own:'',name:fn};FN=fn;loaded=true;
    var id=addMember(mn,true,false);H.own=id;OWN=id;me=id;ls('hq_me',id);setHome(id);
    wq('/hq/own','PUT',id);wq('/hq/name','PUT',fn);wq('/hq/subs','PUT',DEF_SUBS);TAB='fam';cache();render();return}
  if(f==='kid'){var kn=g('kidIn').slice(0,30);if(!kn)return;addMember(kn,true,true);render();return}
  if(f==='adult'){var an=g('adIn').slice(0,30);if(!an)return;addMember(an,true,false);render();return}
  if(f==='msg'){var mt=g('msgIn').slice(0,200);if(!mt)return;var id2=rid('g'),o={by:me,t:mt,c:Date.now()};H.msgs=H.msgs||{};H.msgs[id2]=o;wq('/hq/msgs/'+id2,'PUT',o);cache();render();return}
  if(f==='subs'){var L=g('subIn').split(/[،,]/).map(function(x){return x.trim().slice(0,30)}).filter(Boolean).slice(0,12);if(!L.length)return;H.subs=L;wq('/hq/subs','PUT',L);cache();flash('حُفظت المواد');return}
});
render();pull();
(SHARE?takeShare():Promise.resolve(false)).then(function(ok){if(!ok)return takeShare()}).then(function(){if(sheet==='new'){if(isKid(me)){sheet=null;draft=null}render()}});
if('serviceWorker' in navigator){var hadCtl=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadCtl&&!window.__rl&&!sheet){window.__rl=1;location.reload()}});
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){try{r.update()}catch(e){}}).catch(function(){})}
