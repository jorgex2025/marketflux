const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, remove, find } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const updateProductRating = async (productId) => {
  const reviews = await find('reviews', { productId: String(productId) });
  
  if (reviews.length === 0) {
    await update('products', productId, { rating: 0, reviews: 0 });
    return { rating: 0, reviews: 0 };
  }
  
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  await update('products', productId, {
    rating: Math.round(avgRating * 10) / 10,
    reviews: reviews.length
  });
  
  return { rating: Math.round(avgRating * 10) / 10, reviews: reviews.length };
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, minRating, maxRating } = req.query;
    
    let reviews = await getAll('reviews');
    
    if (productId) {
      reviews = reviews.filter(r => r.productId === String(productId));
    }
    
    if (minRating) {
      reviews = reviews.filter(r => r.rating >= parseInt(minRating));
    }
    
    if (maxRating) {
      reviews = reviews.filter(r => r.rating <= parseInt(maxRating));
    }
    
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedReviews = reviews.slice(startIndex, endIndex);
    
    const products = await getAll('products');
    const reviewsWithProducts = paginatedReviews.map(review => {
      const product = products.find(p => p.id === review.productId);
      return { ...review, product: product || null };
    });
    
    res.json({
      success: true,
      data: reviewsWithProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: reviews.length,
        totalPages: Math.ceil(reviews.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseñas'
    });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const product = await getById('products', req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    let reviews = await find('reviews', { productId: req.params.productId });
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedReviews = reviews.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedReviews,
      product: {
        id: product.id,
        name: product.name
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: reviews.length,
        totalPages: Math.ceil(reviews.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseñas del producto'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const review = await getById('reviews', req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }
    
    const product = await getById('products', review.productId);
    
    res.json({
      success: true,
      data: { ...review, product: product || null }
    });
  } catch (error) {
    console.error('Error al obtener reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseña'
    });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.id;
    
    const review = await getById('reviews', reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }
    
    const isAuthor = review.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta reseña'
      });
    }
    
    const updates = {};
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating debe ser entre 1 y 5'
        });
      }
      updates.rating = parseInt(rating);
    }
    
    if (comment !== undefined) {
      updates.comment = comment;
    }
    
    const updatedReview = await update('reviews', reviewId, updates);
    
    if (rating !== undefined) {
      await updateProductRating(review.productId);
    }
    
    res.json({
      success: true,
      message: 'Reseña actualizada exitosamente',
      data: updatedReview
    });
  } catch (error) {
    console.error('Error al actualizar reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar reseña'
    });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    const review = await getById('reviews', reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }
    
    const isAuthor = review.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta reseña'
      });
    }
    
    const productId = review.productId;
    
    await remove('reviews', reviewId);
    
    await updateProductRating(productId);
    
    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar reseña'
    });
  }
});

module.exports = router;