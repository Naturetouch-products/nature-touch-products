import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";


/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyAHGFmf2Uie08etFM5jq-_-UL091kbn4wQ",
  authDomain: "nature-touch-products-2e501.firebaseapp.com",
  projectId: "nature-touch-products-2e501",
  storageBucket: "nature-touch-products-2e501.firebasestorage.app",
  messagingSenderId: "237809167619",
  appId: "1:237809167619:web:6b3378c1298e8a8d2a4d36"
};

const ADMIN_UID = "a61TJBh4PRWjGUswfTN70ar0byW2";


/* =========================
   INITIALIZE FIREBASE
========================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = id => document.getElementById(id);

let products = [];
let selectedFiles = [];


/* =========================
   TOAST
========================= */

function toast(message) {
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}


/* =========================
   LOGIN / ADMIN VIEW
========================= */

function showLogin() {
  $("loginView")?.classList.remove("hidden");
  $("appView")?.classList.add("hidden");
}

function showAdmin() {
  $("loginView")?.classList.add("hidden");
  $("appView")?.classList.remove("hidden");

  loadProducts();
}


/* =========================
   LOGIN
========================= */

async function login() {

  const email = $("emailInput")?.value.trim();
  const password = $("passwordInput")?.value;

  if (!email || !password) {
    toast("Enter your email and password");
    return;
  }

  try {

    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (result.user.uid !== ADMIN_UID) {

      await signOut(auth);

      toast("This account is not authorized");

      return;
    }

    toast("Login successful");

  } catch (error) {

    console.error("Firebase login error:", error);

    toast("Login error: " + error.code);
  }
}


/* =========================
   LOGOUT
========================= */

async function logout() {
  await signOut(auth);
}


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  try {

    const snapshot = await getDocs(
      collection(db, "products")
    );

    products = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderList();
    refreshStats();

  } catch (error) {

    console.error(error);

    toast("Could not load products");
  }
}


/* =========================
   STATISTICS
========================= */

function refreshStats() {

  const total = products.length;

  const categories = new Set(
    products
      .map(p => p.category)
      .filter(Boolean)
  ).size;

  const inStock = products.filter(
    p => Number(p.stock || 0) > 0
  ).length;

  const outStock = products.filter(
    p => Number(p.stock || 0) <= 0
  ).length;

  if ($("totalProducts")) {
    $("totalProducts").textContent = total;
  }

  if ($("totalCategories")) {
    $("totalCategories").textContent = categories;
  }

  if ($("inStock")) {
    $("inStock").textContent = inStock;
  }

  if ($("outStock")) {
    $("outStock").textContent = outStock;
  }
}


/* =========================
   PRODUCT LIST
========================= */

function renderList() {

  const list = $("adminList");

  if (!list) return;

  const search =
    ($("adminSearch")?.value || "")
      .trim()
      .toLowerCase();

  const filtered = products.filter(product => {

    const text = `
      ${product.name || ""}
      ${product.category || ""}
      ${product.description || ""}
    `.toLowerCase();

    return !search || text.includes(search);
  });


  if (!filtered.length) {

    list.innerHTML = "<p>No products found.</p>";

    return;
  }


  list.innerHTML = filtered.map(product => {

    const image =
      product.image ||
      product.images?.[0] ||
      "assets/logo.png";

    return `
      <div class="admin-item">

        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(product.name || "Product")}"
        >

        <div>
          <h3>
            ${escapeHtml(product.name || "Unnamed product")}
          </h3>

          <p>
            ₹${Number(product.price || 0).toLocaleString("en-IN")}
            · Stock: ${Number(product.stock || 0)}
          </p>

          <p>
            ${escapeHtml(product.category || "")}
          </p>
        </div>

        <div class="admin-actions">

          <button
            type="button"
            class="small-btn"
            data-edit="${product.id}"
          >
            Edit
          </button>

          <button
            type="button"
            class="small-btn delete"
            data-delete="${product.id}"
          >
            Delete
          </button>

        </div>

      </div>
    `;

  }).join("");
}


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}


/* =========================
   IMAGE FILE SELECTION
========================= */

function handleImageSelection(event) {

  const files = Array.from(
    event.target.files || []
  );


  if (!files.length) {
    return;
  }


  if (files.length > 5) {

    toast("You can select maximum 5 images");

    event.target.value = "";

    selectedFiles = [];

    renderImagePreview();

    return;
  }


  const invalidFile = files.find(
    file => !file.type.startsWith("image/")
  );


  if (invalidFile) {

    toast("Only image files are allowed");

    event.target.value = "";

    selectedFiles = [];

    renderImagePreview();

    return;
  }


  const tooLarge = files.find(
    file => file.size > 5 * 1024 * 1024
  );


  if (tooLarge) {

    toast("Each image must be smaller than 5 MB");

    event.target.value = "";

    selectedFiles = [];

    renderImagePreview();

    return;
  }


  selectedFiles = files;

  renderImagePreview();
}


