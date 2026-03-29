const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

// Leer la base de datos
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo la base de datos:', error);
    return null;
  }
};

// Escribir en la base de datos
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error escribiendo en la base de datos:', error);
    return false;
  }
};

// Obtener todos los registros de una colección
const getAll = (collection) => {
  const db = readDB();
  return db ? db[collection] || [] : [];
};

// Obtener un registro por ID
const getById = (collection, id) => {
  const db = readDB();
  if (!db) return null;
  const items = db[collection] || [];
  return items.find(item => item.id === id) || null;
};

// Agregar un nuevo registro
const add = (collection, item) => {
  const db = readDB();
  if (!db) return null;
  
  if (!db[collection]) {
    db[collection] = [];
  }
  
  // Generar ID único
  const maxId = db[collection].reduce((max, item) => {
    const id = parseInt(item.id) || 0;
    return id > max ? id : max;
  }, 0);
  
  const newItem = {
    ...item,
    id: String(maxId + 1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db[collection].push(newItem);
  writeDB(db);
  return newItem;
};

// Actualizar un registro
const update = (collection, id, updates) => {
  const db = readDB();
  if (!db) return null;
  
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return null;
  
  db[collection][index] = {
    ...db[collection][index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  writeDB(db);
  return db[collection][index];
};

// Eliminar un registro
const remove = (collection, id) => {
  const db = readDB();
  if (!db) return false;
  
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return false;
  
  db[collection].splice(index, 1);
  writeDB(db);
  return true;
};

// Buscar registros por criterios
const find = (collection, criteria) => {
  const db = readDB();
  if (!db) return [];
  
  const items = db[collection] || [];
  return items.filter(item => {
    return Object.keys(criteria).every(key => {
      if (typeof criteria[key] === 'object') {
        // Búsqueda parcial para strings
        if (criteria[key].$regex) {
          const regex = new RegExp(criteria[key].$regex, 'i');
          return regex.test(item[key]);
        }
        // Búsqueda de rango para números
        if (criteria[key].$gte !== undefined && criteria[key].$lte !== undefined) {
          return item[key] >= criteria[key].$gte && item[key] <= criteria[key].$lte;
        }
      }
      return item[key] === criteria[key];
    });
  });
};

module.exports = {
  readDB,
  writeDB,
  getAll,
  getById,
  add,
  update,
  remove,
  find
};
