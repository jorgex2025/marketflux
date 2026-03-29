const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const initialPort = parseInt(process.env.PORT, 10) || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes de productos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/admin', require('./routes/admin'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Marketplace API funcionando correctamente' });
});

// Servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Servidor del marketplace corriendo en puerto ${port}`);
    console.log(`📡 API disponible en http://localhost:${port}/api`);
    console.log(`💊 Health check: http://localhost:${port}/api/health`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = port + 1;
      console.warn(`⚠️ Puerto ${port} en uso, intentando en ${fallbackPort}...`);
      startServer(fallbackPort);
    } else {
      console.error('❌ Error al iniciar servidor:', error);
      process.exit(1);
    }
  });
};

startServer(initialPort);
