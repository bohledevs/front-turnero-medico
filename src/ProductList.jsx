import CartProduct from './CartProduct.jsx'

function ProductList({ products, onAdd }) {
  return products.length === 0 ? (
    <p className="empty-state">No hay productos para mostrar.</p>
  ) : (
    <div className="product-grid">
      {products.map((product) => (
        <CartProduct key={product.id} product={product} onAdd={onAdd}>
          {product.stock <= 3 && product.stock > 0 ? 'Quedan pocas' : null}
        </CartProduct>
      ))}
    </div>
  )
}

export default ProductList