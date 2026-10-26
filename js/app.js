import { loadProducts } from "./api.js";
import { calculateTotals, validateCart } from "./cart.js";
import { restoreCart, saveCart } from "./storage.js";
import "./components/product-card.js";
import "./components/product-list.js";
import "./components/shopping-cart.js";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const elements = {
  filters: document.querySelector("#filters"),
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  sort: document.querySelector("#sort"),
  availableOnly: document.querySelector("#available-only"),
  clearFilters: document.querySelector("#clear-filters"),
  status: document.querySelector("#catalog-status"),
  error: document.querySelector("#catalog-error"),
  errorText: document.querySelector("#catalog-error-text"),
  retry: document.querySelector("#retry-catalog"),
  list: document.querySelector("#product-list"),
  count: document.querySelector("#catalog-count"),
  cart: document.querySelector("#shopping-cart"),
  headerUnits: document.querySelector("#header-units"),
  cartUnits: document.querySelector("#cart-units"),
  notice: document.querySelector("#app-notice"),
  orderFeedback: document.querySelector("#order-feedback")
};

let products = [];
let productsById = new Map();
let cartLines = [];
let noticeTimer;

function showNotice(message) {
  window.clearTimeout(noticeTimer);
  elements.notice.textContent = message;
  elements.notice.hidden = false;
  noticeTimer = window.setTimeout(() => {
    elements.notice.hidden = true;
    elements.notice.textContent = "";
  }, 6000);
}

function updateCartView() {
  const totals = calculateTotals(cartLines, productsById);
  elements.cart.state = { lines: cartLines, productsById, totals };
  elements.headerUnits.textContent = String(totals.units);
  elements.cartUnits.textContent = `${totals.units} ${totals.units === 1 ? "unidad" : "unidades"}`;
}

function commitCart(nextLines) {
  cartLines = nextLines;
  updateCartView();
  if (!saveCart(cartLines)) {
    showNotice("El carrito está actualizado, pero el navegador no permitió guardarlo para la próxima visita.");
  }
}

function filterProducts() {
  const query = elements.search.value.trim().toLocaleLowerCase("es");
  const category = elements.category.value;
  const availableOnly = elements.availableOnly.checked;
  const sort = elements.sort.value;

  const filtered = products.filter((product) => {
    const textMatches = `${product.name} ${product.description}`.toLocaleLowerCase("es").includes(query);
    const categoryMatches = !category || product.category === category;
    const availabilityMatches = !availableOnly || (product.active && product.stock > 0);
    return textMatches && categoryMatches && availabilityMatches;
  });

  if (sort === "asc") filtered.sort((first, second) => first.price - second.price || first.id - second.id);
  if (sort === "desc") filtered.sort((first, second) => second.price - first.price || first.id - second.id);

  elements.list.products = filtered;
  elements.count.textContent = `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`;
  elements.status.hidden = filtered.length !== 0;
  elements.status.textContent = products.length === 0
    ? "El catálogo está disponible, pero todavía no contiene productos."
    : "No hay productos que coincidan con los filtros.";
}

function resetFilters() {
  elements.filters.reset();
  filterProducts();
}

function addProduct(id) {
  const product = productsById.get(id);
  if (!product || !product.active || product.stock < 1) {
    showNotice("Este producto no está disponible y no se puede agregar al carrito.");
    return;
  }

  const existing = cartLines.find((line) => line.id === id);
  if (existing && existing.quantity >= product.stock) {
    showNotice(`No puedes agregar más unidades de ${product.name}; solo hay ${product.stock} disponibles.`);
    return;
  }

  const nextLines = existing
    ? cartLines.map((line) => line.id === id ? { ...line, quantity: line.quantity + 1 } : line)
    : [...cartLines, { id, quantity: 1 }];
  commitCart(nextLines);
  showNotice(`${product.name} se agregó al carrito.`);
}

