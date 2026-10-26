export class ProductList extends HTMLElement {
  set products(value) {
    this._products = value;
    this.render();
  }

  render() {
    this.replaceChildren();
    const products = this._products ?? [];
    this.className = "product-grid";

    for (const product of products) {
      const card = document.createElement("product-card");
      card.product = product;
      this.append(card);
    }
  }
}

customElements.define("product-list", ProductList);
