const KEY='moneybeta_app_v1';
const today=()=>new Date().toISOString().slice(0,10);
let editId=null,filter='all';
const base={records:[],assets:{personal:{cash:0,bank:0,linePay:0,jkoPay:0,creditCard:0},shared:{cash:0,bank:0,linePay:0,jkoPay:0,creditCard:0}}};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(base);
const $=id=>document.getElementById(id);
const fmt=n=>'$'+Number(n||0).toLocaleString();
const assetNames={cash:'現金',bank:'銀行',linePay:'LINE Pay',jkoPay:'街口',creditCard:'信用卡'};
const icons={'餐飲':'🍜','飲料':'🥤','房租':'🏠','毛孩':'🐶','薪水':'💰','交通':'🚗','購物':'🛍️','醫療':'💊','娛樂':'🎮'};
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function txSign(r){return r.type==='income'?r.amount:-r.amount}
function resetForm(){editId=null;$('amount').value='';$('category').value='';$('note').value='';$('date').value=today();$('cancelEditBtn').classList.add('hide');$('saveBtn').textContent='儲存'}
function addOrUpdate(){
 const amount=Number($('amount').value);
 if(!amount){alert('請輸入金額');return}
 const r={id:editId||String(Date.now()),date:$('date').value||today(),type:$('type').value,account:$('account').value,amount,category:$('category').value||'未分類',asset:$('asset').value,note:$('note').value,advanceBy:$('account').value==='shared'?$('advanceBy').value:''};
 if(editId){const old=db.records.find(x=>x.id===editId);if(old) applyAsset(old,true);db.records=db.records.map(x=>x.id===editId?r:x)}
 else db.records.unshift(r);
 applyAsset(r,false);resetForm();save();nav('homePage')
}
function applyAsset(r,reverse){
 if(!db.assets[r.account]) db.assets[r.account]={};
 if(db.assets[r.account][r.asset]===undefined) db.assets[r.account][r.asset]=0;
 const v=txSign(r)*(reverse?-1:1);
 db.assets[r.account][r.asset]+=v;
}
function editRecord(id){
 const r=db.records.find(x=>x.id===id); if(!r)return;
 editId=id;$('amount').value=r.amount;$('type').value=r.type;$('account').value=r.account;$('category').value=r.category;$('asset').value=r.asset;$('date').value=r.date;$('note').value=r.note;$('advanceBy').value=r.advanceBy||'';$('cancelEditBtn').classList.remove('hide');$('saveBtn').textContent='更新';nav('addPage');
}
function deleteRecord(id){
 const r=db.records.find(x=>x.id===id); if(!r||!confirm('確定刪除這筆？'))return;
 applyAsset(r,true);db.records=db.records.filter(x=>x.id!==id);save();
}
function totals(account){return Object.values(db.assets[account]||{}).reduce((a,b)=>a+Number(b||0),0)}
function monthRecords(){const ym=today().slice(0,7);return db.records.filter(r=>r.date.slice(0,7)===ym)}
function renderDashboard(){
 $('personalTotal').textContent=fmt(totals('personal'));$('sharedTotal').textContent=fmt(totals('shared'));
 let inc=0,exp=0;monthRecords().forEach(r=>r.type==='income'?inc+=r.amount:exp+=r.amount);
 $('monthIncome').textContent=fmt(inc);$('monthExpense').textContent=fmt(exp);$('monthBalance').textContent=fmt(inc-exp);
 renderList($('recentList'),db.records.slice(0,5),false);
}
function renderRecords(){
 const q=($('search').value||'').toLowerCase();
 let list=db.records.filter(r=>(filter==='all'||r.account===filter)&&JSON.stringify(r).toLowerCase().includes(q));
 renderList($('recordList'),list,true);
}
function renderList(el,list,actions){
 el.innerHTML=list.length?'':'<p class="hint">目前沒有資料</p>';
 list.forEach(r=>{
  const div=document.createElement('div');div.className='item';
  div.innerHTML=`<div class="left"><div class="icon">${icons[r.category]||'📒'}</div><div><div class="title">${r.category}</div><div class="sub">${r.account==='personal'?'👤 個人':'❤️ 共用'}｜${assetNames[r.asset]||r.asset}｜${r.date}${r.note?'｜'+r.note:''}${r.advanceBy?'｜代墊 '+r.advanceBy:''}</div></div></div><div><div class="amount ${r.type==='income'?'income':'expense'}">${r.type==='income'?'+':'-'}${fmt(r.amount)}</div>${actions?`<div class="actions"><button class="edit" data-edit="${r.id}">編輯</button><button class="delete" data-del="${r.id}">刪除</button></div>`:''}</div>`;
  el.appendChild(div);
 });
}
function renderAssets(){
 let html='';
 ['personal','shared'].forEach(owner=>{
  html+=`<h2>${owner==='personal'?'👤 個人':'❤️ 共用'}</h2>`;
  Object.entries(db.assets[owner]).forEach(([k,v])=>html+=`<div class="item"><div class="left"><div class="icon">💳</div><div><div class="title">${assetNames[k]||k}</div><div class="sub">${owner==='personal'?'個人資產':'共用資產'}</div></div></div><div class="amount">${fmt(v)}</div></div>`);
 });
 $('assetList').innerHTML=html;
}
function renderShared(){
 let inc=0,exp=0,hui=0,kai=0;
 db.records.filter(r=>r.account==='shared').forEach(r=>{if(r.type==='income')inc+=r.amount;else{exp+=r.amount;if(r.advanceBy==='慧慈')hui+=r.amount;if(r.advanceBy==='仲凱')kai+=r.amount}});
 $('sharedIncome').textContent=fmt(inc);$('sharedExpense').textContent=fmt(exp);$('sharedBalance').textContent=fmt(inc-exp);$('huiAdvance').textContent=fmt(hui);$('kaiAdvance').textContent=fmt(kai);
 const diff=hui-kai;$('settlementText').innerHTML=diff===0?'目前不需要結算':diff>0?`仲凱應補給慧慈 <b>${fmt(diff)}</b>`:`慧慈應補給仲凱 <b>${fmt(Math.abs(diff))}</b>`;
}
function renderAll(){renderDashboard();renderRecords();renderAssets();renderShared()}
function nav(id){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');
 document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===id));
 renderAll();
}
document.addEventListener('click',e=>{
 const navBtn=e.target.closest('[data-nav]'); if(navBtn) nav(navBtn.dataset.nav);
 const tpl=e.target.closest('[data-template]'); if(tpl){const [note,cat,type,acc]=tpl.dataset.template.split('|');$('note').value=note;$('category').value=cat;$('type').value=type;$('account').value=acc;nav('addPage');$('amount').focus()}
 const ed=e.target.closest('[data-edit]'); if(ed) editRecord(ed.dataset.edit);
 const del=e.target.closest('[data-del]'); if(del) deleteRecord(del.dataset.del);
});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderRecords()}));
$('saveBtn').addEventListener('click',addOrUpdate);$('cancelEditBtn').addEventListener('click',resetForm);$('search').addEventListener('input',renderRecords);
$('backupBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='小金庫備份.json';a.click()});
$('date').value=today();renderAll();
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