function changeQuantity(id, delta) {
  const line = cartLines.find((item) => item.id === id);
  const product = productsById.get(id);
  if (!line || !product || !Number.isSafeInteger(delta) || ![-1, 1].includes(delta)) {
    showNotice("No se pudo cambiar la cantidad: la solicitud no es válida.");
    return;
  }

  const quantity = line.quantity + delta;
  if (quantity < 1) {
    showNotice("La cantidad mínima por línea es 1. Usa Eliminar para quitar el producto.");
    return;
  }
  if (!product.active || quantity > product.stock) {
    showNotice(`No se puede superar el inventario disponible de ${product.name} (${product.stock}).`);
    return;
  }

  commitCart(cartLines.map((item) => item.id === id ? { ...item, quantity } : item));
}

function removeProduct(id) {
  if (!cartLines.some((line) => line.id === id)) {
    showNotice("El producto ya no está en el carrito.");
    return;
  }
  commitCart(cartLines.filter((line) => line.id !== id));
}

function confirmOrder() {
  const validation = validateCart(cartLines, productsById);
  if (!validation.valid) {
    showNotice(validation.reason);
    return;
  }

  const totals = calculateTotals(cartLines, productsById);
  const uniquePart = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  const orderId = `TS-${Date.now().toString(36).toUpperCase()}-${uniquePart.toUpperCase()}`;
  const lines = cartLines.map((line) => {
    const product = productsById.get(line.id);
    return `${product.name} × ${line.quantity} — ${currency.format(product.price * line.quantity)}`;
  });

  elements.orderFeedback.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = "Pedido preparado correctamente";
  const identifier = document.createElement("p");
  identifier.textContent = `Identificador del pedido: ${orderId}`;
  const lineList = document.createElement("ul");
  for (const description of lines) {
    const item = document.createElement("li");
    item.textContent = description;
    lineList.append(item);
  }
  const totalsText = document.createElement("p");
  totalsText.textContent = `Subtotal: ${currency.format(totals.subtotal)} · Descuento: ${currency.format(totals.discount)} · Total: ${currency.format(totals.total)}`;
  const note = document.createElement("p");
  note.textContent = "Esta es una simulación local; no se efectuó ningún pago ni se modificó el inventario.";
  elements.orderFeedback.append(title, identifier, lineList, totalsText, note);
  elements.orderFeedback.hidden = false;
  commitCart([]);
  elements.orderFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function initializeCatalog() {
  elements.status.hidden = false;
  elements.status.textContent = "Cargando catálogo…";
  elements.error.hidden = true;
  elements.list.products = [];
  elements.count.textContent = "";

  try {
    products = await loadProducts();
    productsById = new Map(products.map((product) => [product.id, product]));
    const restored = restoreCart(productsById);
    cartLines = restored.lines;
    updateCartView();
    if (restored.warning) showNotice(restored.warning);

    const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, "es"));
    elements.category.replaceChildren(new Option("Todas las categorías", ""));
    for (const category of categories) elements.category.add(new Option(category, category));

    elements.status.hidden = true;
    filterProducts();
  } catch (error) {
    products = [];
    productsById = new Map();
    cartLines = [];
    updateCartView();
    elements.status.hidden = true;
    elements.errorText.textContent = error instanceof Error ? error.message : "Ocurrió un error inesperado al cargar el catálogo.";
    elements.error.hidden = false;
  }
}

elements.filters.addEventListener("input", filterProducts);
elements.filters.addEventListener("change", filterProducts);
elements.clearFilters.addEventListener("click", resetFilters);
elements.retry.addEventListener("click", initializeCatalog);
elements.list.addEventListener("product-add-request", (event) => addProduct(event.detail?.id));
elements.cart.addEventListener("cart-quantity-request", (event) => changeQuantity(event.detail?.id, event.detail?.delta));
elements.cart.addEventListener("cart-remove-request", (event) => removeProduct(event.detail?.id));
elements.cart.addEventListener("cart-clear-request", () => {
  if (cartLines.length > 0) commitCart([]);
});
elements.cart.addEventListener("cart-confirm-request", confirmOrder);

updateCartView();
initializeCatalog();
