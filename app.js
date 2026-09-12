const DEFAULT_PRODUCTS = [
  {id:'sample-1',name:'Moringa Powder',price:120,mrp:250,weight:'100 g',category:'Wellness',stock:20,description:'A sample catalog item. Replace it with your own product from the Admin Panel.',image:'assets/logo.png',active:true},
  {id:'sample-2',name:'Moringa Herbal Soap',price:30,mrp:40,weight:'100 g',category:'Soaps',stock:30,description:'A sample soap item for your new catalog.',image:'assets/logo.png',active:true},
  {id:'sample-3',name:'Banana Chips',price:90,mrp:110,weight:'250 g',category:'Foods',stock:18,description:'A sample snack item. Add your own photo and details.',image:'assets/logo.png',active:true},
  {id:'sample-4',name:'Neem Herbal Soap',price:30,mrp:40,weight:'100 g',category:'Soaps',stock:25,description:'A sample herbal soap listing.',image:'assets/logo.png',active:true}
];

function getProducts(){
  const saved=localStorage.getItem('nt_products');
  if(saved){try{return JSON.parse(saved)}catch(e){}}
  localStorage.setItem('nt_products',JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}
function currency(n){return `₹${Number(n||0).toLocaleString('en-IN')}`}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2300)}
function waUrl(product){const text=`Hello Nature Touch Products, I want to order:\n${product.name}\nPrice: ${currency(product.price)}\nWeight: ${product.weight||''}`;return `https://wa.me/919579901536?text=${encodeURIComponent(text)}`}
function renderProducts(){
  const grid=document.getElementById('productGrid'); if(!grid)return;
  const search=(document.getElementById('searchInput')?.value||'').trim().toLowerCase();
  const cat=document.getElementById('categoryFilter')?.value||'all';
  const products=getProducts().filter(p=>p.active!==false && (cat==='all'||p.category===cat) && (!search||`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(search)));
  grid.innerHTML=products.length?products.map(p=>`<article class="product-card">
    <div class="product-image"><img src="${esc(p.image||'assets/logo.png')}" alt="${esc(p.name)}" /></div>
    <div class="product-body"><span class="pill">${esc(p.category||'Product')}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p>
      <div class="price-row"><span class="price">${currency(p.price)}</span>${p.mrp?`<span class="mrp">${currency(p.mrp)}</span>`:''}</div>
      <div class="stock">${Number(p.stock||0)>0?'In stock':'Out of stock'}${p.weight?` • ${esc(p.weight)}`:''}</div>
      <div class="product-actions"><a class="mini-btn buy" href="${waUrl(p)}" target="_blank" rel="noreferrer">WhatsApp Order</a></div>
    </div></article>`).join(''):'<div class="empty">No products found. Add products from the Admin Panel.</div>';
}
function updateCategories(){
  const select=document.getElementById('categoryFilter');if(!select)return;
  const current=select.value;const cats=[...new Set(getProducts().map(p=>p.category).filter(Boolean))].sort();
  select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  select.value=cats.includes(current)?current:'all';
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('year').textContent=new Date().getFullYear();
  updateCategories(); renderProducts();
  document.getElementById('searchInput')?.addEventListener('input',renderProducts);
  document.getElementById('categoryFilter')?.addEventListener('change',renderProducts);
});
