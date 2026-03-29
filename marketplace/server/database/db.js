const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'marketplace.db');
const db = new Database(DB_FILE);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDB = () => {
  try {
    // Create Tables (IF NOT EXISTS — never destroys data)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT DEFAULT 'buyer',
        avatar TEXT,
        phone TEXT,
        address TEXT,
        storeName TEXT,
        storeDescription TEXT,
        storeRating REAL DEFAULT 0,
        totalSales INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price REAL,
        originalPrice REAL,
        category TEXT,
        sellerId INTEGER,
        images TEXT DEFAULT '[]',
        stock INTEGER DEFAULT 0,
        sold INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        specifications TEXT DEFAULT '{}',
        shipping TEXT DEFAULT '{}',
        status TEXT DEFAULT 'active',
        featured INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        icon TEXT,
        image TEXT,
        productCount INTEGER DEFAULT 0,
        parentId INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER UNIQUE,
        items TEXT DEFAULT '[]',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        items TEXT DEFAULT '[]',
        subtotal REAL,
        shipping REAL,
        tax REAL,
        total REAL,
        status TEXT,
        shippingAddress TEXT DEFAULT '{}',
        paymentMethod TEXT,
        paymentStatus TEXT,
        trackingNumber TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER,
        userId INTEGER,
        userName TEXT,
        rating INTEGER,
        comment TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ SQLite Database initialized successfully');

    // Seed only if no users exist
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (row.count === 0) {
      seedDatabase();
    }
  } catch (err) {
    console.error('❌ Failed to initialize SQLite DB:', err);
  }
};

