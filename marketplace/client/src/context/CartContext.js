import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const prevCartRef = useRef(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cart');
      if (response.data.success && response.data.data) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar carrito del usuario cuando esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Cargar carrito del localStorage si no está autenticado
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          setCart({ items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 });
        }
      }
    }
  }, [isAuthenticated, fetchCart]);

  // Guardar carrito en localStorage cuando no está autenticado (solo si hay cambios reales)
  useEffect(() => {
    // Skip if authenticated (cart is stored on server)
    if (isAuthenticated) return;
    
    // Skip if cart is same as previous (prevents infinite loop)
    if (prevCartRef.current && JSON.stringify(prevCartRef.current) === JSON.stringify(cart)) return;
    
    prevCartRef.current = cart;
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, isAuthenticated]);

  const addToCart = async (product, quantity = 1) => {
    try {
      if (isAuthenticated) {
        const response = await axios.post('/api/cart/add', {
          productId: product.id,
          quantity,
        });
        if (response.data.success && response.data.data) {
          // Re-fetch full cart to get product details and totals
          await fetchCart();
        }
      } else {
        // Agregar al carrito local
        setCart((prevCart) => {
          const items = prevCart.items || [];
          const existingItem = items.find(
            (item) => item.productId === product.id
          );

          let newItems;
          if (existingItem) {
            newItems = items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [
              ...items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || '/placeholder.png',
                quantity,
              },
            ];
          }

          const newTotal = newItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return { items: newItems, subtotal: newTotal, shipping: 0, tax: 0, total: newTotal };
        });
      }

      toast.success('Producto agregado al carrito');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al agregar al carrito';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity < 1) {
        return removeFromCart(productId);
      }

      if (isAuthenticated) {
        await axios.put('/api/cart/update', { productId, quantity });
        await fetchCart();
      } else {
        setCart((prevCart) => {
          const items = prevCart.items || [];
          const newItems = items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          );

          const newTotal = newItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return { items: newItems, subtotal: newTotal, shipping: 0, tax: 0, total: newTotal };
        });
      }

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar cantidad';
      toast.error(message);
      return { success: false, message };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      if (isAuthenticated) {
        await axios.delete(`/api/cart/remove/${productId}`);
        await fetchCart();
      } else {
        setCart((prevCart) => {
          const items = prevCart.items || [];
          const newItems = items.filter(
            (item) => item.productId !== productId
          );

          const newTotal = newItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return { items: newItems, subtotal: newTotal, shipping: 0, tax: 0, total: newTotal };
        });
      }

      toast.success('Producto eliminado del carrito');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar del carrito';
      toast.error(message);
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        await axios.delete('/api/cart/clear');
      }
      setCart({ items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 });
      toast.success('Carrito vaciado');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al vaciar carrito';
      toast.error(message);
      return { success: false, message };
    }
  };

  const getCartCount = () => {
    const items = cart.items || [];
    return items.reduce((count, item) => count + (item.quantity || 0), 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
    fetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
