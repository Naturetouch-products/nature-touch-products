const DEFAULT_PRODUCTS = [
  {
    id: "sample-1",
    name: "Moringa Powder",
    price: 120,
    mrp: 250,
    weight: "100 g",
    category: "Wellness",
    stock: 20,
    description: "Moringa powder from Nature Touch Products.",
    image: "assets/logo.png",
    active: true
  },
  {
    id: "sample-2",
    name: "Moringa Herbal Soap",
    price: 30,
    mrp: 40,
    weight: "100 g",
    category: "Soaps",
    stock: 30,
    description: "Moringa herbal soap.",
    image: "assets/logo.png",
    active: true
  },
  {
    id: "sample-3",
    name: "Banana Chips",
    price: 90,
    mrp: 110,
    weight: "250 g",
    category: "Foods",
    stock: 18,
    description: "Crispy banana chips.",
    image: "assets/logo.png",
    active: true
  }
];

const firebaseConfig = {
  apiKey: "AIzaSyAHGFmf2Uie08etFM5jq_-_UL091kbn4wQ",
  authDomain: "nature-touch-products-2e501.firebaseapp.com",
  projectId: "nature-touch-products-2e501",
  storageBucket: "nature-touch-products-2e501.firebasestorage.app",
  messagingSenderId: "237809167619",
  appId: "1:237809167619:web:6b3378c1298e8a8d2a4d36"
};

let db = null;

async function connectFirebase() {
  try {
    const { initializeApp } =
      await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js");

    const { getFirestore, collection, getDocs } =
      await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    db = {
      firestore: getFirestore(app),
      collection,
      getDocs
    };

    return true;
  } catch (error) {
    console.error("Firebase connection failed:", error);
    return false;
  }
}

async function getProducts() {
  if (!db) {
    await connectFirebase();
  }

  try {
    const snapshot = await db.getDocs(
      db.collection(db.firestore, "products")
    );

    if (!snapshot.empty) {
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(product => product.active !== false);
    }
  } catch (error) {
    console.error("Could not load products from Firestore:", error);
  }

  return DEFAULT_PRODUCTS;
}

function currency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[character]));
}

function waUrl(product) {
  const text =
    `Hello Nature Touch Products, I want to order:\n` +
    `${product.name}\n` +
    `Price: ${currency(product.price)}\n` +
    `Weight: ${product.weight || ""}`;

  return `https://wa.me/919579901536?text=${encodeURIComponent(text)}`;
}

async function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const search =
    (document.getElementById("searchInput")?.value || "")
      .trim()
      .toLowerCase();

  const category =
    document.getElementById("categoryFilter")?.value || "all";

  const allProducts = await getProducts();

  const products = allProducts.filter(product => {
    const matchesCategory =
      category === "all" || product.category === category;

    const text =
      `${product.name || ""} ${product.description || ""} ${product.category || ""}`
        .toLowerCase();

    const matchesSearch = !search || text.includes(search);

    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = products.length
    ? products.map(product => `
      <article class="product-card">
       <div class="product-image">
  <img
    src="${esc(
      (product.images && product.images.length
        ? product.images[0]
        : product.image) || "assets/logo.png"
    )}"
    alt="${esc(product.name)}"
  >
</div>

        <div class="product-body">
          <span class="pill">${esc(product.category || "Product")}</span>

          <h3>${esc(product.name)}</h3>

          <p>${esc(product.description || "")}</p>

          <div class="price-row">
            <span class="price">${currency(product.price)}</span>
            ${
              product.mrp
                ? `<span class="mrp">${currency(product.mrp)}</span>`
                : ""
            }
          </div>

          <div class="stock">
            ${
              Number(product.stock || 0) > 0
                ? "In stock"
                : "Out of stock"
            }
            ${
              product.weight
                ? ` • ${esc(product.weight)}`
                : ""
            }
          </div>

          <div class="product-actions">
            <a
              class="mini-btn buy"
              href="${waUrl(product)}"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Order
            </a>
          </div>
        </div>
      </article>
    `).join("")
    : `<div class="empty">No products found.</div>`;
}

async function updateCategories() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const products = await getProducts();

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ].sort();

  select.innerHTML =
    `<option value="all">All categories</option>` +
    categories
      .map(category =>
        `<option value="${esc(category)}">${esc(category)}</option>`
      )
      .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  await updateCategories();
  await renderProducts();

  document
    .getElementById("searchInput")
    ?.addEventListener("input", renderProducts);

  document
    .getElementById("categoryFilter")
    ?.addEventListener("change", renderProducts);
});
