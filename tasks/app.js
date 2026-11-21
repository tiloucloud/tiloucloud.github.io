/* مهام العائلة */
'use strict';
function ls0(k){try{return localStorage.getItem(k)}catch(e){return null}}
var VAPID='BK9pSZwhnJPm5ignUy7GkbfL49n9_lZbgnHEq6K5TeOaT5zDzkJp5RF0DbjShH-zWK-lDdx2SqQjcBrLsHDPNQc',DB='https://khatma-16d1b-default-rtdb.firebaseio.com'.replace(/\/+$/,''),nOn=ls0('tk_sub')!=null,nBusy=false,nErr='';
var root=document.getElementById('app');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
function jget(k,d){try{var v=JSON.parse(ls(k));return v==null?d:v}catch(e){return d}}
function pad(n){return(n<10?'0':'')+n}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function today(){var d=new Date();d.setHours(0,0,0,0);return d}
function addDays(s,n){var p=s.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()+n);return iso(d)}
function rid(p){return (p||'t')+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
var CODE_RE=/^[A-Za-z0-9_-]{12,64}$/;

/* ---------- state ---------- */
var code=(location.hash.match(/[#&]a=([A-Za-z0-9_-]{12,64})/)||[])[1]||ls('tk_code')||'';
if(!code){var c0=ls0('kf_code')||ls0('ad_code');if(c0&&CODE_RE.test(c0))code=c0}
(function(){var o=ls('tk_code');if(code&&o&&o!==code){ls('tk_home',null);ls('tk_mine',null);ls('tk_me',null)}})();
var HU=(location.hash.match(/[#&]u=([A-Za-z0-9_-]{1,40})/)||[])[1]||'';
var TAB=(location.hash.match(/[#&]tab=(shop|tasks|mine)/)||[])[1]||ls('tk_tab')||'shop';
if(code)ls('tk_code',code);if(code&&HU)ls('tk_me',HU);
if(location.hash)history.replaceState(null,'',location.pathname);
var M=jget('tk_M_'+code,[]),FN=ls('tk_fn_'+code)||'',OWN='',D=jget('tk_D_'+code,{shop:{},tasks:{}}),loaded=M.length>0;
var me=ls('tk_me')||null,home=ls('tk_home')||'',mine=jget('tk_mine',[]),unlocked=null,hidAt=0;
function inherit(p){if(ls0(p+'_code')!==code)return;
  if(!me&&ls0(p+'_me')){me=ls0(p+'_me');ls('tk_me',me)}
  var h=ls0(p+'_home');if(!home&&h){home=h;ls('tk_home',h)}if(h&&mine.indexOf(h)<0){mine.push(h);ls('tk_mine',JSON.stringify(mine))}}
if(code){inherit('kf');inherit('ad')}
var pinBuf='',pinFirst='',pinErr='',pinFails=0,pinWait=0,pinChange=false;
var sheet=null,draft=null,setOpen=false,showDone=false,dirty=false,pending=0,toast='';
var FSZ=[1,1.15,1.3,1.5],FL=parseInt(ls('tk_fs'),10);if(!(FL>=0&&FL<=3))FL=0;
function applyFs(){var z=FSZ[FL];document.documentElement.style.zoom=z===1?'':String(z)}applyFs();
function mem(id){for(var i=0;i<M.length;i++)if(M[i].id===id)return M[i];return null}
function nm(id){var m=mem(id);return m?m.name:'—'}
function vis(){return M.filter(function(m){return !m.x})}
function cache(){ls('tk_M_'+code,JSON.stringify(M));ls('tk_D_'+code,JSON.stringify(D));ls('tk_fn_'+code,FN)}

/* ---------- sync ---------- */
function url(p){return DB+'/k/'+code+p+'.json'}
function gj(p){return fetch(url(p),{cache:'no-store'}).then(function(r){if(!r.ok)throw r.status;return r.json()})}
function famVid(){var h=5381;for(var i=0;i<(code||'').length;i++)h=((h*33)^code.charCodeAt(i))>>>0;return h===1887904206}
function wr(p,method,body){pending++;return fetch(url(p),{method:method,body:body==null?undefined:JSON.stringify(body)}).then(function(r){if(!r.ok)throw r.status}).catch(function(){flash('تعذّر الحفظ، تحقّق من الاتصال')}).then(function(){pending--})}
function pull(){if(!code||!DB)return;
  Promise.all([gj('/members'),gj('/khatma/own'),gj('/khatma/name'),gj('/tk/shop'),gj('/tk/tasks')]).then(function(R){
    if(pending)return;
    var km=R[0]||{},ms=[];
    for(var id in km){var x=km[id];if(x&&x.name)ms.push({id:id,name:String(x.name),i:+x.i||0,k:x.k||'',h:x.h?'1':'',x:x.x?'1':''})}
    ms.sort(function(a,b){return a.i-b.i});
    M=ms;OWN=R[1]||(famVid()?'mmwf6wd6v':'');FN=R[2]||FN||'';
    D={shop:R[3]||{},tasks:R[4]||{}};loaded=true;cache();soft()}).catch(function(){})}
function busy(){var a=document.activeElement;return sheet||(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'))}
function soft(){if(busy()){dirty=true;return}render()}
document.addEventListener('focusout',function(){setTimeout(function(){if(dirty&&!busy()){dirty=false;render()}},50)});
setInterval(function(){if(!document.hidden)pull()},15000);
function flash(t){toast=t;render();setTimeout(function(){if(toast===t){toast='';soft()}},3500)}
function putMember(x){fetch(url('/members/'+x.id),{method:'PATCH',body:JSON.stringify({k:x.k||'',h:x.h||''})}).catch(function(){})}

/* ---------- push ---------- */
function pushOK(){return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}
function b64u(s){var p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),o=new Uint8Array(r.length);for(var i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o}
function hkey(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return 's'+h.toString(36)+s.length.toString(36)}
function enableNotif(){
  if(!pushOK()||nBusy)return;nBusy=true;nErr='';render();
  Notification.requestPermission().then(function(p){if(p!=='granted')throw new Error('لم تُمنح إذن التنبيهات.');return navigator.serviceWorker.ready})
  .then(function(reg){return reg.pushManager.getSubscription().then(function(x){return x||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID)})})})
  .then(function(sub){var j=sub.toJSON(),k=hkey(j.endpoint);
    return fetch(url('/tk/subs/'+k),{method:'PUT',body:JSON.stringify({e:j.endpoint,k:j.keys,m:me||'',t:Date.now()})}).then(function(r){if(!r.ok)throw new Error('تعذّر الحفظ، تحقّق من الاتصال.');ls('tk_sub',k);nOn=true;fetch(DB+'/pidx/'+code+'.json',{method:'PUT',body:'true'}).catch(function(){})})})
  .catch(function(e){nErr=(e&&e.message&&/[؀-ۿ]/.test(e.message))?e.message:'تعذّر تفعيل التذكير على هذا الهاتف.'}).then(function(){nBusy=false;render()})}
function syncSubMember(){var k=ls('tk_sub');if(k&&code&&DB)fetch(url('/tk/subs/'+k+'/m'),{method:'PUT',body:JSON.stringify(me||'')}).catch(function(){})}

/* ---------- PIN (same scheme as أذكار/ختمة العائلة) ---------- */
function setHome(id){if(!home){home=id;ls('tk_home',id)}if(mine.indexOf(id)<0){mine.push(id);ls('tk_mine',JSON.stringify(mine))}}
function pinHash(id,pin){var t=code+':'+id+':'+pin;
  if(window.crypto&&crypto.subtle&&window.TextEncoder)return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.prototype.map.call(new Uint8Array(b).slice(0,12),function(x){return(x<16?'0':'')+x.toString(16)}).join('')});
  var h=5381;for(var i=0;i<t.length;i++)h=((h*33)^t.charCodeAt(i))>>>0;return Promise.resolve('d'+h.toString(16))}
function gate(){var m=mem(me);if(!(code&&m))return 'open';
  if(home&&!mem(home)){home='';ls('tk_home',null)}
  if(pinChange)return 'set';
  if(OWN&&me===OWN&&(!m.k||!home||mine.indexOf(me)>=0)){setHome(me);return 'open'}
  if(me===home)return 'open';
  if(m.k)return unlocked===me?'open':'enter';
  if(m.h)return 'blocked';
  if(!home){setHome(me);m.h='1';putMember(m);return 'open'}
  return unlocked===me?'open':'set'}
function vLock(){
  var m=mem(me),g=gate(),set=g==='set',dots='';
  if(g==='blocked')return '<div class="lock"><div class="lk-in"><img class="appic" src="icon-192.png" alt=""><p class="lk-hi">اسم <b>'+esc(m.name)+'</b> سبق اختياره من هاتف آخر</p><h2>لم يُنشأ رمزه بعد</h2><p class="lk-sub">إن كان هذا هاتفك أنت يا '+esc(m.name)+'، فاختر رمزاً سرياً من 4 أرقام. وإن كنت غيره فاختر اسمك.</p><button class="gbtn" data-act="claim">هذا هاتفي: اختر رمزي السري</button><button class="gbtn" data-act="me" data-v="">اختر اسماً آخر</button></div></div>';
  for(var i=0;i<4;i++)dots+='<i class="'+(i<pinBuf.length?'on':'')+'"></i>';
  var keys=[1,2,3,4,5,6,7,8,9,'',0,'del'].map(function(k){return k===''?'<span></span>':'<button class="pk" data-act="pk" data-v="'+k+'"'+(k==='del'?' aria-label="امسح"':'')+'>'+(k==='del'?'⌫':k)+'</button>'}).join('');
  var wait=pinWait>Date.now();
  return '<div class="lock"><div class="lk-in"><img class="appic" src="icon-192.png" alt=""><p class="lk-hi">السلام عليكم يا <b>'+esc(m.name)+'</b></p>'+
    '<h2>'+(set?(pinFirst?'أعد كتابة الرمز للتأكيد':(pinChange?'اختر رمزك الجديد':'اختر رمزك السري')):'اكتب رمزك السري')+'</h2>'+
    '<p class="lk-sub">'+(set?'هو نفسه في أذكار العائلة وختمة العائلة':'هو نفس رمزك في أذكار العائلة وختمة العائلة')+'</p>'+
    '<div class="lk-dots'+(pinErr?' bad':'')+'">'+dots+'</div><p class="lk-err" role="alert">'+esc(wait?'انتظر قليلاً ثم حاول من جديد':pinErr)+'</p>'+
    '<div class="lk-pad">'+keys+'</div>'+
    (pinChange?'<button class="lnk lk-sw" data-act="pinx">إلغاء</button>':'<button class="lnk lk-sw" data-act="me" data-v="">لستُ '+esc(m.name)+'؟ اختر اسمك</button>')+
    (!set?(mine.indexOf(m.id)>=0?'<button class="lnk lk-fg" data-act="pinchg">نسيتُ رمزي، أختار رمزاً جديداً</button>':'<p class="lk-fg">نسيتَ رمزك؟ غيّره من هاتفك أنت.</p>'):'')+
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
      pinHash(id,p).then(function(h){m.k=h;m.h='1';unlocked=id;pinFirst='';pinBuf='';pinChange=false;if(mine.indexOf(id)<0){mine.push(id);ls('tk_mine',JSON.stringify(mine))}putMember(m);cache();render()});return}
    pinHash(id,p).then(function(h){
      if(h===m.k){unlocked=id;pinFails=0;pinBuf='';render()}
      else{pinFails++;pinBuf='';pinErr='الرمز غير صحيح';if(pinFails>=5){pinFails=0;pinWait=Date.now()+30000;setTimeout(render,30100)}render()}})},120)}
document.addEventListener('visibilitychange',function(){
  if(document.hidden){hidAt=Date.now();return}
  pull();if(hidAt&&Date.now()-hidAt>10*60000&&unlocked){unlocked=null;pinBuf='';render()}});

/* ---------- dates ---------- */
var RM=[[-1,'بلا تذكير'],[0,'عند الموعد'],[15,'قبل 15 دقيقة'],[60,'قبل ساعة'],[1440,'قبل يوم']];
function dueMs(d,tm){if(!d)return 0;var p=d.split('-'),t=(tm||'09:00').split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1]).getTime()}
function dayLab(d){var t=iso(today());if(d===t)return 'اليوم';if(d===addDays(t,1))return 'غداً';if(d===addDays(t,-1))return 'أمس';
  var p=d.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('ar-u-nu-latn',{weekday:'long',day:'numeric',month:'long'})}
function ago(ms){var s=(Date.now()-ms)/1000;if(s<90)return 'الآن';if(s<3600)return 'منذ '+Math.round(s/60)+' د';if(s<86400)return 'منذ '+Math.round(s/3600)+' س';var n=Math.round(s/86400);return n===1?'أمس':'منذ '+n+' أيام'}
function tmLab(tm){if(!tm)return '';var p=tm.split(':'),h=+p[0];return (h%12||12)+':'+p[1]+(h<12?' ص':' م')}

/* ---------- lists ---------- */
function arr(o){return Object.keys(o||{}).map(function(k){var x=o[k]||{};x.id=k;return x})}
function tl(){return arr(D.tasks).filter(function(t){return t.t})}
function asg(t){return Object.keys(t.as||{})}
function forMe(t){var a=asg(t);return !a.length||a.indexOf(me)>=0}
function canDel(t){return !t.by||t.by===me||me===OWN}
function openCount(){return tl().filter(function(t){return !t.dn&&asg(t).indexOf(me)>=0}).length}

/* ---------- views ---------- */
function hdr(){return '<header class="top"><div class="brand"><img class="appic" src="icon-192.png" alt=""><div><h1>مهام العائلة</h1><p>'+esc(FN||'عائلتنا')+(mem(me)?' · '+esc(nm(me)):'')+'</p></div></div>'+
  '<div class="tb"><button class="ib fsb" data-act="big" aria-label="حجم الخط: المستوى '+(FL+1)+' من 4"><b>أ</b><span class="fsd">'+[0,1,2,3].map(function(i){return '<i'+(i<=FL?' class="on"':'')+'></i>'}).join('')+'</span></button>'+
  '<button class="ib" data-act="set" aria-label="الإعدادات">⚙️</button></div></header>'}
function vJoin(){
  return '<div class="wrap">'+hdr()+'<section class="card stack"><h2 class="ctitle">انضم إلى عائلتك</h2><p class="sub">«مهام العائلة» يعمل مع نفس مجموعة «ختمة العائلة» و«أذكار العائلة». افتح الرابط الذي أرسله لك أحد أهلك، أو الصقه هنا.</p>'+
    '<form class="form" data-form="join"><input id="joinIn" dir="ltr" autocomplete="off" placeholder="الرابط أو الرمز" aria-label="رابط العائلة أو رمزها"><button class="btn" type="submit">انضم</button></form><p class="sub err" id="joinErr"></p></section></div>'}
function vWho(){
  if(!loaded)return '<section class="card"><p class="sub">جارٍ التحميل…</p></section>';
  if(!M.length)return '<section class="card stack"><h2 class="ctitle">لم نجد أفراد العائلة</h2><p class="sub">تُضاف الأسماء من «ختمة العائلة». تأكّد من الرابط، أو اطلب من صاحب المجموعة إضافتك.</p><button class="btn ghost" data-act="leave">استعمل رابطاً آخر</button></section>';
  return '<section class="card stack"><h2 class="ctitle">من أنت؟</h2><p class="sub">اختر اسمك مرة واحدة، ويتذكّرك هاتفك بعدها.</p><div class="chips">'+vis().map(function(m){return '<button class="chip" data-act="me" data-v="'+m.id+'">'+esc(m.name)+'</button>'}).join('')+'</div></section>'}

function vShop(){
  var L=arr(D.shop),open=L.filter(function(x){return !x.b}).sort(function(a,b){return (a.c||0)-(b.c||0)}),got=L.filter(function(x){return x.b}).sort(function(a,b){return (b.bt||0)-(a.bt||0)});
  var row=function(x){return '<li class="it'+(x.b?' got':'')+'"><button class="ck" data-act="buy" data-v="'+x.id+'" aria-label="'+(x.b?'ألغِ الشراء':'تمّ الشراء')+'">'+(x.b?'✓':'')+'</button>'+
    '<div class="itx"><b>'+esc(x.n)+'</b><small>'+(x.b?'🛒 اشتراه '+esc(nm(x.b))+' · '+ago(x.bt||0):'أضافه '+esc(nm(x.by))+' · '+ago(x.c||0))+'</small>'+
    '<div class="acts"><button class="pill '+(x.b?'':'go')+'" data-act="buy" data-v="'+x.id+'">'+(x.b?'↩ لم يُشترَ':'✓ تمّ الشراء')+'</button>'+
    '<button class="pill" data-act="sedit" data-v="'+x.id+'">✏️ تعديل</button></div></div></li>'};
  return '<section class="card stack"><h2 class="ctitle">🛒 قائمة المشتريات</h2>'+
    '<form class="form" data-form="shop"><input id="shopIn" maxlength="60" autocomplete="off" placeholder="ماذا نشتري؟ مثلاً: 2 كغ طماطم" enterkeyhint="done"><button class="btn" type="submit">أضف</button></form>'+
    (open.length?'<ul class="ls">'+open.map(row).join('')+'</ul>':'<p class="empty">القائمة فارغة، الحمد لله 🌿</p>')+'</section>'+
    (got.length?'<section class="card stack"><div class="sh2"><h2 class="ctitle sm">اشتريناه ('+got.length+')</h2><button class="lnk" data-act="sclr">مسح المشترى</button></div><ul class="ls">'+got.map(row).join('')+'</ul></section>':'')}

function tCard(t){var a=asg(t),late=!t.dn&&t.at&&t.at<Date.now()&&(t.tm||t.d<iso(today()));
  return '<li class="tk'+(t.dn?' got':'')+(late?' late':'')+'"><button class="ck" data-act="done" data-v="'+t.id+'" aria-label="'+(t.dn?'لم تُنجز':'أُنجزت')+'">'+(t.dn?'✓':'')+'</button>'+
    '<div class="tkx"><b>'+esc(t.t)+'</b>'+
    '<span class="meta">'+(t.d?'<i>📅 '+esc(dayLab(t.d))+(t.tm?' · '+tmLab(t.tm):'')+'</i>':'')+(t.ra&&!t.dn?'<i>🔔</i>':'')+
    '<i>👥 '+(a.length?a.map(function(id){return esc(nm(id))}).join('، '):'الجميع')+'</i></span>'+
    (t.n?'<small class="nt">'+esc(t.n)+'</small>':'')+
    (t.dn?'<small>✓ أنجزها '+esc(nm(t.dn))+' · '+ago(t.dt||0)+'</small>':'')+
    '<div class="acts"><button class="pill '+(t.dn?'':'go')+'" data-act="done" data-v="'+t.id+'">'+(t.dn?'↩ لم تُنجز':'✓ أنجزتُها')+'</button>'+
    '<button class="pill" data-act="edit" data-v="'+t.id+'">✏️ تعديل</button></div></div></li>'}
function groups(L){var td=iso(today()),G=[['⏰ متأخرة',[]],['اليوم',[]],['غداً',[]],['القادمة',[]],['بلا تاريخ',[]]];
  L.forEach(function(t){var late=t.at&&t.at<Date.now()&&(t.tm||t.d<td);
    if(!t.d)G[4][1].push(t);else if(late)G[0][1].push(t);else if(t.d===td)G[1][1].push(t);else if(t.d===addDays(td,1))G[2][1].push(t);else G[3][1].push(t)});
  G.forEach(function(g){g[1].sort(function(a,b){return (a.at||a.c||0)-(b.at||b.c||0)})});
  return G.filter(function(g){return g[1].length}).map(function(g){return '<h3 class="gh">'+g[0]+' <small>'+g[1].length+'</small></h3><ul class="ls">'+g[1].map(tCard).join('')+'</ul>'}).join('')}
function vTasks(onlyMine){
  var L=tl().filter(function(t){return !onlyMine||forMe(t)}),open=L.filter(function(t){return !t.dn}),dn=L.filter(function(t){return t.dn}).sort(function(a,b){return (b.dt||0)-(a.dt||0)}).slice(0,30);
  var title=onlyMine?'🙋 مهامي':'📋 مهام ومواعيد العائلة';
  return '<section class="card stack"><div class="sh2"><h2 class="ctitle">'+title+'</h2></div>'+
    (onlyMine?'<p class="sub">ما أُسند إليك، وما هو للجميع.</p>':'')+
    (open.length?groups(open):'<p class="empty">'+(onlyMine?'لا مهام عليك الآن، بارك الله فيك 🌿':'لا مهام بعد. أضف أول مهمة أو موعد.')+'</p>')+'</section>'+
    (dn.length?'<section class="card stack"><div class="sh2"><h2 class="ctitle sm">المنجزة ('+dn.length+')</h2><button class="lnk" data-act="sdone">'+(showDone?'إخفاء':'عرض')+'</button></div>'+(showDone?'<ul class="ls">'+dn.map(tCard).join('')+'</ul>':'')+'</section>':'')}

function vSheet(){var t=draft,isNew=!t.id,a=t.as||{};
  return '<div class="ov" data-act="ovx"><form class="sht stack" data-form="task" role="dialog" aria-label="'+(isNew?'مهمة جديدة':'تعديل المهمة')+'">'+
    '<div class="sh2"><h2 class="ctitle">'+(isNew?'مهمة أو موعد جديد':'تعديل المهمة')+'</h2><button type="button" class="ib" data-act="close" aria-label="إغلاق">✕</button></div>'+
    '<label>العنوان<input id="fT" maxlength="80" required autocomplete="off" value="'+esc(t.t||'')+'" placeholder="مثلاً: موعد الطبيب، دفع فاتورة الكهرباء"></label>'+
    '<div class="two"><label>التاريخ<input id="fD" type="date" value="'+esc(t.d||'')+'"></label><label>الوقت<input id="fM" type="time" value="'+esc(t.tm||'')+'"></label></div>'+
    '<label>التذكير<select id="fR">'+RM.map(function(r){return '<option value="'+r[0]+'"'+((t.rm==null?-1:t.rm)===r[0]?' selected':'')+'>'+r[1]+'</option>'}).join('')+'</select></label>'+
    '<p class="sub hn">يصل التذكير إشعاراً لمن أُسندت إليهم المهمة (أو للجميع) إن فعّلوا التذكير، وقد يتأخر بضع دقائق. بلا وقت: يُحسب من الساعة 9 صباحاً.</p>'+
    '<div class="lb">لمن؟ <small>(بلا اختيار = الجميع)</small></div><div class="chips">'+vis().map(function(m){return '<button type="button" class="chip'+(a[m.id]?' on':'')+'" data-act="asg" data-v="'+m.id+'">'+esc(m.name)+'</button>'}).join('')+'</div>'+
    '<label>ملاحظة <small>(اختياري)</small><input id="fN" maxlength="200" autocomplete="off" value="'+esc(t.n||'')+'"></label>'+
    '<p class="err" id="fErr" role="alert"></p>'+
    '<button class="btn" type="submit">'+(isNew?'أضف':'احفظ')+'</button>'+
    (!isNew?'<div class="sh2">'+(t.by?'<small class="sub">أضافها '+esc(nm(t.by))+'</small>':'<span></span>')+(canDel(t)?'<button type="button" class="lnk dang" data-act="tdel">حذف المهمة</button>':'')+'</div>':'')+
    '</form></div>'}

function vShopSheet(){var x=draft;
  return '<div class="ov" data-act="ovx"><form class="sht stack" data-form="sedit" role="dialog" aria-label="تعديل الغرض"><div class="sh2"><h2 class="ctitle">تعديل الغرض</h2><button type="button" class="ib" data-act="close" aria-label="إغلاق">✕</button></div>'+
    '<label>الاسم والكمية<input id="sN" maxlength="60" required autocomplete="off" value="'+esc(x.n||'')+'"></label><button class="btn" type="submit">احفظ</button><div class="sh2"><span></span><button type="button" class="lnk dang" data-act="sdel" data-v="'+x.id+'">حذف الغرض من القائمة</button></div></form></div>'}
function vSet(){var m=mem(me);
  return '<div class="ov" data-act="ovx"><div class="sht stack" role="dialog" aria-label="الإعدادات"><div class="sh2"><h2 class="ctitle">⚙️ الإعدادات</h2><button class="ib" data-act="set" aria-label="إغلاق">✕</button></div>'+
    (pushOK()?(nOn?'<p class="ok">🔔 التذكير مُفعَّل على هذا الهاتف</p>':'<div class="stack"><button class="btn" data-act="notif"'+(nBusy?' disabled':'')+'>'+(nBusy?'جارٍ التفعيل…':'🔔 فعّل تذكير المواعيد')+'</button>'+(nErr?'<p class="err">'+esc(nErr)+'</p>':'')+'<p class="sub">على الآيفون: ثبّت التطبيق على الشاشة الرئيسية أولاً من زر المشاركة.</p></div>'):'<p class="sub">هذا المتصفح لا يدعم التنبيهات.</p>')+
    (m?'<button class="btn ghost" data-act="me" data-v="">👤 لستُ '+esc(m.name)+'؟ بدّل الاسم</button>':'')+
    (m&&(me===home||unlocked===me)?'<button class="btn ghost" data-act="pinchg">🔑 '+(m.k?'تغيير رمزي السري':'اختر رمزي السري')+'</button>':'')+
    '<button class="btn ghost" data-act="invite">🔗 أرسل رابط التطبيق للعائلة</button>'+
    '<p class="sub">أسماء العائلة هي نفسها في «ختمة العائلة»، ومنها تُضاف وتُعدَّل.</p>'+
    '<p class="sub">مجاني وبلا إعلانات. <a href="privacy.html">الخصوصية</a> · الإصدار '+ver()+'</p></div></div>'}
function ver(){return (document.querySelector('script[src*="app.js"]')||{src:''}).src.split('v=')[1]||''}
function nav(){var n=openCount();
  return '<nav class="bn">'+[['shop','🛒','المشتريات'],['tasks','📋','المهام'],['mine','🙋','مهامي']].map(function(x){
    var c=x[0]==='shop'?arr(D.shop).filter(function(s){return !s.b}).length:x[0]==='mine'?n:0;
    return '<button class="'+(TAB===x[0]?'on':'')+'" data-act="tab" data-v="'+x[0]+'"'+(TAB===x[0]?' aria-current="page"':'')+'><span>'+x[1]+(c?'<em>'+c+'</em>':'')+'</span>'+x[2]+'</button>'}).join('')+'</nav>'}

function render(){
  if(!code){root.innerHTML=vJoin();return}
  applyFs();
  if(gate()!=='open'){root.innerHTML=vLock();return}
  var m=mem(me),body;
  if(!m)body=vWho();
  else body=TAB==='shop'?vShop():TAB==='tasks'?vTasks(false):vTasks(true);
  root.innerHTML='<div class="wrap">'+hdr()+body+'</div>'+(m?nav()+(TAB!=='shop'?'<button class="fab" data-act="new" aria-label="مهمة جديدة">＋</button>':''):'')+
    (sheet==='task'&&draft?vSheet():'')+(sheet==='shop'&&draft?vShopSheet():'')+(setOpen?vSet():'')+(toast?'<div class="toast" role="status">'+esc(toast)+'</div>':'');
}

/* ---------- actions ---------- */
function shopAdd(){var i=document.getElementById('shopIn'),v=(i&&i.value||'').trim().slice(0,60);if(!v)return;
  var id=rid('s'),x={n:v,by:me||'',c:Date.now()};D.shop[id]=x;cache();wr('/tk/shop/'+id,'PUT',x);render();
  var j=document.getElementById('shopIn');if(j)j.focus()}
function readForm(){var t=draft;t.t=(document.getElementById('fT').value||'').trim().slice(0,80);t.d=document.getElementById('fD').value||'';t.tm=t.d?(document.getElementById('fM').value||''):'';
  t.rm=+document.getElementById('fR').value;t.n=(document.getElementById('fN').value||'').trim().slice(0,200)}
function saveTask(){readForm();var t=draft,e=document.getElementById('fErr');
  if(!t.t){e.textContent='اكتب عنوان المهمة';return}
  if(t.rm>=0&&!t.d){e.textContent='اختر تاريخاً ليصل التذكير';return}
  t.at=dueMs(t.d,t.tm);t.ra=t.rm>=0&&t.at?t.at-t.rm*60000:0;
  var isNew=!t.id,id=t.id||rid('t'),o={t:t.t,d:t.d,tm:t.tm,at:t.at,rm:t.rm,ra:t.ra,n:t.n,as:Object.keys(t.as||{}).length?t.as:null};
  if(isNew){o.by=me||'';o.c=Date.now();D.tasks[id]=o;wr('/tk/tasks/'+id,'PUT',o)}
  else{var cur=D.tasks[id]||{};for(var k in o)cur[k]=o[k];D.tasks[id]=cur;wr('/tk/tasks/'+id,'PATCH',o)}
  cache();sheet=null;draft=null;render()}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t)return;var a=t.dataset.act,v=t.dataset.v;
  if(a==='ovx'){if(e.target===t){sheet=null;draft=null;setOpen=false;render()}return}
  if(a==='tab'){TAB=v;ls('tk_tab',v);render();window.scrollTo(0,0);return}
  if(a==='big'){FL=(FL+1)%4;ls('tk_fs',String(FL));applyFs();render();return}
  if(a==='set'){setOpen=!setOpen;render();return}
  if(a==='notif'){enableNotif();return}
  if(a==='pk'){pinKey(v);return}
  if(a==='claim'){pinChange=true;pinBuf='';pinFirst='';pinErr='';render();return}
  if(a==='pinchg'){if(me===home||unlocked===me||mine.indexOf(me)>=0){setOpen=false;pinChange=true;pinBuf='';pinFirst='';pinErr='';render();window.scrollTo(0,0)}return}
  if(a==='pinx'){pinChange=false;pinBuf='';pinFirst='';pinErr='';render();return}
  if(a==='me'){pinBuf='';pinFirst='';pinErr='';pinChange=false;unlocked=null;setOpen=false;me=v||null;ls('tk_me',me);syncSubMember();render();window.scrollTo(0,0);return}
  if(a==='leave'){code='';ls('tk_code',null);me=null;ls('tk_me',null);render();return}
  if(a==='invite'){var u=location.origin+location.pathname.replace(/index\.html$/,'')+'#a='+code,txt='أحبتي، هذا تطبيق «مهام العائلة»: قائمة مشتريات مشتركة ومهام ومواعيد العائلة، بنفس أسمائنا في الختمة:\n'+u;
    if(navigator.share)navigator.share({title:'مهام العائلة',text:txt}).catch(function(){});else window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');return}
  if(a==='buy'){var s=D.shop[v];if(!s)return;if(s.b){s.b=null;s.bt=null;wr('/tk/shop/'+v,'PATCH',{b:null,bt:null})}else{s.b=me;s.bt=Date.now();wr('/tk/shop/'+v,'PATCH',{b:me,bt:s.bt});try{navigator.vibrate&&navigator.vibrate(12)}catch(x){}}cache();render();return}
  if(a==='sedit'){var se=D.shop[v];if(!se)return;draft={id:v,n:se.n};sheet='shop';render();var si=document.getElementById('sN');if(si){si.focus();si.select()}return}
  if(a==='sdel'){var s2=D.shop[v];if(!s2)return;if(!s2.b&&!confirm('حذف «'+s2.n+'» من القائمة؟'))return;delete D.shop[v];wr('/tk/shop/'+v,'DELETE');cache();sheet=null;draft=null;render();return}
  if(a==='sclr'){var g=arr(D.shop).filter(function(x){return x.b});if(!g.length||!confirm('مسح '+g.length+' من المشترى؟'))return;var p={};g.forEach(function(x){p[x.id]=null;delete D.shop[x.id]});wr('/tk/shop','PATCH',p);cache();render();return}
  if(a==='done'){var k=D.tasks[v];if(!k)return;if(k.dn){k.dn=null;k.dt=null;wr('/tk/tasks/'+v,'PATCH',{dn:null,dt:null})}else{k.dn=me;k.dt=Date.now();wr('/tk/tasks/'+v,'PATCH',{dn:me,dt:k.dt});try{navigator.vibrate&&navigator.vibrate([20,40,30])}catch(x){}}cache();render();return}
  if(a==='sdone'){showDone=!showDone;render();return}
  if(a==='new'){var as={};if(TAB==='mine'&&me)as[me]=1;draft={t:'',d:'',tm:'',rm:-1,n:'',as:as};sheet='task';render();var f=document.getElementById('fT');if(f)f.focus();return}
  if(a==='edit'){var k2=D.tasks[v];if(!k2)return;draft=JSON.parse(JSON.stringify(k2));draft.id=v;draft.as=draft.as||{};sheet='task';render();return}
  if(a==='asg'){readForm();if(draft.as[v])delete draft.as[v];else draft.as[v]=1;t.classList.toggle('on',!!draft.as[v]);return}
  if(a==='close'){sheet=null;draft=null;render();if(dirty){dirty=false;render()}return}
  if(a==='tdel'){if(!draft||!draft.id||!canDel(draft))return;if(!confirm('حذف «'+draft.t+'»؟'))return;delete D.tasks[draft.id];wr('/tk/tasks/'+draft.id,'DELETE');cache();sheet=null;draft=null;render();return}
});
document.addEventListener('submit',function(e){
  var f=e.target.dataset.form;if(!f)return;e.preventDefault();
  if(f==='shop'){shopAdd();return}
  if(f==='task'){saveTask();return}
  if(f==='sedit'){var nv=(document.getElementById('sN').value||'').trim().slice(0,60),it=D.shop[draft.id];if(nv&&it){it.n=nv;wr('/tk/shop/'+draft.id,'PATCH',{n:nv});cache()}sheet=null;draft=null;render();return}
  if(f==='join'){var s=(document.getElementById('joinIn').value||'').trim(),m=s.match(/[#&]a=([A-Za-z0-9_-]{12,64})/)||s.match(/^([A-Za-z0-9_-]{12,64})$/);
    if(!m){document.getElementById('joinErr').textContent='الرابط أو الرمز غير صحيح';return}
    code=m[1];ls('tk_code',code);M=[];D={shop:{},tasks:{}};loaded=false;inherit('kf');inherit('ad');render();pull();return}
});
render();pull();
if('serviceWorker' in navigator){var hadCtl=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadCtl&&!window.__rl){window.__rl=1;location.reload()}});
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){try{r.update()}catch(e){}}).catch(function(){})}
