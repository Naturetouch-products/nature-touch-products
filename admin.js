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


/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyAHGFmfU2ie08etFM5jq-_-UL091kbn4wQ",
  authDomain: "nature-touch-products-2e501.firebaseapp.com",
  projectId: "nature-touch-products-2e501",
  storageBucket: "nature-touch-products-2e501.firebasestorage.app",
  messagingSenderId: "237809167619",
  appId: "1:237809167619:web:6b3378c1298e8a8d2a4d36"
};

const ADMIN_UID = "a61TJBh4PRWjGUswfTN70ar0byW2";


/* =========================
   FIREBASE INITIALIZATION
========================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================
   HELPERS
========================= */

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

  const email =
    $("emailInput")?.value.trim();

  const password =
    $("passwordInput")?.value || "";

  if (!email) {
    toast("Enter your email");
    return;
  }

  if (!password) {
    toast("Enter your password");
    return;
  }

  try {

    toast("Logging in...");

    const result =
      await signInWithEmailAndPassword(
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

    console.error(
      "Firebase login error:",
      error
    );

    let message =
      error.code ||
      error.message ||
      "Login failed";

    if (
      error.code ===
      "auth/invalid-credential"
    ) {

      message =
        "Invalid email or password";

    } else if (
      error.code ===
      "auth/user-not-found"
    ) {

      message =
        "User not found";

    } else if (
      error.code ===
      "auth/wrong-password"
    ) {

      message =
        "Wrong password";

    } else if (
      error.code ===
      "auth/invalid-email"
    ) {

      message =
        "Invalid email";
    }

    toast("Login error: " + message);
  }
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

    toast("Logout failed");
  }
}


/* =========================
   IMAGE PATH
========================= */

function fixImagePath(image) {

  if (!image) {
    return "assets/logo.png";
  }

  return String(image)
    .replace(/^assets\/products\//, "products/");
}


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "products"
        )
      );

    products =
      snapshot.docs.map(item => ({

        id: item.id,

        ...item.data()

      }));

    renderList();

    refreshStats();

  } catch (error) {

    console.error(
      "Load products error:",
      error
    );

    toast(
      "Could not load products: " +
      (
        error.code ||
        error.message ||
        ""
      )
    );
  }
}


/* =========================
   STATS
========================= */

function refreshStats() {

  const total =
    products.length;

  const categories =
    new Set(
      products
        .map(product =>
          product.category
        )
        .filter(Boolean)
    ).size;

  const inStock =
    products.filter(
      product =>
        Number(
          product.stock || 0
        ) > 0
    ).length;

  const outStock =
    products.filter(
      product =>
        Number(
          product.stock || 0
        ) <= 0
    ).length;

  if ($("totalProducts")) {

    $("totalProducts").textContent =
      total;
  }

  if ($("totalCategories")) {

    $("totalCategories").textContent =
      categories;
  }

  if ($("inStock")) {

    $("inStock").textContent =
      inStock;
  }

  if ($("outStock")) {

    $("outStock").textContent =
      outStock;
  }
}


/* =========================
   RENDER PRODUCT LIST
========================= */

