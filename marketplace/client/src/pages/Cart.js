import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaShoppingBag, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, delta) => {
    const item = cart.items.find((item) => item.productId === productId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity >= 1) {
        updateQuantity(productId, newQuantity);
      }
    }
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para continuar con la compra');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-cart-icon">
          <FaShoppingBag />
        </div>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos para comenzar a comprar</p>
        <Link to="/products" className="btn btn-primary">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <Link to="/products" className="back-link">
            <FaArrowLeft /> Seguir comprando
          </Link>
          <h1>Carrito de compras</h1>
          <button onClick={handleClearCart} className="clear-cart-btn">
            Vaciar carrito
          </button>
        </div>

        <div className="cart-content">
          {/* Lista de productos */}
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.productId} className="cart-item">
                <img
                  src={item.product?.images?.[0] || item.image || '/placeholder.png'}
                  alt={item.product?.name || item.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <Link to={`/products/${item.productId}`} className="cart-item-title">
                    {item.product?.name || item.name}
                  </Link>
                  <div className="cart-item-price">
                    ${item.price.toLocaleString()}
                  </div>
                  <div className="cart-item-quantity">
                    <button
                      onClick={() => handleQuantityChange(item.productId, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.productId, 1)}>
                      <FaPlus />
                    </button>
                  </div>
                </div>
                <div className="cart-item-subtotal">
                  <span className="subtotal-label">Subtotal:</span>
                  <span className="subtotal-value">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.productId)}
                  className="remove-item-btn"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          {/* Resumen del carrito */}
          <div className="cart-summary">
            <h3>Resumen del pedido</h3>
            
            <div className="summary-row">
              <span>Subtotal ({items.length} productos)</span>
              <span>${(cart.subtotal || cart.total || 0).toLocaleString()}</span>
            </div>
            
            <div className="summary-row">
              <span>Envío</span>
              <span className="free-shipping">Gratis</span>
            </div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>${(cart.total || 0).toLocaleString()}</span>
            </div>

            <button onClick={handleCheckout} className="checkout-btn">
              Proceder al pago
            </button>

            <div className="payment-methods">
              <p>Métodos de pago aceptados:</p>
              <div className="payment-icons">
                <span>💳</span>
                <span>🏦</span>
                <span>📱</span>
              </div>
            </div>

            <div className="security-info">
              <p>🔒 Compra 100% segura</p>
              <p>Tus datos están protegidos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
