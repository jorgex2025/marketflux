import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart, FaBolt, FaBalanceScale } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

const ProductCard = ({ product, style }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.includes(product.id);
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== product.id);
      toast.success('Eliminado de favoritos');
    } else {
      newFavorites = [...favorites, product.id];
      toast.success('Agregado a favoritos');
    }
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleAddToCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const compareProducts = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    if (compareProducts.length >= 4) {
      toast.error('Máximo 4 productos para comparar');
      return;
    }
    if (compareProducts.includes(product.id)) {
      toast.error('Ya está en comparación');
      return;
    }
    const newCompare = [...compareProducts, product.id];
    localStorage.setItem('compareProducts', JSON.stringify(newCompare));
    toast.success('Agregado a comparación');
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const soldPercentage = Math.min(Math.round(((product.sold || 5) / (product.stock + (product.sold || 5))) * 100), 95);
  const isLightningDeal = product.featured && discount > 15;

  const checkFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(product.id);
  };

  return (
    <Link to={`/products/${product.id}`} className={`product-card ${isLightningDeal ? 'lightning-deal' : ''}`} style={style}>
      <div className="product-image-container">
        <img
          src={product.images?.[0] || '/placeholder.png'}
          alt={product.name}
          className="product-image"
        />
        {discount > 0 && (
          <div className="product-badges">
            <span className="product-discount">-{discount}%</span>
            {isLightningDeal && <span className="lightning-badge">Oferta Lux</span>}
          </div>
        )}
        <button 
          className={`product-favorite ${checkFavorite() ? 'active' : ''}`} 
          aria-label="Favorito"
          onClick={handleToggleFavorite}
        >
          <FaHeart />
        </button>
        <button 
          className="product-compare" 
          aria-label="Comparar"
          onClick={handleAddToCompare}
        >
          <FaBalanceScale />
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>

        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={i < Math.round(product.rating || 0) ? 'star' : 'star-empty'}
            />
          ))}
          <span className="rating-count">({product.reviews || 0})</span>
        </div>

        <div className="product-price-container">
          <div className="product-price">
            {product.originalPrice && (
              <span className="price-old">${product.originalPrice.toLocaleString()}</span>
            )}
            <span className="price-current">${product.price.toLocaleString()}</span>
          </div>
          {product.stock < 15 && (
            <div className="product-stock-bar">
              <div className="stock-fill" style={{ width: `${soldPercentage}%` }}></div>
              <span className="stock-text">{soldPercentage}% vendido</span>
            </div>
          )}
        </div>

        <div className="product-footer">
          <div className="product-tags">
            {product.shipping?.free && (
              <span className="product-shipping">Envío gratis</span>
            )}
            {product.stock > 10 && (
              <span className="badge-full">
                <FaBolt /> FULL
              </span>
            )}
          </div>
          <button className="add-to-cart-mini" onClick={handleAddToCart} title="Agregar al carrito">
            <FaShoppingCart />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