function renderList() {

  const list =
    $("adminList");

  if (!list) return;

  const search =
    (
      $("adminSearch")?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  const filtered =
    products.filter(product => {

      const text = `

        ${product.name || ""}

        ${product.category || ""}

        ${product.description || ""}

      `.toLowerCase();

      return (
        !search ||
        text.includes(search)
      );
    });

  if (!filtered.length) {

    list.innerHTML =
      "<p>No products found.</p>";

    return;
  }

  list.innerHTML =
    filtered.map(product => {

      const image =
        fixImagePath(
          product.image ||
          (
            Array.isArray(
              product.images
            )
              ? product.images[0]
              : ""
          )
        );

      return `

        <div class="admin-item">

          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(
              product.name ||
              "Product"
            )}"
          >

          <div>

            <h3>
              ${escapeHtml(
                product.name ||
                "Unnamed product"
              )}
            </h3>

            <p>
              ₹${Number(
                product.price || 0
              ).toLocaleString("en-IN")}

              · Stock:

              ${Number(
                product.stock || 0
              )}
            </p>

            <p>
              ${escapeHtml(
                product.category || ""
              )}
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
   ESCAPE HTML
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
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
   IMAGE SELECTION
========================= */

function handleImageSelection(event) {

  const newFiles =
    Array.from(
      event.target.files || []
    );

  if (!newFiles.length) return;

  const mergedFiles = [
    ...selectedFiles,
    ...newFiles
  ];

  const uniqueFiles =
    mergedFiles.filter(
      (file, index, array) =>
        index ===
        array.findIndex(
          item =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified ===
              file.lastModified
        )
    );

  if (uniqueFiles.length > 5) {

    toast(
      "Maximum 5 images allowed"
    );

    return;
  }

  const invalidFile =
    uniqueFiles.find(
      file =>
        !file.type.startsWith(
          "image/"
        )
    );

  if (invalidFile) {

    toast(
      "Only image files are allowed"
    );

    return;
  }

  const tooLarge =
    uniqueFiles.find(
      file =>
        file.size >
        5 * 1024 * 1024
    );

  if (tooLarge) {

    toast(
      "Each image must be smaller than 5 MB"
    );

    return;
  }

  selectedFiles =
    uniqueFiles;

  renderImagePreview();

  if ($("uploadStatus")) {

    $("uploadStatus").textContent =
      `${selectedFiles.length} image(s) selected. Maximum 5.`;
  }

  event.target.value = "";
}


/* =========================
   IMAGE PREVIEW
========================= */

function renderImagePreview() {

  const preview =
    $("imagePreview");

  if (!preview) return;

  if (!selectedFiles.length) {

    preview.innerHTML = "";

    return;
  }

  preview.innerHTML =
    selectedFiles
      .map(
        (file, index) => {

          const url =
            URL.createObjectURL(
              file
            );

          return `

            <div
              class="image-preview-item"
            >

              <img
                src="${url}"
                alt="Product image ${
                  index + 1
                }"
              >

              <span>
                ${index + 1}
              </span>

            </div>

          `;

        }
      )
      .join("");
}


/* =========================
   GITHUB IMAGE PATHS
========================= */

/*
   IMPORTANT:

   First upload the selected image files
   to the GitHub "products/" folder.

   Example:

   products/soap.jpg
   products/moringa.jpg

   Then this function saves those paths
   into Firestore.

   No Cloudinary.
   No Firebase Storage.
*/

function selectedImagePaths() {

  return selectedFiles
    .slice(0, 5)
    .map(
      file =>
        "products/" +
        encodeURIComponent(file.name)
    );
}


/* =========================
   READ FORM
========================= */

function readForm() {

  return {

    id:
      $("productId")?.value ||
      "",

    name:
      $("name")?.value.trim() ||
      "",

    price:
      Number(
        $("price")?.value ||
        0
      ),

    mrp:
      Number(
        $("mrp")?.value ||
        0
      ),

    weight:
      $("weight")?.value.trim() ||
      "",

    category:
      $("category")?.value.trim() ||
      "",

    stock:
      Number(
        $("stock")?.value ||
        0
      ),

    description:
      $("description")?.value.trim() ||
      "",

    active:
      $("active")?.checked ??
      true

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

    $("imagePreview").innerHTML =
      "";
  }

  if ($("uploadStatus")) {

    $("uploadStatus").textContent =
      "Select up to 5 product images from your phone or laptop.";
  }

  if ($("formTitle")) {

    $("formTitle").textContent =
      "Add Product";
  }
}


/* =========================
   EDIT FORM
========================= */

function fillForm(product) {

  if ($("productId")) {

    $("productId").value =
      product.id;
  }

  if ($("name")) {

    $("name").value =
      product.name || "";
  }

  if ($("price")) {

    $("price").value =
      product.price || "";
  }

  if ($("mrp")) {

    $("mrp").value =
      product.mrp || "";
  }

  if ($("weight")) {

    $("weight").value =
      product.weight || "";
  }

  if ($("category")) {

    $("category").value =
      product.category || "";
  }

  if ($("stock")) {

    $("stock").value =
      product.stock || "";
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

  renderExistingImages(
    product
  );

  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });
}


/* =========================
   EXISTING IMAGES
========================= */

function renderExistingImages(
  product
) {

  const preview =
    $("imagePreview");

  if (!preview) return;

  let images = [];

  if (
    Array.isArray(
      product.images
    )
  ) {

    images =
      product.images.filter(
        Boolean
      );

  } else if (
    product.image
  ) {

    images = [
      product.image
    ];
  }

  images =
    images
      .map(fixImagePath)
      .slice(0, 5);

  if (!images.length) {

    preview.innerHTML = "";

    return;
  }

  preview.innerHTML =
    images
      .map(
        (url, index) => `

          <div
            class="image-preview-item existing-image"
          >

            <img
              src="${escapeHtml(url)}"
              alt="Product image ${
                index + 1
              }"
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
      "Existing images shown. Select new images to replace them.";
  }
}


