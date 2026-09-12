const ADMIN_PASSWORD='NatureTouch123';
const STORE_KEY='nt_products';
const defaultProducts=[
{id:'sample-1',name:'Moringa Powder',price:120,mrp:250,weight:'100 g',category:'Wellness',stock:20,description:'A sample catalog item. Replace it with your own product.',image:'assets/logo.png',active:true},
{id:'sample-2',name:'Moringa Herbal Soap',price:30,mrp:40,weight:'100 g',category:'Soaps',stock:30,description:'A sample soap item.',image:'assets/logo.png',active:true},
{id:'sample-3',name:'Banana Chips',price:90,mrp:110,weight:'250 g',category:'Foods',stock:18,description:'A sample snack item.',image:'assets/logo.png',active:true},
{id:'sample-4',name:'Neem Herbal Soap',price:30,mrp:40,weight:'100 g',category:'Soaps',stock:25,description:'A sample herbal soap listing.',image:'assets/logo.png',active:true}
];
function products(){const s=localStorage.getItem(STORE_KEY);if(s){try{return JSON.parse(s)}catch(e){}} localStorage.setItem(STORE_KEY,JSON.stringify(defaultProducts));return [...defaultProducts]}
function save(all){localStorage.setItem(STORE_KEY,JSON.stringify(all))}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function currency(n){return `₹${Number(n||0).toLocaleString('en-IN')}`}
const $=id=>document.getElementById(id);
function refreshStats(){const ps=products();$('totalProducts').textContent=ps.length;$('totalCategories').textContent=new Set(ps.map(p=>p.category).filter(Boolean)).size;$('inStock').textContent=ps.filter(p=>Number(p.stock)>0).length;$('outStock').textContent=ps.filter(p=>Number(p.stock)<=0).length}
function renderList(){const q=($('adminSearch').value||'').trim().toLowerCase();const ps=products().filter(p=>`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q));$('adminList').innerHTML=ps.length?ps.map(p=>`<div class="admin-item"><img src="${esc(p.image||'assets/logo.png')}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p>${currency(p.price)} ${p.mrp?`• MRP ${currency(p.mrp)}`:''} • ${esc(p.weight||'')} • ${esc(p.category||'') } • ${Number(p.stock)>0?'In stock':'Out of stock'}</p></div><div class="admin-actions"><button class="small-btn" data-edit="${esc(p.id)}">Edit</button><button class="small-btn delete" data-delete="${esc(p.id)}">Delete</button></div></div>`).join(''):'<div class="empty">No matching products.</div>'}
function clearForm(){$('productId').value='';$('name').value='';$('price').value='';$('mrp').value='';$('weight').value='';$('category').value='';$('stock').value='0';$('image').value='assets/logo.png';$('description').value='';$('active').checked=true;$('formTitle').textContent='Add Product'}
function fillForm(p){$('productId').value=p.id;$('name').value=p.name;$('price').value=p.price;$('mrp').value=p.mrp||'';$('weight').value=p.weight||'';$('category').value=p.category||'';$('stock').value=p.stock??0;$('image').value=p.image||'';$('description').value=p.description||'';$('active').checked=p.active!==false;$('formTitle').textContent='Edit Product';window.scrollTo({top:0,behavior:'smooth'})}
function readForm(forceNew=false){return {id:forceNew?crypto.randomUUID():($('productId').value||crypto.randomUUID()),name:$('name').value.trim(),price:Number($('price').value||0),mrp:Number($('mrp').value||0),weight:$('weight').value.trim(),category:$('category').value.trim(),stock:Number($('stock').value||0),image:$('image').value.trim()||'assets/logo.png',description:$('description').value.trim(),active:$('active').checked}}
function submitProduct(e,forceNew=false){e?.preventDefault();const p=readForm(forceNew);if(!p.name){toast('Enter a product name');return}const all=products();if(forceNew||!$('productId').value){all.unshift(p)}else{const i=all.findIndex(x=>x.id==p.id);if(i>-1)all[i]=p;else all.unshift(p)}save(all);clearForm();renderList();refreshStats();toast('Product saved')}
function login(){if($('passwordInput').value===ADMIN_PASSWORD){sessionStorage.setItem('nt_admin','1');showApp()}else toast('Wrong password')}
function showApp(){$('loginView').classList.add('hidden');$('appView').classList.remove('hidden');renderList();refreshStats();}
function logout(){sessionStorage.removeItem('nt_admin');location.reload()}
document.addEventListener('DOMContentLoaded',()=>{
  if(sessionStorage.getItem('nt_admin')==='1')showApp();
  $('loginBtn').addEventListener('click',login);$('passwordInput').addEventListener('keydown',e=>{if(e.key==='Enter')login()});$('logoutBtn').addEventListener('click',logout);$('resetBtn').addEventListener('click',clearForm);$('duplicateBtn').addEventListener('click',()=>submitProduct(null,true));$('productForm').addEventListener('submit',e=>submitProduct(e,false));$('adminSearch').addEventListener('input',renderList);
  $('adminList').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]');const del=e.target.closest('[data-delete]');if(edit){const p=products().find(x=>x.id===edit.dataset.edit);if(p)fillForm(p)}if(del){const p=products().find(x=>x.id===del.dataset.delete);if(p&&confirm(`Delete ${p.name}?`)){save(products().filter(x=>x.id!==p.id));renderList();refreshStats();toast('Product deleted')}}});
});
