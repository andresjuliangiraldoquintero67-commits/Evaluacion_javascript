function isValidProduct(product) {
  return product !== null
    && typeof product === "object"
    && Number.isSafeInteger(product.id)
    && typeof product.name === "string"
    && product.name.trim().length > 0
    && typeof product.category === "string"
    && product.category.trim().length > 0
    && Number.isFinite(product.price)
    && product.price > 0
    && Number.isSafeInteger(product.stock)
    && product.stock >= 0
    && typeof product.description === "string"
    && typeof product.active === "boolean";
}

export async function loadProducts() {
  let response;
  try {
    response = await fetch("./data/products.json", { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error("No fue posible conectar con el catálogo. Comprueba que la aplicación esté abierta desde un servidor local e inténtalo de nuevo.", { cause: error });
  }

  if (!response.ok) {
    throw new Error(`El catálogo respondió con un error HTTP (${response.status}). Inténtalo de nuevo.`);
  }

  let products;
  try {
    products = await response.json();
  } catch (error) {
    throw new Error("El archivo del catálogo no contiene JSON válido.", { cause: error });
  }

  if (!Array.isArray(products) || !products.every(isValidProduct)) {
    throw new Error("Los datos del catálogo no tienen el formato esperado. Revisa el archivo products.json.");
  }

  const ids = new Set(products.map((product) => product.id));
  if (ids.size !== products.length) {
    throw new Error("El catálogo contiene identificadores de producto repetidos.");
  }

  return products.map((product) => ({ ...product }));
}