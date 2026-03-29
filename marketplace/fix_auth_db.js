const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'server', 'database', 'marketplace.db');
const db = new Database(DB_FILE);

console.log('🔄 Starting Database Auth Migration...');

try {
  // 1. Deshabilitar llaves foráneas temporalmente para limpieza total
  db.pragma('foreign_keys = OFF');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM categories');
  db.exec('DELETE FROM carts');
  db.exec('DELETE FROM orders');
  console.log('🧹 Tables cleared.');

  // 2. Cargar datos de db.json
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'server', 'database', 'db.json'), 'utf8'));

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, role, avatar, phone, address, storeName, storeDescription, storeRating, totalSales)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, description, price, originalPrice, category, sellerId, images, stock, sold, rating, reviews, tags, specifications, shipping, status, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, description, icon, image, productCount, parentId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 3. Ejecutar inserción con Hashing
  const migrate = db.transaction(() => {
    console.log('🗝️ Hashing and inserting users...');
    for (const user of data.users) {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      insertUser.run(
        user.id,
        user.email,
        hashedPassword,
        user.name,
        user.role,
        user.avatar || null,
        user.phone || '',
        user.address || '',
        user.storeName || null,
        user.storeDescription || null,
        user.storeRating || 0,
        user.totalSales || 0
      );
    }

    console.log('📦 Inserting products...');
    for (const p of data.products) {
      insertProduct.run(
        p.id,
        p.name,
        p.description,
        p.price,
        p.originalPrice || null,
        p.category,
        p.sellerId,
        JSON.stringify(p.images || []),
        p.stock || 0,
        p.sold || 0,
        p.rating || 0,
        p.reviews || 0,
        JSON.stringify(p.tags || []),
        JSON.stringify(p.specifications || {}),
        JSON.stringify(p.shipping || {}),
        p.status || 'active',
        p.featured ? 1 : 0
      );
    }

    console.log('📁 Inserting categories...');
    for (const c of data.categories) {
      insertCategory.run(
        c.id,
        c.name,
        c.description || '',
        c.icon || '📦',
        c.image || '',
        c.productCount || 0,
        c.parentId || null
      );
    }
  });

  migrate();
  console.log('✅ Database Auth Migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
} finally {
  db.close();
}
