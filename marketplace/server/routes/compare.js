const express = require('express');
const router = express.Router();
const { getAll, getById, add, find } = require('../database/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const compares = await find('compare', { userId: req.user.id });
    
    const products = await getAll('products');
    const compareWithProducts = compares.map(c => {
      const product = products.find(p => p.id === c.productId);
      return {
        ...c,
        product: product || null
      };
    }).filter(c => c.product !== null);
    
    res.json({
      success: true,
      data: compareWithProducts
    });
  } catch (error) {
    console.error('Error al obtener comparación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comparación'
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
    
    const currentCompares = await find('compare', { userId: req.user.id });
    
    if (currentCompares.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Máximo 4 productos para comparar'
      });
    }
    
    const existing = await find('compare', { 
      userId: req.user.id, 
      productId: productId 
    });
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Producto ya está en comparación'
      });
    }
    
    const compareItem = await add('compare', {
      userId: req.user.id,
      productId: productId
    });
    
    res.json({
      success: true,
      message: 'Producto agregado a comparación',
      data: { ...compareItem, product }
    });
  } catch (error) {
    console.error('Error al agregar a comparación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar a comparación'
    });
  }
});

router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const compares = await find('compare', { 
      userId: req.user.id, 
      productId: productId 
    });
    
    if (compares.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado en comparación'
      });
    }
    
    const db = require('../database/db').db;
    db.prepare('DELETE FROM compare WHERE userId = ? AND productId = ?')
      .run(parseInt(req.user.id), parseInt(productId));
    
    res.json({
      success: true,
      message: 'Producto eliminado de comparación'
    });
  } catch (error) {
    console.error('Error al eliminar de comparación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar de comparación'
    });
  }
});

router.delete('/clear', authenticate, async (req, res) => {
  try {
    const db = require('../database/db').db;
    db.prepare('DELETE FROM compare WHERE userId = ?')
      .run(parseInt(req.user.id));
    
    res.json({
      success: true,
      message: 'Lista de comparación limpiada'
    });
  } catch (error) {
    console.error('Error al limpiar comparación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar comparación'
    });
  }
});

module.exports = router;