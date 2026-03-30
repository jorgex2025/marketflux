import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave, FaTimes, FaPlus, FaTrash, FaImage } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductForm.css';

const CATEGORIES = [
  { id: 'electronics', name: 'Electrónica' },
  { id: 'clothing', name: 'Ropa y Accesorios' },
  { id: 'home', name: 'Hogar y Muebles' },
  { id: 'sports', name: 'Deportes' },
  { id: 'beauty', name: 'Belleza' },
  { id: 'toys', name: 'Juguetes' },
  { id: 'books', name: 'Libros' },
  { id: 'automotive', name: 'Automotriz' },
  { id: 'food', name: 'Alimentos' },
  { id: 'other', name: 'Otros' }
];

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditing);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    images: [''],
    stock: '',
    tags: '',
    specifications: {},
    shipping: {
      free: false,
      cost: '',
      estimatedDays: ''
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setFetchingProduct(true);
      const response = await axios.get(`/api/products/${id}`);
      if (response.data.success) {
        const product = response.data.data;
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          originalPrice: product.originalPrice || '',
          category: product.category || '',
          images: product.images?.length > 0 ? product.images : [''],
          stock: product.stock ?? '',
          tags: product.tags?.join(', ') || '',
          specifications: product.specifications || {},
          shipping: {
            free: product.shipping?.free || false,
            cost: product.shipping?.cost || '',
            estimatedDays: product.shipping?.estimatedDays || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('No se pudo cargar el producto');
      navigate('/seller');
    } finally {
      setFetchingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('shipping.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, images: newImages }));
    }
  };

  const handleTagsChange = (e) => {
    setFormData(prev => ({ ...prev, tags: e.target.value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'El precio es requerido y debe ser mayor a 0';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = 'El stock es requerido';
    }

    const validImages = formData.images.filter(img => img.trim() !== '');
    if (validImages.length === 0) {
      newErrors.images = 'Debes agregar al menos una imagen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      setLoading(true);

      const validImages = formData.images.filter(img => img.trim() !== '');
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category: formData.category,
        images: validImages,
        stock: parseInt(formData.stock),
        tags,
        specifications: formData.specifications,
        shipping: {
          free: formData.shipping.free,
          cost: formData.shipping.free ? 0 : (formData.shipping.cost ? parseFloat(formData.shipping.cost) : 0),
          estimatedDays: formData.shipping.estimatedDays ? parseInt(formData.shipping.estimatedDays) : null
        },
        sellerId: user.id
      };

      let response;
      if (isEditing) {
        response = await axios.put(`/api/products/${id}`, payload);
      } else {
        response = await axios.post('/api/products', payload);
      }

      if (response.data.success) {
        toast.success(isEditing ? 'Producto actualizado con éxito' : 'Producto creado con éxito');
        navigate('/seller');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const message = error.response?.data?.message || 'Error al guardar el producto';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="product-form-page">
        <div className="loading-container">
          <div className="spinner-fusion"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-form-page container section-fade-in">
      <div className="form-header glass-card">
        <button className="back-btn" onClick={() => navigate('/seller')}>
          <FaArrowLeft /> Volver
        </button>
        <div className="form-title">
          <h1>{isEditing ? 'Editar Producto' : 'Publicar Nuevo Producto'}</h1>
          <p>{isEditing ? 'Actualiza la información de tu producto' : 'Completa los detalles para publicar tu producto'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-grid">
          <div className="form-section glass-card">
            <h2>Información Básica</h2>
            
            <div className="form-group">
              <label htmlFor="name">Nombre del Producto *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Camiseta Algodón Premium"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe tu producto en detalle..."
                rows={5}
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Precio (USD) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="originalPrice">Precio Original (USD)</label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Categoría *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock *</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={errors.stock ? 'error' : ''}
                />
                {errors.stock && <span className="error-message">{errors.stock}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (separados por comas)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleTagsChange}
                placeholder="Ej: verano, ropa, algodón, casual"
              />
              <span className="help-text">Separa los tags con comas para mejorar la búsqueda</span>
            </div>
          </div>

          <div className="form-section glass-card">
            <h2>Imágenes del Producto</h2>
            
            <div className="form-group">
              <label>URLs de Imágenes *</label>
              {errors.images && <span className="error-message">{errors.images}</span>}
              
              <div className="images-list">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-input-row">
                    <div className="image-preview">
                      {image ? (
                        <img src={image} alt={`Preview ${index + 1}`} />
                      ) : (
                        <div className="placeholder-image">
                          <FaImage />
                        </div>
                      )}
                    </div>
                    <div className="image-url-input">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImageField(index)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button type="button" className="add-image-btn" onClick={addImageField}>
                <FaPlus /> Agregar otra imagen
              </button>
            </div>
          </div>

          <div className="form-section glass-card">
            <h2>Información de Envío</h2>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="shipping.free"
                  checked={formData.shipping.free}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                Envío gratuito
              </label>
            </div>

            {!formData.shipping.free && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="shipping.cost">Costo de Envío (USD)</label>
                  <input
                    type="number"
                    id="shipping.cost"
                    name="shipping.cost"
                    value={formData.shipping.cost}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shipping.estimatedDays">Días Estimados de Entrega</label>
                  <input
                    type="number"
                    id="shipping.estimatedDays"
                    name="shipping.estimatedDays"
                    value={formData.shipping.estimatedDays}
                    onChange={handleChange}
                    placeholder="3-5"
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions glass-card">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/seller')}
            disabled={loading}
          >
            <FaTimes /> Cancelar
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Guardando...
              </>
            ) : (
              <>
                <FaSave /> {isEditing ? 'Actualizar Producto' : 'Publicar Producto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
