import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Checkout.css';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true); // Track if component is still mounted
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'card', // card, paypal, cash
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: ''
  });

  useEffect(() => {
    // Cleanup on unmount to prevent race conditions
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para finalizar la compra');
      navigate('/login');
    } else if (!cart.items || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, cart, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
      toast.error('Por favor completa la dirección de envío');
      return;
    }

    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCvc) {
        toast.error('Por favor completa los datos de la tarjeta');
        return;
      }
    }

    setLoading(true);

    try {
      // Formatear dirección como objeto
      const shippingAddress = {
        name: user?.name || '',
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      };
      
      // Llamada al backend
      const response = await axios.post('/api/orders', {
        shippingAddress,
        paymentMethod: formData.paymentMethod
      });

      if (response.data.success) {
        // Simular tiempo de pasarela de pago
        toast.success('Procesando pago...');
        
        setTimeout(() => {
          // Only navigate if component is still mounted (user didn't leave)
          if (!isMountedRef.current) return;
          
          clearCart();
          toast.success('¡Compra completada con éxito!');
          navigate('/profile');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al procesar la orden:', error);
      toast.error(error.response?.data?.message || 'Error al procesar la orden');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const items = cart.items || [];
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Show loading or empty state instead of silent null
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container checkout-container">
          <div className="empty-cart-message">
            <h2>Tu carrito está vacío</h2>
            <p>Agrega productos para continuar con la compra</p>
            <button onClick={() => navigate('/products')} className="btn-primary">
              Ver productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container checkout-container">
        <h1 className="checkout-title">Finalizar Compra</h1>
        
        <div className="checkout-content">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* Dirección de Envío */}
            <div className="checkout-section">
              <h2>1. Dirección de Envío</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Calle y número</label>
                  <input type="text" name="street" value={formData.street} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Estado / Provincia</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Código Postal</label>
                  <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="checkout-section">
              <h2>2. Método de Pago</h2>
              
              <div className="payment-methods-options">
                <label className={`payment-option ${formData.paymentMethod === 'card' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleInputChange} />
                  <span>💳 Tarjeta de Crédito/Débito</span>
                </label>
                <label className={`payment-option ${formData.paymentMethod === 'paypal' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="paypal" checked={formData.paymentMethod === 'paypal'} onChange={handleInputChange} />
                  <span>🅿️ PayPal</span>
                </label>
              </div>

              {formData.paymentMethod === 'card' && (
                <div className="card-details form-grid">
                  <div className="form-group full-width">
                    <label>Nombre en la tarjeta</label>
                    <input type="text" name="cardName" value={formData.cardName} onChange={handleInputChange} placeholder="EJ: JUAN PEREZ" />
                  </div>
                  <div className="form-group full-width">
                    <label>Número de Tarjeta</label>
                    <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="0000 0000 0000 0000" maxLength="19" />
                  </div>
                  <div className="form-group">
                    <label>Vencimiento (MM/AA)</label>
                    <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleInputChange} placeholder="MM/AA" maxLength="5" />
                  </div>
                  <div className="form-group">
                    <label>CVC</label>
                    <input type="password" name="cardCvc" value={formData.cardCvc} onChange={handleInputChange} placeholder="123" maxLength="4" />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn-confirm-order" disabled={loading}>
              {loading ? 'Procesando...' : `Confirmar Pago de $${calculateTotal().toLocaleString()}`}
            </button>
          </form>

          {/* Resumen del pedido */}
          <div className="checkout-sidebar">
            <div className="checkout-summary-box">
              <h2>Resumen ({cart.items.length} productos)</h2>
              <div className="summary-items">
                {cart.items.map(item => (
                  <div key={item.productId} className="summary-item">
                    <img src={item.image || '/placeholder.png'} alt={item.name} />
                    <div className="summary-item-info">
                      <p className="summary-item-name">{item.name}</p>
                      <p className="summary-item-qty">Cant: {item.quantity}</p>
                    </div>
                    <div className="summary-item-price">
                      ${(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="summary-totals">
                <div className="summary-row">
                  <span>Productos</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Envío</span>
                  <span className="free-shipping">Gratis</span>
                </div>
                <div className="summary-row grand-total">
                  <span>Total a pagar</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="security-badges">
              <p>🔒 Tu pago es procesado de forma segura.</p>
              <p>🛡️ Compra Protegida, recibe el producto que esperabas o te devolvemos tu dinero.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
