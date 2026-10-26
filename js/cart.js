export const DISCOUNT_THRESHOLD = 300000;
export const DISCOUNT_RATE = 0.1;

export function calculateTotals(lines, productsById) {
    const units = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) =>{
        const product = productsById.get(line.id);
        return sum + (product ? product.price * line.quantity : 0);
    }, 0);
    const discount = subtotal >= DISCOUNT_THRESHOLD ? Math.round(subtotal * DISCOUNT_RATE) : 0;

    return { units, subtotal, discount, total: subtotal - discount };
}
export function validateCart(lines, productsById) {
  if (lines.length === 0) {
    return { valid: false, reason: "El carrito está vacío. Agrega al menos un producto antes de confirmar." };
  }

  for (const line of lines) {
    const product = productsById.get(line.id);
    if (!product || !product.active || product.stock < 1) {
      return { valid: false, reason: `“${product?.name ?? "Un producto"}” ya no está disponible. Actualiza el carrito antes de confirmar.` };
    }
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > product.stock) {
      return { valid: false, reason: `La cantidad de “${product.name}” ya no es válida para las existencias disponibles.` };
    }
  }

  return { valid: true };
}