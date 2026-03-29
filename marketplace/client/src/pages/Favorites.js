import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import './Favorites.css';

const Favorites = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (favorites.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productsData = await Promise.all(
        favorites.map(async (id) => {
          try {
            const response = await axios.get(`/api/products/${id}`);
            return response.data.success ? response.data.data : null;
          } catch {
            return null;
          }
        })
      );

      setProducts(productsData.filter(p => p !== null));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (productId) => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = favorites.filter(id => id !== productId);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setProducts(products.filter(p => p.id !== productId));
    toast.success('Eliminado de favoritos');
  };

  const clearAllFavorites = () => {
    if (window.confirm('¿Eliminar todos los favoritos?')) {
      localStorage.setItem('favorites', JSON.stringify([]));
      setProducts([]);
      toast.success('Lista de favoritos limpiada');
    }
  };

  if (loading) {
    return (
      <div className="favorites-loading">
        <div className="spinner"></div>
        <p>Cargando favoritos...</p>
      </div>
    );
  }

  return (
    <div className="favorites-page container section-fade-in">
      <div className="favorites-header">
        <h1>Mis Favoritos</h1>
        <p>Productos guardados para más tarde</p>
        {products.length > 0 && (
          <button className="btn btn-secondary clear-btn" onClick={clearAllFavorites}>
            Limpiar todo
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="empty-favorites glass-card">
          <div className="empty-icon">❤️</div>
          <h2>Tu lista de favoritos está vacía</h2>
          <p>Explora nuestros productos y guarda los que más te gusten</p>
          <Link to="/products" className="btn btn-primary">Explorar Productos</Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {products.map(product => (
            <div key={product.id} className="favorite-item">
              <ProductCard product={product} />
              <button 
                className="remove-favorite-btn"
                onClick={() => handleRemoveFavorite(product.id)}
                title="Eliminar de favoritos"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;