const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, remove } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/categories - Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categories = await getAll('categories');
    
    // Agregar conteo de productos a cada categoría
    const products = await getAll('products');
    const categoriesWithCount = categories.map(category => ({
      ...category,
      productCount: products.filter(p => p.category === category.id && p.status === 'active').length
    }));
    
    res.json(categoriesWithCount);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
});

// GET /api/categories/:id - Obtener una categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const category = await getById('categories', req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Agregar productos de esta categoría
    const products = await getAll('products');
    const categoryProducts = products.filter(
      p => p.category === category.id && p.status === 'active'
    );
    
    res.json({
      success: true,
      data: {
        ...category,
        products: categoryProducts
      }
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
});

// POST /api/categories - Crear una nueva categoría (solo admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, image, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de categoría es requerido'
      });
    }
    
    const newCategory = await add('categories', {
      name,
      description: description || '',
      icon: icon || '📦',
      image: image || '',
      parentId: parentId || null,
      productCount: 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: newCategory
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
});

// PUT /api/categories/:id - Actualizar una categoría (solo admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const category = await getById('categories', req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    const updates = req.body;
    const updatedCategory = await update('categories', req.params.id, updates);
    
    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
});

// DELETE /api/categories/:id - Eliminar una categoría (solo admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const category = await getById('categories', req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Verificar si hay productos en esta categoría
    const products = await getAll('products');
    const productsInCategory = products.filter(p => p.category === req.params.id);
    
    if (productsInCategory.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una categoría con productos asociados'
      });
    }
    
    await remove('categories', req.params.id);
    
    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
});

module.exports = router;
