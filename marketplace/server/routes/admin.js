const express = require('express');
const router = express.Router();
const { getAll, getById, update, remove } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

// Todas las rutas de admin requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/dashboard - Estadísticas del dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const users = await getAll('users');
    const products = await getAll('products');
    const orders = await getAll('orders');
    const categories = await getAll('categories');
    
    // Estadísticas de usuarios
    const totalUsers = users.length;
    const buyers = users.filter(u => u.role === 'buyer').length;
    const sellers = users.filter(u => u.role === 'seller').length;
    const admins = users.filter(u => u.role === 'admin').length;
    
    // Estadísticas de productos
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    
    // Estadísticas de órdenes
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    // Estadísticas financieras
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
    
    const pendingPayments = orders
      .filter(o => o.paymentStatus === 'pending')
      .reduce((sum, o) => sum + o.total, 0);
    
    // Productos más vendidos
    const topProducts = [...products]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        sold: p.sold,
        revenue: p.sold * p.price
      }));
    
    // Vendedores con más ventas
    const topSellers = users
      .filter(u => u.role === 'seller')
      .map(seller => {
        const sellerProducts = products.filter(p => p.sellerId === seller.id);
        const totalSales = sellerProducts.reduce((sum, p) => sum + p.sold, 0);
        const revenue = sellerProducts.reduce((sum, p) => sum + (p.sold * p.price), 0);
        return {
          id: seller.id,
          name: seller.storeName || seller.name,
          totalSales,
          revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Órdenes recientes
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          buyers,
          sellers,
          admins
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          outOfStock
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        financial: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingPayments: Math.round(pendingPayments * 100) / 100
        },
        topProducts,
        topSellers,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// GET /api/admin/users - Gestión de usuarios
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    
    let users = await getAll('users');
    
    // Filtrar por rol
    if (role) {
      users = users.filter(u => u.role === role);
    }
    
    // Buscar por nombre o email
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Remover contraseñas
    users = users.map(({ password, ...user }) => user);
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = users.length;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
});

// GET /api/admin/products - Gestión de productos
router.get('/products', async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query;
    
    let products = await getAll('products');
    
    // Filtrar por categoría
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    // Filtrar por estado
    if (status) {
      products = products.filter(p => p.status === status);
    }
    
    // Buscar por nombre
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Agregar información del vendedor
    const users = await getAll('users');
    products = products.map(p => {
      const seller = users.find(u => u.id === p.sellerId);
      return {
        ...p,
        sellerName: seller ? (seller.storeName || seller.name) : 'Desconocido'
      };
    });
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = products.length;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
});

// GET /api/admin/orders - Gestión de órdenes
router.get('/orders', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let orders = await getAll('orders');
    
    // Filtrar por estado
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    // Buscar por ID de orden o nombre de usuario
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(o => 
        o.id.includes(searchLower) ||
        o.shippingAddress.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Agregar información del comprador
    const users = await getAll('users');
    orders = orders.map(o => {
      const buyer = users.find(u => u.id === o.userId);
      return {
        ...o,
        buyerName: buyer ? buyer.name : 'Desconocido',
        buyerEmail: buyer ? buyer.email : ''
      };
    });
    
    // Ordenar por fecha más reciente
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = orders.length;
    const paginatedOrders = orders.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes'
    });
  }
});

// PUT /api/admin/products/:id/status - Cambiar estado de producto
router.put('/products/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['active', 'inactive', 'pending', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`
      });
    }
    
    const product = await getById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    const updatedProduct = await update('products', req.params.id, { status });
    
    res.json({
      success: true,
      message: 'Estado de producto actualizado',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    });
  }
});

// PUT /api/admin/products/:id/featured - Marcar/desmarcar producto como destacado
router.put('/products/:id/featured', async (req, res) => {
  try {
    const { featured } = req.body;
    
    const product = await getById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    const updatedProduct = await update('products', req.params.id, { featured });
    
    res.json({
      success: true,
      message: `Producto ${featured ? 'marcado como destacado' : 'desmarcado como destacado'}`,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar destacado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar destacado'
    });
  }
});

// DELETE /api/admin/products/:id - Eliminar producto
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await getById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    await remove('products', req.params.id);
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto'
    });
  }
});

module.exports = router;
