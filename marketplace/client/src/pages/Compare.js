import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaChartBar, FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import './Compare.css';

const Compare = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productIds, setProductIds] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    setProductIds(savedIds);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedProducts = await Promise.all(
          productIds.map(async (id) => {
            try {
              const response = await axios.get(`/api/products/${id}`);
              return response.data.success ? response.data.data : null;
            } catch {
              return null;
            }
          })
        );
        setProducts(fetchedProducts.filter(p => p !== null));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productIds]);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get(`/api/products?search=${searchQuery}&limit=5`);
        const filtered = (response.data.products || []).filter(
          p => !productIds.includes(p.id) && products.length < 4
        );
        setSuggestions(filtered);
      } catch (error) {
        console.error('Error searching:', error);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, productIds, products.length]);

  const addToCompare = (productId) => {
    if (productIds.length >= 4) {
      return;
    }
    const newIds = [...productIds, productId];
    setProductIds(newIds);
    localStorage.setItem('compareProducts', JSON.stringify(newIds));
    setSearchQuery('');
    setSuggestions([]);
  };

  const removeFromCompare = (productId) => {
    const newIds = productIds.filter(id => id !== productId);
    setProductIds(newIds);
    localStorage.setItem('compareProducts', JSON.stringify(newIds));
  };

  const clearAll = () => {
    setProductIds([]);
    localStorage.setItem('compareProducts', JSON.stringify([]));
  };

  const specs = useMemo(() => {
    const allSpecs = new Set();
    products.forEach(p => {
      if (p.specifications) {
        Object.keys(p.specifications).forEach(key => allSpecs.add(key));
      }
    });
    return Array.from(allSpecs);
  }, [products]);

  if (loading) {
    return (
      <div className="compare-loading">
        <div className="spinner"></div>
        <p>Cargando comparación...</p>
      </div>
    );
  }

  return (
    <div className="compare-page container section-fade-in">
      <div className="compare-header">
        <h1>Comparar Productos</h1>
        <p>Analiza hasta 4 productos lado a lado</p>
        {productIds.length > 0 && (
          <button className="btn btn-secondary" onClick={clearAll}>
            Limpiar todo
          </button>
        )}
      </div>

      {productIds.length < 4 && (
        <div className="compare-search">
          <input
            type="text"
            placeholder="Buscar producto para agregar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map(product => (
                <button key={product.id} onClick={() => addToCompare(product.id)}>
                  <img src={product.images?.[0]} alt={product.name} />
                  <span>{product.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-compare glass-card">
          <div className="empty-icon"><FaChartBar /></div>
          <h2>No hay productos para comparar</h2>
          <p>Agrega productos desde su página de detalle o busca aquí</p>
          <Link to="/products" className="btn btn-primary">Ver Productos</Link>
        </div>
      ) : (
        <div className="compare-table-container">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="sticky-col">Producto</th>
                {products.map(product => (
                  <th key={product.id}>
                    <button className="remove-btn" onClick={() => removeFromCompare(product.id)}>
                      <FaTimes />
                    </button>
                    <Link to={`/products/${product.id}`}>
                      <img src={product.images?.[0]} alt={product.name} />
                    </Link>
                    <Link to={`/products/${product.id}`} className="product-name">
                      {product.name}
                    </Link>
                    {productIds.indexOf(product.id) > 0 && (
                      <button className="arrow-btn left" onClick={() => {
                        const idx = productIds.indexOf(product.id);
                        const newIds = [...productIds];
                        [newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]];
                        setProductIds(newIds);
                        localStorage.setItem('compareProducts', JSON.stringify(newIds));
                      }}>
                        <FaArrowLeft />
                      </button>
                    )}
                    {productIds.indexOf(product.id) < 3 && productIds.indexOf(product.id) !== -1 && productIds[productIds.indexOf(product.id) + 1] && (
                      <button className="arrow-btn right" onClick={() => {
                        const idx = productIds.indexOf(product.id);
                        const newIds = [...productIds];
                        [newIds[idx], newIds[idx + 1]] = [newIds[idx + 1], newIds[idx]];
                        setProductIds(newIds);
                        localStorage.setItem('compareProducts', JSON.stringify(newIds));
                      }}>
                        <FaArrowRight />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="price-row">
                <td>Precio</td>
                {products.map(product => (
                  <td key={product.id}>
                    <span className="current-price">${product.price.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className="old-price">${product.originalPrice.toLocaleString()}</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Rating</td>
                {products.map(product => (
                  <td key={product.id}>
                    <div className="rating-display">
                      <FaStar className="star-icon" />
                      <span>{product.rating || 0}</span>
                      <span className="review-count">({product.reviews || 0})</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Stock</td>
                {products.map(product => (
                  <td key={product.id}>
                    <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                      {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Envío</td>
                {products.map(product => (
                  <td key={product.id}>
                    <span className={product.shipping?.free ? 'free-shipping' : ''}>
                      {product.shipping?.free ? 'Envío gratis' : `$${product.shipping?.cost || 0}`}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Vendedor</td>
                {products.map(product => (
                  <td key={product.id}>
                    {product.seller?.name || 'N/A'}
                  </td>
                ))}
              </tr>
              {specs.map(spec => (
                <tr key={spec}>
                  <td>{spec}</td>
                  {products.map(product => (
                    <td key={product.id}>
                      {product.specifications?.[spec] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="action-row">
                <td></td>
                {products.map(product => (
                  <td key={product.id}>
                    <Link to={`/products/${product.id}`} className="btn btn-primary">
                      Ver Detalle
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Compare;