import { useState } from 'react'
import ProductList from './ProductList.jsx'
import products from './products.json'
import './Storefront.css'

function App() {
  const [cartCount, setCartCount] = useState(0)

  const addToCart = () => {
    setCartCount((count) => count + 1)
  }

  return (
    <main className="storefront">
      <header className="site-header">
        <a className="wordmark" href="#inicio" aria-label="Norte, inicio">
          norte<span>.</span>
        </a>
        <p className="header-note">Objetos para todos los días</p>
        <div className="cart-summary" aria-live="polite">
          <span aria-hidden="true">Bolsa</span>
          <span className="cart-count">{cartCount}</span>
        </div>
      </header>

      <section className="catalog" id="inicio" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">Selección de temporada <span>—</span> 04 piezas</p>
            <h1 id="catalog-title">Pequeños objetos,<br />grandes días.</h1>
          </div>
          <p className="catalog-intro">
            Diseño útil, materiales honestos y esos detalles que hacen más lindo lo cotidiano.
          </p>
        </div>

        <ProductList products={products} onAdd={addToCart} />
      </section>

      <footer className="site-footer">
        <span>norte<span className="footer-dot">.</span></span>
        <span>Hecho para acompañarte.</span>
        <span>{cartCount === 1 ? '1 artículo en tu bolsa' : `${cartCount} artículos en tu bolsa`}</span>
      </footer>
    </main>
  )
}

export default App
