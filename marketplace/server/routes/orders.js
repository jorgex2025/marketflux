const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, find } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/orders - Obtener órdenes del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    let orders;
    
    if (req.user.role === 'admin') {
      // Admin puede ver todas las órdenes
      orders = await getAll('orders');
    } else if (req.user.role === 'seller') {
      // Vendedor ve órdenes que contienen sus productos
      orders = await getAll('orders');
      const ordersWithSeller = [];
      for (const order of orders) {
        let hasItem = false;
        for (const item of order.items) {
          const product = await getById('products', item.productId);
          if (product && product.sellerId === req.user.id) {
            hasItem = true;
            break;
          }
        }
        if (hasItem) ordersWithSeller.push(order);
      }
      orders = ordersWithSeller;
    } else {
      // Comprador ve sus propias órdenes
      orders = await find('orders', { userId: req.user.id });
    }
    
    // Ordenar por fecha más reciente
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes'
    });
  }
});

// GET /api/orders/:id - Obtener una orden por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await getById('orders', req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      // Verificar si es vendedor de algún producto en la orden
      let isSeller = false;
      for (const item of order.items) {
        const product = await getById('products', item.productId);
        if (product && product.sellerId === req.user.id) {
          isSeller = true;
          break;
        }
      }
      
      if (!isSeller) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta orden'
        });
      }
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden'
    });
  }
});

// POST /api/orders - Crear una nueva orden
router.post('/', authenticate, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Dirección de envío y método de pago son requeridos'
      });
    }
    
    // Obtener carrito del usuario
    const carts = await find('carts', { userId: req.user.id });
    const cart = carts[0];
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }
    
    // Verificar stock y preparar items de la orden
    const orderItems = [];
    let subtotal = 0;
    
    for (const item of cart.items) {
      const product = await getById('products', item.productId);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Producto ${item.productId} no encontrado`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}`
        });
      }
      
      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        image: product.images[0] || ''
      });
      
      subtotal += item.price * item.quantity;
    }
    
    // Calcular totales
    let shipping = 0;
    for (const item of orderItems) {
      const product = await getById('products', item.productId);
      shipping += (product?.shipping?.cost || 0);
    }
    
    const tax = subtotal * 0.16;
    const total = subtotal + shipping + tax;
    
    // Crear orden
    const newOrder = await add('orders', {
      userId: req.user.id,
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      status: 'pending',
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      trackingNumber: null
    });
    
    // Actualizar stock de productos
    for (const item of cart.items) {
      const product = await getById('products', item.productId);
      if (product) {
        await update('products', item.productId, {
          stock: product.stock - item.quantity,
          sold: product.sold + item.quantity
        });
      }
    }
    
    // Vaciar carrito
    await update('carts', cart.id, { items: [] });
    
    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: newOrder
    });
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden'
    });
  }
});

// PUT /api/orders/:id/status - Actualizar estado de la orden
router.put('/:id/status', authenticate, authorize('seller', 'admin'), async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`
      });
    }
    
    const order = await getById('orders', req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin') {
      let isSeller = false;
      for (const item of order.items) {
        const product = await getById('products', item.productId);
        if (product && product.sellerId === req.user.id) {
          isSeller = true;
          break;
        }
      }
      
      if (!isSeller) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar esta orden'
        });
      }
    }
    
    const updates = { status };
    if (trackingNumber) {
      updates.trackingNumber = trackingNumber;
    }
    
    // Actualizar estado de pago si se cancela
    if (status === 'cancelled') {
      updates.paymentStatus = 'refunded';
      
      // Restaurar stock
      for (const item of order.items) {
        const product = await getById('products', item.productId);
        if (product) {
          await update('products', item.productId, {
            stock: product.stock + item.quantity,
            sold: product.sold - item.quantity
          });
        }
      }
    }
    
    const updatedOrder = await update('orders', req.params.id, updates);
    
    res.json({
      success: true,
      message: 'Estado de orden actualizado',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de orden'
    });
  }
});

// PUT /api/orders/:id/payment - Actualizar estado de pago
router.put('/:id/payment', authenticate, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Estado de pago inválido. Estados válidos: ${validStatuses.join(', ')}`
      });
    }
    
    const order = await getById('orders', req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    // Solo admin o dueño de la orden pueden actualizar
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta orden'
      });
    }
    
    const updatedOrder = await update('orders', req.params.id, { paymentStatus });
    
    res.json({
      success: true,
      message: 'Estado de pago actualizado',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de pago'
    });
  }
});

module.exports = router;
