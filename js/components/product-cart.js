const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export class ProductCard extends HTMLElement {
  set product(value) {
    this._product = value;
    this.render();
  }

  render() {
    if (!this._product) return;

    const product = this._product;
    const available = product.active && product.stock > 0;
    this.className = "product-card";
    this.replaceChildren();

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category;

    const name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = product.name;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;

    const details = document.createElement("div");
    details.className = "product-details";
    const price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = currency.format(product.price);
    const stock = document.createElement("span");
    stock.className = available ? "stock-label" : "stock-label stock-unavailable";
    stock.textContent = !product.active ? "No disponible" : product.stock > 0 ? `${product.stock} disponibles` : "Agotado";
    details.append(price, stock);

    const button = document.createElement("button");
    button.className = "button button-primary add-button";
    button.type = "button";
    button.textContent = "Agregar al carrito";
    button.disabled = !available;
    button.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("product-add-request", {
        detail: { id: product.id },
        bubbles: true,
        composed: true
      }));
    });

    this.append(category, name, description, details, button);
  }
}

customElements.define("product-card", ProductCard);
