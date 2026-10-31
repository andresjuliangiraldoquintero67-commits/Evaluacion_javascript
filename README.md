# TecnoStock

Tienda demostrativa de suministros tecnológicos hecha con HTML, CSS, JavaScript nativo y Web Components. El catálogo se solicita con `fetch()` desde `data/products.json`; no se necesita instalar dependencias.

## Ejecutar localmente

`fetch()` requiere servir los archivos mediante HTTP local. Desde esta carpeta, ejecuta:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` en el navegador. No abras `index.html` directamente como archivo.

## Funcionalidad

- Búsqueda por nombre o descripción, filtro por categoría y disponibilidad y orden por precio.
- Carrito con límites de inventario, subtotales, descuento del 10 % desde $300.000 COP y persistencia local.
- Recuperación validada del carrito frente a cambios del catálogo o datos guardados inválidos.
- Checkout en modal para revisar productos, subtotal, descuento y total antes de confirmar el pedido; genera un identificador y no procesa pagos ni modifica el inventario.
- Mensajes diferenciados de carga, error de catálogo, resultados vacíos y confirmación.

El almacenamiento del carrito usa la clave `tecnostock-cart-v1` de `localStorage`.