/* =========================
   IMAGE PREVIEW
========================= */

function renderImagePreview() {

  const preview = $("imagePreview");

  if (!preview) return;


  if (!selectedFiles.length) {

    preview.innerHTML = "";

    return;
  }


  preview.innerHTML = selectedFiles.map(
    (file, index) => {

      const url = URL.createObjectURL(file);

      return `
        <div class="image-preview-item">

          <img
            src="${url}"
            alt="Product image ${index + 1}"
          >

          <span>
            ${index + 1}
          </span>

        </div>
      `;

    }
  ).join("");
}


/* =========================
   UPLOAD IMAGES
========================= */

async function uploadProductImages(productId) {

  if (!selectedFiles.length) {
    return [];
  }


  const uploadedUrls = [];


  const status = $("uploadStatus");


  for (let i = 0; i < selectedFiles.length; i++) {

    const file = selectedFiles[i];


    if (status) {

      status.textContent =
        `Uploading image ${i + 1} of ${selectedFiles.length}...`;
    }


    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_");


    const filePath =
      `products/${productId}/${Date.now()}-${i}-${safeName}`;


    const storageRef = ref(
      storage,
      filePath
    );


    const snapshot = await uploadBytes(
      storageRef,
      file,
      {
        contentType: file.type
      }
    );


    const downloadURL =
      await getDownloadURL(snapshot.ref);


    uploadedUrls.push(downloadURL);
  }


  if (status) {

    status.textContent =
      `${uploadedUrls.length} image(s) uploaded successfully.`;
  }


  return uploadedUrls;
}


/* =========================
   READ FORM
========================= */

function readForm() {

  const existingId =
    $("productId")?.value || "";


  return {

    id: existingId,

    name:
      $("name")?.value.trim() || "",

    price:
      Number($("price")?.value || 0),

    mrp:
      Number($("mrp")?.value || 0),

    weight:
      $("weight")?.value.trim() || "",

    category:
      $("category")?.value.trim() || "",

    stock:
      Number($("stock")?.value || 0),

    description:
      $("description")?.value.trim() || "",

    active:
      $("active")?.checked ?? true

  };
}


/* =========================
   CLEAR FORM
========================= */

function clearForm() {

  $("productForm")?.reset();


  if ($("productId")) {
    $("productId").value = "";
  }


  if ($("active")) {
    $("active").checked = true;
  }


  selectedFiles = [];


  if ($("imageFiles")) {
    $("imageFiles").value = "";
  }


  if ($("imagePreview")) {
    $("imagePreview").innerHTML = "";
  }


  if ($("uploadStatus")) {

    $("uploadStatus").textContent =
      "Select up to 5 product images from your phone or laptop.";
  }


  if ($("formTitle")) {
    $("formTitle").textContent = "Add Product";
  }
}


/* =========================
   EDIT PRODUCT
========================= */

