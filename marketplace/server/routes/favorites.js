const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, find, db } = require('../database/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const favorites = await find('favorites', { userId: req.user.id });
    
    const products = await getAll('products');
    const favoritesWithProducts = favorites.map(fav => {
      const product = products.find(p => p.id === fav.productId);
      return {
        ...fav,
        product: product || null
      };
    }).filter(fav => fav.product !== null);
    
    res.json({
      success: true,
      data: favoritesWithProducts
    });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener favoritos'
    });
  }
});

router.post('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await getById('products', productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    const existing = await find('favorites', { 
      userId: req.user.id, 
      productId: productId 
    });
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Producto ya está en favoritos'
      });
    }
    
    const favorite = await add('favorites', {
      userId: req.user.id,
      productId: productId
    });
    
    res.json({
      success: true,
      message: 'Producto agregado a favoritos',
      data: { ...favorite, product }
    });
  } catch (error) {
    console.error('Error al agregar a favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar a favoritos'
    });
  }
});

router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const favorites = await find('favorites', { 
      userId: req.user.id, 
      productId: productId 
    });
    
    if (favorites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorito no encontrado'
      });
    }
    
    const db = require('../database/db').db;
    db.prepare('DELETE FROM favorites WHERE userId = ? AND productId = ?')
      .run(parseInt(req.user.id), parseInt(productId));
    
    res.json({
      success: true,
      message: 'Producto eliminado de favoritos'
    });
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar de favoritos'
    });
  }
});

module.exports = router;