const seedDatabase = () => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password, name, role, avatar, phone, address, storeName, storeDescription, storeRating, totalSales, createdAt)
      VALUES (@id, @email, @password, @name, @role, @avatar, @phone, @address, @storeName, @storeDescription, @storeRating, @totalSales, @createdAt)
    `);

    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, description, price, originalPrice, category, sellerId, images, stock, sold, rating, reviews, tags, specifications, shipping, status, featured, createdAt)
      VALUES (@id, @name, @description, @price, @originalPrice, @category, @sellerId, @images, @stock, @sold, @rating, @reviews, @tags, @specifications, @shipping, @status, @featured, @createdAt)
    `);

    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, description, icon, image, productCount, parentId)
      VALUES (@id, @name, @description, @icon, @image, @productCount, @parentId)
    `);

    // Use transaction for atomicity and speed
    const seedAll = db.transaction(() => {
      for (const user of data.users) {
        // Hash password BEFORE seeding if it's not already hashed
        // We assume passwords in db.json are plain text (e.g., 'password123')
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        
        insertUser.run({
          id: parseInt(user.id),
          email: user.email,
          password: hashedPassword,
          name: user.name,
          role: user.role,
          avatar: user.avatar || null,
          phone: user.phone || '',
          address: user.address || '',
          storeName: user.storeName || null,
          storeDescription: user.storeDescription || null,
          storeRating: user.storeRating || 0,
          totalSales: user.totalSales || 0,
          createdAt: user.createdAt || new Date().toISOString()
        });
      }

      for (const p of data.products) {
        insertProduct.run({
          id: parseInt(p.id),
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice || null,
          category: p.category,
          sellerId: parseInt(p.sellerId),
          images: JSON.stringify(p.images || []),
          stock: p.stock || 0,
          sold: p.sold || 0,
          rating: p.rating || 0,
          reviews: p.reviews || 0,
          tags: JSON.stringify(p.tags || []),
          specifications: JSON.stringify(p.specifications || {}),
          shipping: JSON.stringify(p.shipping || {}),
          status: p.status || 'active',
          featured: p.featured ? 1 : 0,
          createdAt: p.createdAt || new Date().toISOString()
        });
      }

      for (const c of data.categories) {
        insertCategory.run({
          id: parseInt(c.id),
          name: c.name,
          description: c.description || '',
          icon: c.icon || '📦',
          image: c.image || '',
          productCount: c.productCount || 0,
          parentId: c.parentId ? parseInt(c.parentId) : null
        });
      }
    });

    seedAll();
    console.log('🌱 Database seeded successfully from db.json');
  } catch (err) {
    console.error('❌ Error seeding DB:', err);
  }
};

// Initialize the database
initDB();

// --- Helper functions (same API as before, returns Promises for route compatibility) ---

const parseRow = (row) => {
  if (!row) return null;
  const parsed = { ...row };

  // Convert numeric IDs to strings for frontend compatibility
  parsed.id = String(parsed.id);
  if (parsed.sellerId) parsed.sellerId = String(parsed.sellerId);
  if (parsed.userId) parsed.userId = String(parsed.userId);
  if (parsed.productId) parsed.productId = String(parsed.productId);

  // Parse JSON fields
  const jsonFields = ['images', 'tags', 'specifications', 'shipping', 'items', 'shippingAddress'];
  for (const field of jsonFields) {
    if (typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // leave as-is if not valid JSON
      }
    }
  }

  // Ensure boolean fields
  if (parsed.featured !== undefined) parsed.featured = parsed.featured === 1;
  if (parsed.isActive !== undefined) parsed.isActive = parsed.isActive === 1;

  return parsed;
};

const getAll = async (collection) => {
  const rows = db.prepare(`SELECT * FROM ${collection}`).all();
  return rows.map(parseRow);
};

const getById = async (collection, id) => {
  const row = db.prepare(`SELECT * FROM ${collection} WHERE id = ?`).get(parseInt(id));
  return parseRow(row);
};

const add = async (collection, item) => {
  const dataToInsert = { ...item };

  // Stringify JSON fields
  const jsonFields = ['images', 'tags', 'specifications', 'shipping', 'items', 'shippingAddress'];
  for (const field of jsonFields) {
    if (dataToInsert[field] && typeof dataToInsert[field] === 'object') {
      dataToInsert[field] = JSON.stringify(dataToInsert[field]);
    }
  }

  if (dataToInsert.sellerId) dataToInsert.sellerId = parseInt(dataToInsert.sellerId);
  if (dataToInsert.userId) dataToInsert.userId = parseInt(dataToInsert.userId);
  if (dataToInsert.productId) dataToInsert.productId = parseInt(dataToInsert.productId);
  if (dataToInsert.featured !== undefined) dataToInsert.featured = dataToInsert.featured ? 1 : 0;

  // Remove id to let AUTOINCREMENT handle it
  delete dataToInsert.id;

  // Add timestamps
  dataToInsert.createdAt = dataToInsert.createdAt || new Date().toISOString();
  dataToInsert.updatedAt = new Date().toISOString();

  const columns = Object.keys(dataToInsert);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map(c => dataToInsert[c]);

  const stmt = db.prepare(`INSERT INTO ${collection} (${columns.join(', ')}) VALUES (${placeholders})`);
  const result = stmt.run(...values);

  return await getById(collection, result.lastInsertRowid);
};

const update = async (collection, id, updates) => {
  const dataToUpdate = { ...updates };

  const jsonFields = ['images', 'tags', 'specifications', 'shipping', 'items', 'shippingAddress'];
  for (const field of jsonFields) {
    if (dataToUpdate[field] && typeof dataToUpdate[field] === 'object') {
      dataToUpdate[field] = JSON.stringify(dataToUpdate[field]);
    }
  }

  if (dataToUpdate.featured !== undefined) dataToUpdate.featured = dataToUpdate.featured ? 1 : 0;

  // Remove id from updates
  delete dataToUpdate.id;

  dataToUpdate.updatedAt = new Date().toISOString();

  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) return await getById(collection, id);

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => dataToUpdate[k]);

  db.prepare(`UPDATE ${collection} SET ${setClause} WHERE id = ?`).run(...values, parseInt(id));
  return await getById(collection, id);
};

const remove = async (collection, id) => {
  db.prepare(`DELETE FROM ${collection} WHERE id = ?`).run(parseInt(id));
  return true;
};

const find = async (collection, criteria) => {
  const rows = await getAll(collection);
  return rows.filter(item => {
    return Object.keys(criteria).every(key => {
      if (typeof criteria[key] === 'object' && criteria[key] !== null) {
        if (criteria[key].$regex) {
          const regex = new RegExp(criteria[key].$regex, 'i');
          return regex.test(item[key]);
        }
        if (criteria[key].$gte !== undefined && criteria[key].$lte !== undefined) {
          return item[key] >= criteria[key].$gte && item[key] <= criteria[key].$lte;
        }
      }
      return item[key] === criteria[key];
    });
  });
};

module.exports = {
  getAll,
  getById,
  add,
  update,
  remove,
  find,
  db // expose raw db for advanced queries if needed
};
