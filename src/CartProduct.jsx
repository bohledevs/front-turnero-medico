function CartProduct({ product, onAdd, children }) {
  const isAvailable = product.stock > 0

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img className="product-image" src={product.image} alt={product.imageAlt} />
        {children && <span className="product-badge">{children}</span>}
        {!isAvailable && <span className="product-badge sold-out">Agotado</span>}
      </div>
      <div className="product-details">
        <div className="product-copy">
          <p className="product-category">{product.category}</p>
          <h2>{product.name}</h2>
          <p className="product-description">{product.description}</p>
        </div>
        <div className="product-buy-row">
          <p className="product-price">${product.price.toLocaleString('es-AR')}</p>
          <button
            className="add-button"
            type="button"
            onClick={() => onAdd(product)}
            disabled={!isAvailable}
            aria-label={`Agregar ${product.name} a la bolsa`}
          >
            {isAvailable ? 'Agregar +' : 'Sin stock'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default CartProduct