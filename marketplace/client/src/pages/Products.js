import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort: searchParams.get('sort') || 'newest',
      page: parseInt(searchParams.get('page')) || 1,
    };
    
    // Solo actualizar si realmente son diferentes para evitar loops
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      setFilters(newFilters);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', filters.page);
      params.append('limit', 12);

      const response = await axios.get(`/api/products?${params.toString()}`);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Remove filters from here since it's already in fetchProducts deps

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const handlePageChange = (page) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const updateSearchParams = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.append('search', newFilters.search);
    if (newFilters.category) params.append('category', newFilters.category);
    if (newFilters.minPrice) params.append('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.append('maxPrice', newFilters.maxPrice);
    if (newFilters.sort) params.append('sort', newFilters.sort);
    if (newFilters.page > 1) params.append('page', newFilters.page);
    setSearchParams(params);
  };

  const clearFilters = () => {
    const newFilters = {
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      page: 1,
    };
    setFilters(newFilters);
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Filtros */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>Filtros</h3>
            <button onClick={clearFilters} className="clear-filters">
              Limpiar
            </button>
          </div>

          <div className="filter-group">
            <label>Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Rango de precio</label>
            <div className="price-range">
              <input
                type="number"
                placeholder="Mín"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Máx"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Ordenar por</label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="rating">Mejor valorados</option>
              <option value="popular">Más vendidos</option>
            </select>
          </div>
        </aside>

        {/* Lista de productos */}
        <main className="products-main">
          <div className="products-header">
            <h1>
              {filters.search
                ? `Resultados para "${filters.search}"`
                : filters.category
                ? categories.find((c) => c.id === filters.category)?.name || 'Productos'
                : 'Todos los productos'}
            </h1>
            <p>{products.length} productos encontrados</p>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <h3>No se encontraron productos</h3>
              <p>Intenta ajustar los filtros o buscar algo diferente</p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product, index) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                  >
                    Anterior
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={filters.page === i + 1 ? 'active' : ''}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
