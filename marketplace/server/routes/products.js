const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, remove, find } = require('../database/db');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// GET /api/products - Obtener todos los productos (con filtros)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sort, 
      page = 1, 
      limit = 12,
      featured,
      sellerId
    } = req.query;
    
    let products = await getAll('products');
    
    // Filtrar por categoría
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    // Filtrar por vendedor
    if (sellerId) {
      products = products.filter(p => p.sellerId === sellerId);
    }
    
    // Filtrar por precio
    if (minPrice) {
      products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= parseFloat(maxPrice));
    }
    
    // Filtrar destacados
    if (featured === 'true') {
      products = products.filter(p => p.featured);
    }
    
    // Buscar por nombre o descripción
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrar solo productos activos
    products = products.filter(p => p.status === 'active');
    
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
    const total = products.length;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = products.slice(startIndex, startIndex + parseInt(limit));
    
    // Agregar información del vendedor a cada producto
    const users = await getAll('users');
    const productsWithSeller = paginatedProducts.map(product => {
      const seller = users.find(u => u.id === product.sellerId);
      return {
        ...product,
        seller: seller ? {
          id: seller.id,
          name: seller.storeName || seller.name,
          rating: seller.storeRating || 0
        } : null
      };
    });
    
    res.json({
      success: true,
      products: productsWithSeller,
      totalPages: Math.ceil(total / limit),
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

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await getById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Agregar información del vendedor
    const seller = await getById('users', product.sellerId);
    const productWithSeller = {
      ...product,
      seller: seller ? {
        id: seller.id,
        name: seller.storeName || seller.name,
        rating: seller.storeRating || 0,
        totalSales: seller.totalSales || 0
      } : null
    };
    
    // Agregar reseñas del producto
    const reviews = await getAll('reviews');
    const productReviews = reviews.filter(r => r.productId === product.id);
    
    res.json({
      success: true,
      data: {
        ...productWithSeller,
        reviews: productReviews
      }
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
});

// POST /api/products - Crear un nuevo producto (solo vendedores)
router.post('/', authenticate, authorize('seller', 'admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      images,
      stock,
      tags,
      specifications,
      shipping
    } = req.body;
    
    // Validaciones
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, descripción, precio y categoría son requeridos'
      });
    }
    
    // Crear producto
    const newProduct = await add('products', {
      name,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      category,
      sellerId: req.user.id,
      images: images || [],
      stock: parseInt(stock) || 0,
      sold: 0,
      rating: 0,
      reviews: 0,
      tags: tags || [],
      specifications: specifications || {},
      shipping: shipping || { free: false, estimatedDays: '3-5', cost: 0 },
      status: 'active',
      featured: false
    });
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto'
    });
  }
});

// PUT /api/products/:id - Actualizar un producto
router.put('/:id', authenticate, authorize('seller', 'admin'), async (req, res) => {
  try {
    const product = await getById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Verificar que el vendedor sea el dueño del producto o admin
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este producto'
      });
    }
    
    const updates = req.body;
    const updatedProduct = await update('products', req.params.id, updates);
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
});

// DELETE /api/products/:id - Eliminar un producto
router.delete('/:id', authenticate, authorize('seller', 'admin'), async (req, res) => {
  try {
    const product = await getById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Verificar que el vendedor sea el dueño del producto o admin
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este producto'
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

// POST /api/products/:id/reviews - Agregar reseña a un producto
router.post('/:id/reviews', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating debe ser entre 1 y 5'
      });
    }
    
    const product = await getById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Crear reseña
    const newReview = await add('reviews', {
      productId: req.params.id,
      userId: req.user.id,
      userName: req.user.name,
      rating: parseInt(rating),
      comment: comment || ''
    });
    
    // Actualizar rating del producto
    const reviews = await getAll('reviews');
    const productReviews = reviews.filter(r => r.productId === req.params.id);
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    
    await update('products', req.params.id, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: productReviews.length
    });
    
    res.status(201).json({
      success: true,
      message: 'Reseña agregada exitosamente',
      data: newReview
    });
  } catch (error) {
    console.error('Error al agregar reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar reseña'
    });
  }
});

module.exports = router;
