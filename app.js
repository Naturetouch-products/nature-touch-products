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
    images: ["assets/logo.png"],
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
    images: ["assets/logo.png"],
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
    images: ["assets/logo.png"],
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
let allProductsCache = [];
let currentProduct = null;
let currentImageIndex = 0;
let currentQuantity = 1;


/* =========================================================
   FIREBASE
========================================================= */

async function connectFirebase() {
  try {
    const { initializeApp } =
      await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js");

    const {
      getFirestore,
      collection,
      getDocs
    } =
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


/* =========================================================
   GET PRODUCTS
========================================================= */

async function getProducts() {
  if (!db) {
    const connected = await connectFirebase();

    if (!connected) {
      return DEFAULT_PRODUCTS;
    }
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


/* =========================================================
   HELPERS
========================================================= */

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


/*
  Supports:
  images: ["photo1.jpg", "photo2.jpg"]
  images: ["url1", "url2"]
  image: "photo.jpg"
*/

function getProductImages(product) {
  let images = [];

  if (Array.isArray(product.images)) {
    images = product.images.filter(Boolean);
  }

  if (!images.length && typeof product.images === "string") {
    images = [product.images];
  }

  if (!images.length && product.image) {
    images = [product.image];
  }

  if (!images.length) {
    images = ["assets/logo.png"];
  }

  return [...new Set(images)];
}


function waUrl(product, quantity = 1) {
  const text =
    `Hello Nature Touch Products, I want to order:\n\n` +
    `Product: ${product.name}\n` +
    `Price: ${currency(product.price)}\n` +
    `Weight: ${product.weight || ""}\n` +
    `Quantity: ${quantity}\n` +
    `Total: ${currency(Number(product.price || 0) * quantity)}`;

  return `https://wa.me/919579901536?text=${encodeURIComponent(text)}`;
}


/* =========================================================
   PRODUCT DETAILS CSS
   Automatically added by JavaScript
========================================================= */

function addProductDetailsStyles() {
  if (document.getElementById("nt-product-details-styles")) return;

  const style = document.createElement("style");

  style.id = "nt-product-details-styles";

  style.textContent = `
    .product-card {
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .product-card:hover {
      transform: translateY(-4px);
    }

    .nt-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.65);
      z-index: 99999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-y: auto;
    }

    .nt-modal.show {
      display: flex;
    }

    .nt-modal-box {
      width: min(1100px, 100%);
      max-height: 94vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 22px;
      position: relative;
      box-shadow: 0 25px 80px rgba(0,0,0,.25);
      padding: 28px;
    }

    .nt-close {
      position: absolute;
      right: 18px;
      top: 14px;
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 50%;
      background: #f1f5f1;
      color: #16331b;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      z-index: 5;
    }

    .nt-product-details {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
      gap: 38px;
      padding-top: 15px;
    }

    .nt-gallery {
      min-width: 0;
    }

    .nt-main-image-wrap {
      width: 100%;
      aspect-ratio: 1 / 1;
      background: #f7faf7;
      border-radius: 18px;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nt-main-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .nt-gallery-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 50%;
      background: rgba(255,255,255,.92);
      box-shadow: 0 4px 15px rgba(0,0,0,.15);
      font-size: 25px;
      cursor: pointer;
      z-index: 2;
    }

    .nt-gallery-prev {
      left: 12px;
    }

    .nt-gallery-next {
      right: 12px;
    }

    .nt-thumbnails {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 12px 2px 4px;
    }

    .nt-thumb {
      flex: 0 0 76px;
      width: 76px;
      height: 76px;
      border: 2px solid #dce7dd;
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
      padding: 0;
      cursor: pointer;
    }

    .nt-thumb.active {
      border-color: #1f8c2d;
      box-shadow: 0 0 0 2px rgba(31,140,45,.12);
    }

    .nt-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .nt-info {
      padding: 8px 5px 20px;
    }

    .nt-category {
      display: inline-block;
      background: #edf7ee;
      color: #0e641d;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .nt-info h2 {
      margin: 0 0 12px;
      font-size: clamp(26px, 4vw, 38px);
      line-height: 1.15;
      color: #16331b;
    }

    .nt-description {
      color: #607064;
      line-height: 1.7;
      margin: 0 0 20px;
    }

    .nt-price-box {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin: 15px 0;
    }

    .nt-price {
      font-size: 30px;
      font-weight: 800;
      color: #0e641d;
    }

    .nt-mrp {
      color: #8a938b;
      text-decoration: line-through;
      font-size: 17px;
    }

    .nt-save {
      color: #0e641d;
      background: #edf7ee;
      padding: 5px 9px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 700;
    }

    .nt-info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
    }

    .nt-info-table tr {
      border-bottom: 1px solid #edf0ed;
    }

    .nt-info-table td {
      padding: 12px 4px;
    }

    .nt-info-table td:first-child {
      color: #68756b;
      width: 38%;
    }

    .nt-info-table td:last-child {
      font-weight: 700;
      color: #16331b;
    }

    .nt-stock-in {
      color: #15803d !important;
    }

    .nt-stock-out {
      color: #dc2626 !important;
    }

    .nt-buy-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 22px;
      flex-wrap: wrap;
    }

    .nt-quantity {
      display: flex;
      align-items: center;
      border: 1px solid #dce7dd;
      border-radius: 10px;
      overflow: hidden;
      height: 48px;
    }

    .nt-quantity button {
      width: 45px;
      height: 48px;
      border: 0;
      background: #f6f9f6;
      font-size: 22px;
      cursor: pointer;
    }

    .nt-quantity span {
      min-width: 45px;
      text-align: center;
      font-weight: 700;
    }

    .nt-whatsapp {
      flex: 1;
      min-width: 190px;
      height: 48px;
      border: 0;
      border-radius: 10px;
      background: #159447;
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      cursor: pointer;
      transition: background .2s ease;
    }

    .nt-whatsapp:hover {
      background: #0f7d3b;
    }

    .nt-out-btn {
      background: #9ca3af !important;
      cursor: not-allowed;
      pointer-events: none;
    }

    .nt-total {
      margin-top: 15px;
      font-size: 16px;
      color: #607064;
    }

    .nt-total strong {
      color: #16331b;
      font-size: 20px;
    }

    @media (max-width: 800px) {
      .nt-modal {
        padding: 8px;
        align-items: flex-start;
      }

      .nt-modal-box {
        margin-top: 10px;
        padding: 18px;
        border-radius: 16px;
        max-height: 97vh;
      }

      .nt-product-details {
        grid-template-columns: 1fr;
        gap: 18px;
      }

      .nt-info {
        padding-bottom: 10px;
      }

      .nt-main-image-wrap {
        aspect-ratio: 1 / 1;
      }

      .nt-buy-row {
        align-items: stretch;
      }

      .nt-quantity {
        flex-shrink: 0;
      }
    }

    @media (max-width: 480px) {
      .nt-modal-box {
        padding: 14px;
      }

      .nt-close {
        width: 36px;
        height: 36px;
        font-size: 23px;
      }

      .nt-thumb {
        width: 62px;
        height: 62px;
        flex-basis: 62px;
      }

      .nt-price {
        font-size: 26px;
      }

      .nt-whatsapp {
        min-width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =========================================================
   PRODUCT DETAILS MODAL
========================================================= */

function createProductModal() {
  if (document.getElementById("ntProductModal")) return;

  const modal = document.createElement("div");

  modal.id = "ntProductModal";
  modal.className = "nt-modal";

  modal.innerHTML = `
    <div class="nt-modal-box" role="dialog" aria-modal="true">

      <button
        class="nt-close"
        id="ntCloseModal"
        aria-label="Close product details"
      >
        ×
      </button>

      <div class="nt-product-details">

        <div class="nt-gallery">

          <div class="nt-main-image-wrap">

            <img
              id="ntMainProductImage"
              class="nt-main-image"
              src=""
              alt=""
            >

            <button
              id="ntPrevImage"
              class="nt-gallery-arrow nt-gallery-prev"
              aria-label="Previous image"
            >
              ‹
            </button>

            <button
              id="ntNextImage"
              class="nt-gallery-arrow nt-gallery-next"
              aria-label="Next image"
            >
              ›
            </button>

          </div>

          <div id="ntThumbnails" class="nt-thumbnails"></div>

        </div>


        <div class="nt-info">

          <span id="ntProductCategory" class="nt-category">
            Product
          </span>

          <h2 id="ntProductName"></h2>

          <p id="ntProductDescription" class="nt-description"></p>

          <div class="nt-price-box">

            <span id="ntProductPrice" class="nt-price">
              ₹0
            </span>

            <span id="ntProductMrp" class="nt-mrp"></span>

            <span id="ntProductSave" class="nt-save"></span>

          </div>


          <table class="nt-info-table">

            <tr>
              <td>Weight</td>
              <td id="ntProductWeight">-</td>
            </tr>

            <tr>
              <td>Availability</td>
              <td id="ntProductStock">-</td>
            </tr>

            <tr>
              <td>Category</td>
              <td id="ntProductCategoryTable">-</td>
            </tr>

          </table>


          <div class="nt-buy-row">

            <div class="nt-quantity">

              <button
                id="ntMinus"
                type="button"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span id="ntQuantity">1</span>

              <button
                id="ntPlus"
                type="button"
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>

            <a
              id="ntWhatsAppOrder"
              class="nt-whatsapp"
              href="#"
              target="_blank"
              rel="noreferrer"
            >
              Order on WhatsApp
            </a>

          </div>


          <div class="nt-total">
            Total:
            <strong id="ntTotalPrice">₹0</strong>
          </div>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  /* Close button */

  document
    .getElementById("ntCloseModal")
    .addEventListener("click", closeProductModal);


  /* Click outside */

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeProductModal();
    }
  });


  /* Previous image */

  document
    .getElementById("ntPrevImage")
    .addEventListener("click", event => {
      event.stopPropagation();
      changeProductImage(-1);
    });


  /* Next image */

  document
    .getElementById("ntNextImage")
    .addEventListener("click", event => {
      event.stopPropagation();
      changeProductImage(1);
    });


  /* Quantity minus */

  document
    .getElementById("ntMinus")
    .addEventListener("click", event => {
      event.stopPropagation();

      if (currentQuantity > 1) {
        currentQuantity--;
        updateQuantityUI();
      }
    });


  /* Quantity plus */

  document
    .getElementById("ntPlus")
    .addEventListener("click", event => {
      event.stopPropagation();

      const stock = Number(currentProduct?.stock || 0);

      if (stock > 0 && currentQuantity < stock) {
        currentQuantity++;
        updateQuantityUI();
      }
    });


  /* Keyboard */

  document.addEventListener("keydown", event => {

    const modalOpen =
      document
        .getElementById("ntProductModal")
        ?.classList.contains("show");

    if (!modalOpen) return;

    if (event.key === "Escape") {
      closeProductModal();
    }

    if (event.key === "ArrowLeft") {
      changeProductImage(-1);
    }

    if (event.key === "ArrowRight") {
      changeProductImage(1);
    }
  });
}


/* =========================================================
   OPEN PRODUCT DETAILS
========================================================= */

function openProductModal(product) {

  createProductModal();

  currentProduct = product;
  currentImageIndex = 0;
  currentQuantity = 1;

  const images = getProductImages(product);

  document.getElementById("ntProductCategory").textContent =
    product.category || "Product";

  document.getElementById("ntProductName").textContent =
    product.name || "Product";

  document.getElementById("ntProductDescription").textContent =
    product.description || "No description available.";

  document.getElementById("ntProductPrice").textContent =
    currency(product.price);

  document.getElementById("ntProductWeight").textContent =
    product.weight || "-";

  document.getElementById("ntProductCategoryTable").textContent =
    product.category || "-";


  /* MRP */

  const mrpElement =
    document.getElementById("ntProductMrp");

  const saveElement =
    document.getElementById("ntProductSave");

  if (product.mrp && Number(product.mrp) > Number(product.price || 0)) {

    mrpElement.textContent = currency(product.mrp);

    const saving =
      Number(product.mrp) - Number(product.price || 0);

    saveElement.textContent =
      `Save ${currency(saving)}`;

  } else {

    mrpElement.textContent = "";
    saveElement.textContent = "";
  }


  /* Stock */

  const stockElement =
    document.getElementById("ntProductStock");

  const stock =
    Number(product.stock || 0);

  if (stock > 0) {

    stockElement.textContent =
      `In stock (${stock})`;

    stockElement.className =
      "nt-stock-in";

  } else {

    stockElement.textContent =
      "Out of stock";

    stockElement.className =
      "nt-stock-out";
  }


  /* Gallery */

  renderGallery(images);


  /* Quantity */

  updateQuantityUI();


  /* Modal */

  const modal =
    document.getElementById("ntProductModal");

  modal.classList.add("show");

  document.body.style.overflow = "hidden";
}


/* =========================================================
   CLOSE PRODUCT DETAILS
========================================================= */

function closeProductModal() {

  const modal =
    document.getElementById("ntProductModal");

  if (!modal) return;

  modal.classList.remove("show");

  document.body.style.overflow = "";
}


/* =========================================================
   GALLERY
========================================================= */

function renderGallery(images) {

  const mainImage =
    document.getElementById("ntMainProductImage");

  const thumbnails =
    document.getElementById("ntThumbnails");

  mainImage.src =
    images[currentImageIndex];

  mainImage.alt =
    currentProduct?.name || "Product image";


  thumbnails.innerHTML =
    images
      .map((image, index) => `
        <button
          class="nt-thumb ${index === currentImageIndex ? "active" : ""}"
          type="button"
          data-index="${index}"
          aria-label="View image ${index + 1}"
        >
          <img
            src="${esc(image)}"
            alt="${esc(currentProduct?.name || "Product")}"
          >
        </button>
      `)
      .join("");


  thumbnails
    .querySelectorAll(".nt-thumb")
    .forEach(button => {

      button.addEventListener("click", event => {

        event.stopPropagation();

        currentImageIndex =
          Number(button.dataset.index);

        renderGallery(images);
      });

    });


  /* Hide arrows if only one image */

  const prev =
    document.getElementById("ntPrevImage");

  const next =
    document.getElementById("ntNextImage");

  if (images.length <= 1) {

    prev.style.display = "none";
    next.style.display = "none";

  } else {

    prev.style.display = "block";
    next.style.display = "block";
  }
}


/* =========================================================
   CHANGE IMAGE
========================================================= */

function changeProductImage(direction) {

  if (!currentProduct) return;

  const images =
    getProductImages(currentProduct);

  if (images.length <= 1) return;

  currentImageIndex += direction;

  if (currentImageIndex < 0) {
    currentImageIndex = images.length - 1;
  }

  if (currentImageIndex >= images.length) {
    currentImageIndex = 0;
  }

  renderGallery(images);
}


/* =========================================================
   QUANTITY
========================================================= */

function updateQuantityUI() {

  if (!currentProduct) return;

  const quantity =
    document.getElementById("ntQuantity");

  const total =
    document.getElementById("ntTotalPrice");

  const whatsapp =
    document.getElementById("ntWhatsAppOrder");

  const stock =
    Number(currentProduct.stock || 0);


  quantity.textContent =
    currentQuantity;


  total.textContent =
    currency(
      Number(currentProduct.price || 0) *
      currentQuantity
    );


  if (stock > 0) {

    whatsapp.href =
      waUrl(currentProduct, currentQuantity);

    whatsapp.textContent =
      "Order on WhatsApp";

    whatsapp.classList.remove("nt-out-btn");

  } else {

    whatsapp.removeAttribute("href");

    whatsapp.textContent =
      "Out of Stock";

    whatsapp.classList.add("nt-out-btn");
  }
}


/* =========================================================
   RENDER PRODUCT CARDS
========================================================= */

async function renderProducts() {

  const grid =
    document.getElementById("productGrid");

  if (!grid) return;


  const search =
    (
      document.getElementById("searchInput")?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const category =
    document.getElementById("categoryFilter")?.value ||
    "all";


  if (!allProductsCache.length) {
    allProductsCache = await getProducts();
  }


  const products =
    allProductsCache.filter(product => {

      const matchesCategory =
        category === "all" ||
        product.category === category;


      const text =
        `
          ${product.name || ""}
          ${product.description || ""}
          ${product.category || ""}
        `.toLowerCase();


      const matchesSearch =
        !search ||
        text.includes(search);


      return matchesCategory && matchesSearch;
    });


  if (!products.length) {

    grid.innerHTML =
      `<div class="empty">No products found.</div>`;

    return;
  }


  grid.innerHTML =
    products
      .map(product => {

        const images =
          getProductImages(product);

        const firstImage =
          images[0];

        const stock =
          Number(product.stock || 0);


        return `
          <article
            class="product-card"
            data-product-id="${esc(product.id)}"
            tabindex="0"
            role="button"
            aria-label="View ${esc(product.name)}"
          >

            <div class="product-image">

              <img
                src="${esc(firstImage)}"
                alt="${esc(product.name)}"
                loading="lazy"
              >

            </div>


            <div class="product-body">

              <span class="pill">
                ${esc(product.category || "Product")}
              </span>


              <h3>
                ${esc(product.name)}
              </h3>


              <p>
                ${esc(product.description || "")}
              </p>


              <div class="price-row">

                <span class="price">
                  ${currency(product.price)}
                </span>

                ${
                  product.mrp
                    ? `
                      <span class="mrp">
                        ${currency(product.mrp)}
                      </span>
                    `
                    : ""
                }

              </div>


              <div class="stock">

                ${
                  stock > 0
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

                <button
                  type="button"
                  class="mini-btn buy nt-view-product"
                >
                  View Product
                </button>

              </div>

            </div>

          </article>
        `;
      })
      .join("");


  /* Product click */

  grid
    .querySelectorAll(".product-card")
    .forEach(card => {

      const productId =
        card.dataset.productId;

      const product =
        allProductsCache.find(
          item => String(item.id) === String(productId)
        );

      if (!product) return;


      card.addEventListener("click", () => {
        openProductModal(product);
      });


      /* Keyboard support */

      card.addEventListener("keydown", event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openProductModal(product);
        }
      });


      /* Prevent button event from causing problems */

      const viewButton =
        card.querySelector(".nt-view-product");

      viewButton?.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        openProductModal(product);
      });

    });
}


/* =========================================================
   CATEGORIES
========================================================= */

async function updateCategories() {

  const select =
    document.getElementById("categoryFilter");

  if (!select) return;


  if (!allProductsCache.length) {
    allProductsCache = await getProducts();
  }


  const categories = [
    ...new Set(
      allProductsCache
        .map(product => product.category)
        .filter(Boolean)
    )
  ].sort();


  select.innerHTML =
    `<option value="all">All categories</option>` +
    categories
      .map(category =>
        `
          <option value="${esc(category)}">
            ${esc(category)}
          </option>
        `
      )
      .join("");
}


/* =========================================================
   START WEBSITE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* Add product-detail design */

    addProductDetailsStyles();

    /* Create product popup */

    createProductModal();


    /* Footer year */

    const year =
      document.getElementById("year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }


    /* Load products */

    allProductsCache =
      await getProducts();


    /* Categories */

    await updateCategories();


    /* Product cards */

    await renderProducts();


    /* Search */

    document
      .getElementById("searchInput")
      ?.addEventListener(
        "input",
        renderProducts
      );


    /* Category */

    document
      .getElementById("categoryFilter")
      ?.addEventListener(
        "change",
        renderProducts
      );

  }
);
