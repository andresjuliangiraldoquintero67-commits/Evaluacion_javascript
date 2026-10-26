const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export class ShoppingCart extends HTMLElement {
  set state(value) {
    this._state = value;
    this.render();
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  render() {
    const state = this._state;
    this.replaceChildren();
    if (!state) return;

    const { lines, productsById, totals } = state;
    if (lines.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-cart";
      empty.textContent = "Tu carrito está vacío. Agrega productos del catálogo para preparar un pedido.";
      this.append(empty);
    } else {
      const list = document.createElement("ul");
      list.className = "cart-lines";
      for (const line of lines) {
        const product = productsById.get(line.id);
        if (!product) continue;

        const item = document.createElement("li");
        item.className = "cart-line";
        const info = document.createElement("div");
        info.className = "cart-line-info";
        const name = document.createElement("strong");
        name.textContent = product.name;
        const price = document.createElement("span");
        price.className = "cart-line-price";
        price.textContent = `${currency.format(product.price)} c/u`;
        const subtotal = document.createElement("span");
        subtotal.className = "cart-line-subtotal";
        subtotal.textContent = currency.format(product.price * line.quantity);
        info.append(name, price, subtotal);

        const controls = document.createElement("div");
        controls.className = "quantity-controls";
        controls.setAttribute("aria-label", `Cantidad de ${product.name}`);
        const decrease = document.createElement("button");
        decrease.className = "quantity-button";
        decrease.type = "button";
        decrease.textContent = "−";
        decrease.setAttribute("aria-label", `Disminuir ${product.name}`);
        decrease.disabled = line.quantity <= 1;
        decrease.addEventListener("click", () => this.emit("cart-quantity-request", { id: line.id, delta: -1 }));
        const quantity = document.createElement("span");
        quantity.className = "quantity-value";
        quantity.textContent = String(line.quantity);
        quantity.setAttribute("aria-live", "polite");
        const increase = document.createElement("button");
        increase.className = "quantity-button";
        increase.type = "button";
        increase.textContent = "+";
        increase.setAttribute("aria-label", `Aumentar ${product.name}`);
        increase.disabled = line.quantity >= product.stock || !product.active;
        increase.addEventListener("click", () => this.emit("cart-quantity-request", { id: line.id, delta: 1 }));

        const remove = document.createElement("button");
        remove.className = "remove-button";
        remove.type = "button";
        remove.textContent = "Eliminar";
        remove.setAttribute("aria-label", `Eliminar ${product.name} del carrito`);
        remove.addEventListener("click", () => this.emit("cart-remove-request", { id: line.id }));
        controls.append(decrease, quantity, increase, remove);
        item.append(info, controls);
        list.append(item);
      }
      this.append(list);
    }

    const summary = document.createElement("dl");
    summary.className = "cart-summary";
    this.appendSummaryRow(summary, "Subtotal", totals.subtotal);
    this.appendSummaryRow(summary, "Descuento", -totals.discount, "discount-value");
    this.appendSummaryRow(summary, "Total", totals.total, "total-value");
    this.append(summary);

    const actions = document.createElement("div");
    actions.className = "cart-actions";
    const clear = document.createElement("button");
    clear.className = "button button-secondary";
    clear.type = "button";
    clear.textContent = "Vaciar carrito";
    clear.disabled = lines.length === 0;
    clear.addEventListener("click", () => this.emit("cart-clear-request"));
    const confirm = document.createElement("button");
    confirm.className = "button button-primary";
    confirm.type = "button";
    confirm.textContent = "Confirmar pedido";
    confirm.disabled = lines.length === 0;
    confirm.addEventListener("click", () => this.emit("cart-confirm-request"));
    actions.append(clear, confirm);
    this.append(actions);
  }

  appendSummaryRow(list, label, amount, valueClass = "") {
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    if (valueClass) value.className = valueClass;
    value.textContent = currency.format(Math.abs(amount));
    if (amount < 0) value.textContent = `−${value.textContent}`;
    list.append(term, value);
  }
}

customElements.define("shopping-cart", ShoppingCart);
