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

const firebaseConfig = {
  apiKey: "AIzaSyAHGFmf2Uie08etFM5jq_-_UL091kbn4wQ",
  authDomain: "nature-touch-products-2e501.firebaseapp.com",
  projectId: "nature-touch-products-2e501",
  storageBucket: "nature-touch-products-2e501.firebasestorage.app",
  messagingSenderId: "237809167619",
  appId: "1:237809167619:web:6b3378c1298e8a8d2a4d36"
};

const ADMIN_UID = "a61TJBh4PRWjGUswfTN70ar0byW2";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);

let products = [];

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

function showLogin() {
  $("loginView")?.classList.remove("hidden");
  $("appView")?.classList.add("hidden");
}

function showAdmin() {
  $("loginView")?.classList.add("hidden");
  $("appView")?.classList.remove("hidden");

  loadProducts();
}

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

async function logout() {
  await signOut(auth);
}

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

function refreshStats() {
  const total = products.length;
  const active = products.filter(p => p.active !== false).length;

  const totalEl = document.getElementById("totalProducts");
  const activeEl = document.getElementById("activeProducts");

  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
}

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

  list.innerHTML = filtered.map(product => `
    <div class="admin-product">
      <div>
        <strong>${escapeHtml(product.name || "Unnamed product")}</strong>
        <div>₹${Number(product.price || 0).toLocaleString("en-IN")}</div>
        <small>
          Stock: ${Number(product.stock || 0)}
        </small>
      </div>

      <div class="admin-product-actions">
        <button type="button" data-edit="${product.id}">
          Edit
        </button>

        <button type="button" data-delete="${product.id}">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function readForm(forceNew = false) {
  const existingId = $("productId")?.value || "";

  return {
    name: $("name")?.value.trim() || "",
    price: Number($("price")?.value || 0),
    mrp: Number($("mrp")?.value || 0),
    weight: $("weight")?.value.trim() || "",
    category: $("category")?.value.trim() || "",
    stock: Number($("stock")?.value || 0),
    image: $("image")?.value.trim() || "assets/logo.png",
    description: $("description")?.value.trim() || "",
    active: $("active")?.checked ?? true,
    ...(forceNew || !existingId
      ? {}
      : { id: existingId })
  };
}

function clearForm() {
  $("productForm")?.reset();

  if ($("productId")) {
    $("productId").value = "";
  }

  if ($("active")) {
    $("active").checked = true;
  }
}

function fillForm(product) {
  if ($("productId")) $("productId").value = product.id;
  if ($("name")) $("name").value = product.name || "";
  if ($("price")) $("price").value = product.price || "";
  if ($("mrp")) $("mrp").value = product.mrp || "";
  if ($("weight")) $("weight").value = product.weight || "";
  if ($("category")) $("category").value = product.category || "";
  if ($("stock")) $("stock").value = product.stock || "";
  if ($("image")) $("image").value = product.image || "";
  if ($("description")) $("description").value = product.description || "";
  if ($("active")) $("active").checked = product.active !== false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function saveProduct(event, forceNew = false) {
  event?.preventDefault();

  const data = readForm(forceNew);

  if (!data.name) {
    toast("Enter a product name");
    return;
  }

  try {
    if (data.id && !forceNew) {
      const productRef = doc(db, "products", data.id);

      delete data.id;

      await updateDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      toast("Product updated");
    } else {
      delete data.id;

      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast("Product added");
    }

    clearForm();
    await loadProducts();

  } catch (error) {
    console.error(error);
    toast("Could not save product");
  }
}

async function removeProduct(id) {
  const product = products.find(p => p.id === id);

  if (!product) return;

  const confirmed = confirm(
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
    toast("Could not delete product");
  }
}

document.addEventListener("DOMContentLoaded", () => {

  $("loginBtn")?.addEventListener("click", login);

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
    event => saveProduct(event, true)
  );

  $("productForm")?.addEventListener(
    "submit",
    event => saveProduct(event, false)
  );

  $("adminSearch")?.addEventListener(
    "input",
    renderList
  );

  $("adminList")?.addEventListener(
    "click",
    event => {

      const editButton =
        event.target.closest("[data-edit]");

      const deleteButton =
        event.target.closest("[data-delete]");

      if (editButton) {
        const product =
          products.find(
            item => item.id === editButton.dataset.edit
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

  onAuthStateChanged(auth, user => {

    if (!user) {
      showLogin();
      return;
    }

    if (user.uid !== ADMIN_UID) {
      signOut(auth);
      showLogin();
      toast("Unauthorized account");
      return;
    }

    showAdmin();
  });
});