/* =========================
   SAVE PRODUCT
========================= */

async function saveProduct(
  event,
  forceNew = false
) {

  event?.preventDefault();

  const data =
    readForm();

  if (!data.name) {

    toast(
      "Enter a product name"
    );

    return;
  }

  try {

    const productId =
      data.id && !forceNew
        ? data.id
        : null;


    /* =====================
       UPDATE
    ===================== */

    if (productId) {

      const productRef =
        doc(
          db,
          "products",
          productId
        );

      const existingProduct =
        products.find(
          product =>
            product.id ===
            productId
        );

      let images = [];

      if (
        Array.isArray(
          existingProduct?.images
        )
      ) {

        images =
          existingProduct.images
            .filter(Boolean)
            .map(fixImagePath);

      } else if (
        existingProduct?.image
      ) {

        images = [
          fixImagePath(
            existingProduct.image
          )
        ];
      }


      /*
         If new images were selected,
         use their GitHub paths.
      */

      if (selectedFiles.length) {

        images =
          selectedImagePaths();
      }

      images =
        images.slice(0, 5);

      const updateData = {

        name:
          data.name,

        price:
          data.price,

        mrp:
          data.mrp,

        weight:
          data.weight,

        category:
          data.category,

        stock:
          data.stock,

        description:
          data.description,

        active:
          data.active,

        image:
          images[0] ||
          "assets/logo.png",

        images:
          images,

        updatedAt:
          serverTimestamp()
      };

      await updateDoc(
        productRef,
        updateData
      );

      toast(
        "Product updated"
      );
    }


    /* =====================
       ADD NEW
    ===================== */

    else {

      const images =
        selectedFiles.length
          ? selectedImagePaths()
          : [];

      await addDoc(
        collection(
          db,
          "products"
        ),
        {

          name:
            data.name,

          price:
            data.price,

          mrp:
            data.mrp,

          weight:
            data.weight,

          category:
            data.category,

          stock:
            data.stock,

          description:
            data.description,

          active:
            data.active,

          image:
            images[0] ||
            "assets/logo.png",

          images:
            images.slice(0, 5),

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );

      toast(
        "Product added"
      );
    }

    clearForm();

    await loadProducts();

  } catch (error) {

    console.error(
      "Save product error:",
      error
    );

    toast(
      "Could not save product: " +
      (
        error.code ||
        error.message ||
        ""
      )
    );
  }
}


/* =========================
   DELETE PRODUCT
========================= */

async function removeProduct(
  id
) {

  const product =
    products.find(
      p => p.id === id
    );

  if (!product) return;

  const confirmed =
    confirm(
      `Delete "${product.name}"?`
    );

  if (!confirmed) return;

  try {

    await deleteDoc(
      doc(
        db,
        "products",
        id
      )
    );

    toast(
      "Product deleted"
    );

    await loadProducts();

  } catch (error) {

    console.error(
      "Delete error:",
      error
    );

    toast(
      "Could not delete product: " +
      (
        error.code ||
        error.message ||
        ""
      )
    );
  }
}


/* =========================
   PAGE EVENTS
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /* LOGIN */

    $("loginBtn")?.addEventListener(
      "click",
      login
    );

    $("passwordInput")?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          login();
        }

      }
    );


    /* LOGOUT */

    $("logoutBtn")?.addEventListener(
      "click",
      logout
    );


    /* RESET */

    $("resetBtn")?.addEventListener(
      "click",
      clearForm
    );


    /* DUPLICATE */

    $("duplicateBtn")?.addEventListener(
      "click",
      event =>
        saveProduct(
          event,
          true
        )
    );


    /* SAVE */

    $("productForm")?.addEventListener(
      "submit",
      event =>
        saveProduct(
          event,
          false
        )
    );


    /* SEARCH */

    $("adminSearch")?.addEventListener(
      "input",
      renderList
    );


    /* IMAGES */

    $("imageFiles")?.addEventListener(
      "change",
      handleImageSelection
    );


    /* EDIT / DELETE */

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
                editButton.dataset
                  .edit
            );

          if (product) {

            fillForm(
              product
            );
          }
        }

        if (deleteButton) {

          removeProduct(
            deleteButton.dataset
              .delete
          );
        }

      }
    );


    /* =====================
       AUTH STATE
    ===================== */

    onAuthStateChanged(
      auth,
      user => {

        console.log(
          "Auth state:",
          user
            ? user.uid
            : "Not logged in"
        );

        if (!user) {

          showLogin();

          return;
        }

        if (
          user.uid !==
          ADMIN_UID
        ) {

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
