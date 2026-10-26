export const CART_STORAGE_KEY = "tecnostock-cart-v1";

export function restoreCart(productsById) {
  let serialized;
  try {
    serialized = localStorage.getItem(CART_STORAGE_KEY);
  } catch (error) {
    return { lines: [], warning: "No se pudo leer el almacenamiento local; el carrito inicia vacío." };
  }

  if (serialized === null) {
    return { lines: [], warning: "" };
  }

  let saved;
  try {
    saved = JSON.parse(serialized);
  } catch (error) {
    return { lines: [], warning: "El carrito guardado estaba dañado y se inició uno vacío." };
  }

  if (!Array.isArray(saved)) {
    return { lines: [], warning: "El formato del carrito guardado no era válido y se inició uno vacío." };
  }

  const lines = [];
  const seen = new Set();
  let discarded = 0;
  for (const item of saved) {
    if (!item || !Number.isSafeInteger(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seen.has(item.id)) {
      discarded += 1;
      continue;
    }

    const product = productsById.get(item.id);
    if (!product || !product.active || product.stock < 1 || item.quantity > product.stock) {
      discarded += 1;
      continue;
    }

    lines.push({ id: item.id, quantity: item.quantity });
    seen.add(item.id);
  }

  return {
    lines,
    warning: discarded > 0 ? `Se omitieron ${discarded} línea(s) inválida(s) del carrito guardado.` : ""
  };
}

export function saveCart(lines) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines.map(({ id, quantity }) => ({ id, quantity }))));
    return true;
  } catch (error) {
    return false;
  }
}
