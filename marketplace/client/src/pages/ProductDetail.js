import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaShoppingCart, FaHeart, FaShare, FaTruck, FaShieldAlt, FaUndo, FaUser, FaBalanceScale } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart } = useCart();

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      if (response.data.success && response.data.data) {
        setProduct(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
      toast.error('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    checkFavorite();
  }, [id, fetchProduct]);

  const checkFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(id));
  };

  const handleToggleFavorite = async () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      let newFavorites;
      
      if (isFavorite) {
        newFavorites = favorites.filter(f => f !== id);
        setIsFavorite(false);
        toast.success('Eliminado de favoritos');
      } else {
        newFavorites = [...favorites, id];
        setIsFavorite(true);
        toast.success('Agregado a favoritos');
      }
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      toast.error('Error al actualizar favoritos');
    }
  };

  const handleAddToCompare = () => {
    const compareProducts = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    if (compareProducts.length >= 4) {
      toast.error('Máximo 4 productos para comparar');
      return;
    }
    if (compareProducts.includes(id)) {
      toast.error('Este producto ya está en comparación');
      return;
    }
    const newCompare = [...compareProducts, id];
    localStorage.setItem('compareProducts', JSON.stringify(newCompare));
    toast.success('Agregado a comparación');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para dejar una reseña');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const response = await axios.post(`/api/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });
      
      if (response.data.success) {
        toast.success('Reseña publicada exitosamente');
        setShowReviewForm(false);
        setReviewComment('');
        setReviewRating(5);
        fetchProduct();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al publicar reseña';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Producto no encontrado</h2>
        <Link to="/products" className="btn btn-primary">
          Ver productos
        </Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/products">Productos</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-content">
          {/* Galería de imágenes */}
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={product.images?.[selectedImage] || '/placeholder.png'}
                alt={product.name}
              />
              {discount > 0 && (
                <span className="discount-badge">-{discount}%</span>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-list">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>

            <div className="product-rating">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.round(product.rating || 0) ? 'star' : 'star-empty'}
                />
              ))}
              <span className="rating-value">{product.rating || 0}</span>
              <span className="review-count">({(Array.isArray(product.reviews) ? product.reviews.length : product.reviews) || 0} reseñas)</span>
            </div>

            <div className="product-price">
              {product.originalPrice && (
                <span className="price-old">${product.originalPrice.toLocaleString()}</span>
              )}
              <span className="price-current">${product.price.toLocaleString()}</span>
              {discount > 0 && (
                <span className="price-discount">{discount}% OFF</span>
              )}
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-meta">
              <div className="meta-item">
                <span className="meta-label">Stock:</span>
                <span className={`meta-value ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                </span>
              </div>
              {product.seller && (
                <div className="meta-item">
                  <span className="meta-label">Vendedor:</span>
                  <span className="meta-value">{product.seller.name}</span>
                </div>
              )}
            </div>

            {/* Selector de cantidad */}
            <div className="quantity-selector">
              <span className="quantity-label">Cantidad:</span>
              <div className="quantity-controls">
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                  +
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="product-actions">
              <button
                className="btn btn-primary add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <FaShoppingCart />
                Agregar al carrito
              </button>
              <button 
                className={`btn btn-secondary favorite ${isFavorite ? 'active' : ''}`}
                onClick={handleToggleFavorite}
              >
                <FaHeart />
              </button>
              <button className="btn btn-secondary share" onClick={handleShare}>
                <FaShare />
              </button>
              <button className="btn btn-secondary compare" onClick={handleAddToCompare} title="Comparar">
                <FaBalanceScale />
              </button>
            </div>

            {/* Características */}
            <div className="product-features">
              <div className="feature">
                <FaTruck />
                <div>
                  <h4>Envío gratis</h4>
                  <p>En compras mayores a $50</p>
                </div>
              </div>
              <div className="feature">
                <FaShieldAlt />
                <div>
                  <h4>Compra protegida</h4>
                  <p>Tu dinero está seguro</p>
                </div>
              </div>
              <div className="feature">
                <FaUndo />
                <div>
                  <h4>Devoluciones</h4>
                  <p>30 días para devolver</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Especificaciones */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="product-specifications">
            <h2>Especificaciones</h2>
            <table className="specs-table">
              <tbody>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reseñas */}
        <div className="product-reviews">
          <div className="reviews-header">
            <h2>Reseñas de Clientes</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowReviewForm(!showReviewForm)}
              disabled={!isAuthenticated}
            >
              {isAuthenticated ? 'Escribir Reseña' : 'Inicia sesión para reseñar'}
            </button>
          </div>

          {showReviewForm && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <div className="rating-input">
                <label>Tu calificación:</label>
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={star <= reviewRating ? 'star active' : 'star'}
                      onClick={() => setReviewRating(star)}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Cuéntanos tu experiencia con este producto..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows="4"
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                  {submittingReview ? 'Publicando...' : 'Publicar Reseña'}
                </button>
              </div>
            </form>
          )}

          <div className="reviews-list">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review, index) => (
                <div key={review.id || index} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        <FaUser />
                      </div>
                      <div>
                        <span className="reviewer-name">{review.userName || 'Cliente'}</span>
                        <span className="review-date">
                          {new Date(review.createdAt || Date.now()).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? 'star' : 'star-empty'} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                </div>
              ))
            ) : (
              <p className="no-reviews">Aún no hay reseñas para este producto. ¡Sé el primero en opinar!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
