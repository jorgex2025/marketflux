const express = require('express');
const router = express.Router();
const { getAll, getById, find } = require('../database/db');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// GET /api/sellers - Obtener todos los vendedores
router.get('/', optionalAuth, async (req, res) => {
  try {
    const users = await getAll('users');
    const sellers = users.filter(u => u.role === 'seller');
    
    // Remover contraseñas y agregar estadísticas
    const sellersWithStats = await Promise.all(sellers.map(async ({ password, ...seller }) => {
      const products = await getAll('products');
      const sellerProducts = products.filter(p => p.sellerId === seller.id && p.status === 'active');
      
      return {
        ...seller,
        productCount: sellerProducts.length,
        totalSales: seller.totalSales || 0,
        storeRating: seller.storeRating || 0
      };
    }));
    
    res.json({
      success: true,
      data: sellersWithStats
    });
  } catch (error) {
    console.error('Error al obtener vendedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vendedores'
    });
  }
});

// IMPORTANT: /dashboard/stats MUST be defined BEFORE /:id to avoid Express matching "dashboard" as an :id param
// GET /api/sellers/dashboard/stats - Obtener estadísticas del vendedor (requiere autenticación)
router.get('/dashboard/stats', authenticate, authorize('seller'), async (req, res) => {
  try {
    const seller = await getById('users', req.user.id);
    
    // Obtener productos del vendedor
    const products = await getAll('products');
    const sellerProducts = products.filter(p => p.sellerId === seller.id);
    
    // Obtener órdenes que contienen productos del vendedor
    const orders = await getAll('orders');
    const sellerOrders = orders.filter(order => 
      order.items.some(item => {
        const product = products.find(p => p.id === item.productId);
        return product && product.sellerId === seller.id;
      })
    );
    
    // Calcular estadísticas
    const totalProducts = sellerProducts.length;
    const activeProducts = sellerProducts.filter(p => p.status === 'active').length;
    const totalOrders = sellerOrders.length;
    const pendingOrders = sellerOrders.filter(o => o.status === 'pending').length;
    const completedOrders = sellerOrders.filter(o => o.status === 'delivered').length;
    
    // Calcular ingresos totales
    const totalRevenue = sellerOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, order) => {
        const sellerItems = order.items.filter(item => {
          const product = products.find(p => p.id === item.productId);
          return product && product.sellerId === seller.id;
        });
        return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
      }, 0);
    
    // Calcular ventas totales
    const totalSales = sellerProducts.reduce((sum, p) => sum + p.sold, 0);
    
    // Obtener reseñas
    const reviews = await getAll('reviews');
    const sellerReviews = reviews.filter(r => {
      const product = products.find(p => p.id === r.productId);
      return product && product.sellerId === seller.id;
    });
    
    const avgRating = sellerReviews.length > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
      : 0;
    
    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSales,
        reviewCount: sellerReviews.length,
        averageRating: Math.round(avgRating * 10) / 10
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

// GET /api/sellers/:id - Obtener un vendedor por ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const seller = await getById('users', req.params.id);
    
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Vendedor no encontrado'
      });
    }
    
    // Obtener productos del vendedor
    const products = await getAll('products');
    const sellerProducts = products.filter(
      p => p.sellerId === seller.id && p.status === 'active'
    );
    
    // Obtener reseñas del vendedor
    const reviews = await getAll('reviews');
    const sellerReviews = reviews.filter(r => {
      const product = products.find(p => p.id === r.productId);
      return product && product.sellerId === seller.id;
    });
    
    // Calcular rating promedio
    const avgRating = sellerReviews.length > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
      : 0;
    
    // Remover contraseña de la respuesta
    const { password: _, ...sellerWithoutPassword } = seller;
    
    res.json({
      success: true,
      data: {
        ...sellerWithoutPassword,
        products: sellerProducts,
        productCount: sellerProducts.length,
        reviewCount: sellerReviews.length,
        storeRating: Math.round(avgRating * 10) / 10
      }
    });
  } catch (error) {
    console.error('Error al obtener vendedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vendedor'
    });
  }
});

// GET /api/sellers/:id/products - Obtener productos de un vendedor
router.get('/:id/products', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, sort } = req.query;
    
    const seller = await getById('users', req.params.id);
    
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Vendedor no encontrado'
      });
    }
    
    // Obtener productos del vendedor
    let products = await getAll('products');
    products = products.filter(p => p.sellerId === seller.id && p.status === 'active');
    
    // Ordenar
    if (sort) {
      switch (sort) {
        case 'price_asc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          products.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'popular':
          products.sort((a, b) => b.sold - a.sold);
          break;
        default:
          products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } else {
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
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
    console.error('Error al obtener productos del vendedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos del vendedor'
    });
  }
});

// GET /api/sellers/:id/reviews - Obtener reseñas de un vendedor
router.get('/:id/reviews', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const seller = await getById('users', req.params.id);
    
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Vendedor no encontrado'
      });
    }
    
    // Obtener reseñas de los productos del vendedor
    const products = await getAll('products');
    const reviews = await getAll('reviews');
    
    const sellerReviews = reviews.filter(r => {
      const product = products.find(p => p.id === r.productId);
      return product && product.sellerId === seller.id;
    });
    
    // Ordenar por fecha más reciente
    sellerReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = sellerReviews.length;
    const paginatedReviews = sellerReviews.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas del vendedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseñas del vendedor'
    });
  }
});

module.exports = router;