function fillForm(product) {

  if ($("productId")) {
    $("productId").value = product.id;
  }

  if ($("name")) {
    $("name").value = product.name || "";
  }

  if ($("price")) {
    $("price").value = product.price || "";
  }

  if ($("mrp")) {
    $("mrp").value = product.mrp || "";
  }

  if ($("weight")) {
    $("weight").value = product.weight || "";
  }

  if ($("category")) {
    $("category").value = product.category || "";
  }

  if ($("stock")) {
    $("stock").value = product.stock || "";
  }

  if ($("description")) {
    $("description").value =
      product.description || "";
  }

  if ($("active")) {
    $("active").checked =
      product.active !== false;
  }


  if ($("formTitle")) {
    $("formTitle").textContent =
      "Edit Product";
  }


  selectedFiles = [];


  if ($("imageFiles")) {
    $("imageFiles").value = "";
  }


  renderExistingImages(product);


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   SHOW EXISTING IMAGES
========================= */

function renderExistingImages(product) {

  const preview = $("imagePreview");

  if (!preview) return;


  const images = Array.isArray(product.images)
    ? product.images
    : product.image
      ? [product.image]
      : [];


  if (!images.length) {

    preview.innerHTML = "";

    return;
  }


  preview.innerHTML = images
    .slice(0, 5)
    .map(
      (url, index) => `
        <div class="image-preview-item existing-image">

          <img
            src="${escapeHtml(url)}"
            alt="Existing product image ${index + 1}"
          >

          <span>
            ${index + 1}
          </span>

        </div>
      `
    )
    .join("");


  if ($("uploadStatus")) {

    $("uploadStatus").textContent =
      "Existing images shown. Choose new images to replace them.";
  }
}


/* =========================
   SAVE PRODUCT
========================= */

async function saveProduct(event, forceNew = false) {

  event?.preventDefault();


  const data = readForm();


  if (!data.name) {

    toast("Enter a product name");

    return;
  }


  try {

    let productId =
      data.id && !forceNew
        ? data.id
        : null;


    /* =========================
       UPDATE EXISTING PRODUCT
    ========================= */

    if (productId) {

      const productRef =
        doc(db, "products", productId);


      let existingProduct =
        products.find(p => p.id === productId);


      let images =
        Array.isArray(existingProduct?.images)
          ? existingProduct.images
          : existingProduct?.image
            ? [existingProduct.image]
            : [];


      /*
        If new images were selected,
        upload them and replace the old gallery.
      */

      if (selectedFiles.length) {

        images =
          await uploadProductImages(productId);
      }


      const updateData = {

        name: data.name,

        price: data.price,

        mrp: data.mrp,

        weight: data.weight,

        category: data.category,

        stock: data.stock,

        description: data.description,

        active: data.active,

        image:
          images[0] ||
          "assets/logo.png",

        images: images.slice(0, 5),

        updatedAt:
          serverTimestamp()
      };


      await updateDoc(
        productRef,
        updateData
      );


      toast("Product updated");

    }


    /* =========================
       ADD NEW PRODUCT
    ========================= */

    else {

      /*
        First create the product so we
        get a Firestore document ID.
      */

      const productRef =
        await addDoc(
          collection(db, "products"),
          {

            name: data.name,

            price: data.price,

            mrp: data.mrp,

            weight: data.weight,

            category: data.category,

            stock: data.stock,

            description: data.description,

            active: data.active,

            image: "assets/logo.png",

            images: [],

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()
          }
        );


      /*
        Now upload selected images
        inside:

        products/{productId}/
      */

      let images = [];


      if (selectedFiles.length) {

        images =
          await uploadProductImages(
            productRef.id
          );


        await updateDoc(
          productRef,
          {

            image:
              images[0] ||
              "assets/logo.png",

            images:
              images.slice(0, 5),

            updatedAt:
              serverTimestamp()

          }
        );
      }


      toast("Product added");
    }


    clearForm();

    await loadProducts();


  } catch (error) {

    console.error(
      "Save product error:",
      error
    );


    if (error.code === "storage/unauthorized") {

      toast(
        "Storage permission denied. Check Firebase Storage Rules."
      );

    } else {

      toast(
        "Could not save product: " +
        (error.message || error.code || "")
      );
    }
  }
}


/* =========================
   DELETE PRODUCT
========================= */

async function removeProduct(id) {

  const product =
    products.find(p => p.id === id);


  if (!product) return;


  const confirmed =
    confirm(
      `Delete "${product.name}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(db, "products", id)
    );


    toast("Product deleted");


    await loadProducts();


  } catch (error) {

    console.error(error);

    toast(
      "Could not delete product"
    );
  }
}


/* =========================
   EVENT LISTENERS
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    $("loginBtn")?.addEventListener(
      "click",
      login
    );


    $("passwordInput")?.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          login();
        }

      }
    );


    $("logoutBtn")?.addEventListener(
      "click",
      logout
    );


    $("resetBtn")?.addEventListener(
      "click",
      clearForm
    );


    $("duplicateBtn")?.addEventListener(
      "click",
      event =>
        saveProduct(event, true)
    );


    $("productForm")?.addEventListener(
      "submit",
      event =>
        saveProduct(event, false)
    );


    $("adminSearch")?.addEventListener(
      "input",
      renderList
    );


    /*
      IMAGE FILE PICKER
    */

    $("imageFiles")?.addEventListener(
      "change",
      handleImageSelection
    );


    /*
      PRODUCT EDIT / DELETE
    */

    $("adminList")?.addEventListener(
      "click",
      event => {

        const editButton =
          event.target.closest(
            "[data-edit]"
          );


        const deleteButton =
          event.target.closest(
            "[data-delete]"
          );


        if (editButton) {

          const product =
            products.find(
              item =>
                item.id ===
                editButton.dataset.edit
            );


          if (product) {
            fillForm(product);
          }
        }


        if (deleteButton) {

          removeProduct(
            deleteButton.dataset.delete
          );
        }

      }
    );


    /*
      FIREBASE AUTH STATE
    */

    onAuthStateChanged(
      auth,
      user => {

        if (!user) {

          showLogin();

          return;
        }


        if (user.uid !== ADMIN_UID) {

          signOut(auth);

          showLogin();

          toast(
            "Unauthorized account"
          );

          return;
        }


        showAdmin();

      }
    );

  }
);
