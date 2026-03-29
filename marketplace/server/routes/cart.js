const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, find } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// GET /api/cart - Obtener carrito del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const carts = await find('carts', { userId: req.user.id });
    const cart = carts[0] || { id: null, items: [] };
    
    // Obtener información completa de los productos en el carrito
    const products = await getAll('products');
    const cartWithProducts = {
      ...cart,
      items: cart.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          product: product || null
        };
      }).filter(item => item.product !== null)
    };
    
    // Calcular totales
    const subtotal = cartWithProducts.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const shipping = cartWithProducts.items.reduce((sum, item) => {
      if (item.product && item.product.shipping) {
        return sum + (item.product.shipping.cost || 0);
      }
      return sum;
    }, 0);
    
    const tax = subtotal * 0.16; // 16% de impuesto
    const total = subtotal + shipping + tax;
    
    res.json({
      success: true,
      data: {
        ...cartWithProducts,
        subtotal: Math.round(subtotal * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito'
    });
  }
});

// POST /api/cart/add - Agregar producto al carrito
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto es requerido'
      });
    }
    
    // Verificar que el producto existe
    const product = await getById('products', productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Verificar stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }
    
    // Buscar o crear carrito del usuario
    let carts = await find('carts', { userId: req.user.id });
    let cart = carts[0];
    
    if (!cart) {
      // Crear nuevo carrito
      cart = await add('carts', {
        userId: req.user.id,
        items: []
      });
    }
    
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex > -1) {
      // Actualizar cantidad
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Agregar nuevo item
      cart.items.push({
        productId,
        quantity,
        price: product.price
      });
    }
    
    // Actualizar carrito
    await update('carts', cart.id, { items: cart.items });
    
    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      data: cart
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar al carrito'
    });
  }
});

// PUT /api/cart/update - Actualizar cantidad de un producto en el carrito
router.put('/update', authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto y cantidad son requeridos'
      });
    }
    
    // Buscar carrito del usuario
    const carts = await find('carts', { userId: req.user.id });
    const cart = carts[0];
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }
    
    // Verificar stock del producto
    const product = await getById('products', productId);
    if (product && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }
    
    // Actualizar cantidad o eliminar si es 0
    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.productId !== productId);
    } else {
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
      }
    }
    
    // Actualizar carrito
    await update('carts', cart.id, { items: cart.items });
    
    res.json({
      success: true,
      message: 'Carrito actualizado',
      data: cart
    });
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar carrito'
    });
  }
});

// DELETE /api/cart/remove/:productId - Eliminar producto del carrito
router.delete('/remove/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Buscar carrito del usuario
    const carts = await find('carts', { userId: req.user.id });
    const cart = carts[0];
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }
    
    // Eliminar producto del carrito
    cart.items = cart.items.filter(item => item.productId !== productId);
    
    // Actualizar carrito
    await update('carts', cart.id, { items: cart.items });
    
    res.json({
      success: true,
      message: 'Producto eliminado del carrito',
      data: cart
    });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar del carrito'
    });
  }
});

// DELETE /api/cart/clear - Vaciar carrito
router.delete('/clear', authenticate, async (req, res) => {
  try {
    // Buscar carrito del usuario
    const carts = await find('carts', { userId: req.user.id });
    const cart = carts[0];
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }
    
    // Vaciar carrito
    await update('carts', cart.id, { items: [] });
    
    res.json({
      success: true,
      message: 'Carrito vaciado',
      data: { ...cart, items: [] }
    });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito'
    });
  }
});

module.exports = router;
