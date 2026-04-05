import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { createId } from '@paralleldrive/cuid2';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export async function seed() {
  console.log('🌱 Starting seed...');

  // ── 1. Users ─────────────────────────────────────────────────────────────
  console.log('Checking for existing users...');
  const existingUsers = await db.select().from(schema.users);
  console.log('Found existing users:', existingUsers.length);

  let userId: { admin: string; seller1: string; seller2: string; buyer1: string; buyer2: string; buyer3: string } = {} as any;

  if (existingUsers.length === 0) {
    // Insert users if none exist
    userId = {
      admin:   createId(),
      seller1: createId(),
      seller2: createId(),
      buyer1:  createId(),
      buyer2:  createId(),
      buyer3:  createId(),
    };

    console.log('Inserting users...');
    await db.insert(schema.users).values([
      { id: userId.admin,   name: 'Admin User',  email: 'admin@marketflux.dev',   role: 'admin',  emailVerified: true },
      { id: userId.seller1, name: 'Seller One',  email: 'seller1@marketflux.dev', role: 'seller', emailVerified: true },
      { id: userId.seller2, name: 'Seller Two',  email: 'seller2@marketflux.dev', role: 'seller', emailVerified: true },
      { id: userId.buyer1,  name: 'Buyer One',   email: 'buyer1@marketflux.dev',  role: 'buyer',  emailVerified: true },
      { id: userId.buyer2,  name: 'Buyer Two',   email: 'buyer2@marketflux.dev',  role: 'buyer',  emailVerified: true },
      { id: userId.buyer3,  name: 'Buyer Three', email: 'buyer3@marketflux.dev',  role: 'buyer',  emailVerified: true },
    ]);
    console.log('Users inserted');
  } else {
    // Use existing users
    const adminUser = existingUsers.find(u => u.email === 'admin@marketflux.dev');
    const seller1User = existingUsers.find(u => u.email === 'seller1@marketflux.dev');
    const seller2User = existingUsers.find(u => u.email === 'seller2@marketflux.dev');
    const buyer1User = existingUsers.find(u => u.email === 'buyer1@marketflux.dev');
    const buyer2User = existingUsers.find(u => u.email === 'buyer2@marketflux.dev');
    const buyer3User = existingUsers.find(u => u.email === 'buyer3@marketflux.dev');

    if (!adminUser || !seller1User || !seller2User || !buyer1User || !buyer2User || !buyer3User) {
      throw new Error('Expected users not found in database');
    }

    userId = {
      admin: adminUser.id,
      seller1: seller1User.id,
      seller2: seller2User.id,
      buyer1: buyer1User.id,
      buyer2: buyer2User.id,
      buyer3: buyer3User.id,
    };
    console.log('Using existing users');
  }

  // ── 2. Stores ─────────────────────────────────────────────────────────────
  console.log('Checking for existing stores...');
  const existingStores = await db.select().from(schema.stores);
  console.log('Found existing stores:', existingStores.length);

  let storeId: { s1: string; s2: string } = {} as any;

   if (existingStores.length === 0) {
     storeId = { s1: createId(), s2: createId() };

      await db.insert(schema.stores).values([
        {
          id:          storeId.s1,
          userId:      userId.seller1,
          name:        'TechZone Store',
          slug:        'techzone-store',
          description: 'Los mejores gadgets y electrónica',
          status:      'active',
        },
        {
          id:          storeId.s2,
          userId:      userId.seller2,
          name:        'Fashion Hub',
          slug:        'fashion-hub',
          description: 'Moda contemporánea y accesorios',
          status:      'active',
        },
      ]);
     console.log('Stores inserted');
  } else {
    const techStore = existingStores.find(s => s.slug === 'techzone-store');
    const fashionStore = existingStores.find(s => s.slug === 'fashion-hub');

    if (!techStore || !fashionStore) {
      throw new Error('Expected stores not found in database');
    }

    storeId = { s1: techStore.id, s2: fashionStore.id };
    console.log('Using existing stores');
  }

  // ── 3. Categories ─────────────────────────────────────────────────────
  console.log('Checking for existing categories...');
  const existingCategories = await db.select().from(schema.categories);
  console.log('Found existing categories:', existingCategories.length);

  let catId: { electronica: string; celulares: string; ropa: string } = {} as any;

   if (existingCategories.length === 0) {
     catId = {
       electronica: createId(),
       celulares:   createId(),
       ropa:        createId(),
     };

     // Insert root categories first (no parent dependency)
     await db.insert(schema.categories).values([
       { id: catId.electronica, name: 'Electrónica', slug: 'electronica', parentId: null, order: 1 },
       { id: catId.ropa, name: 'Ropa', slug: 'ropa', parentId: null, order: 2 },
     ]);

     // Then insert child categories (parent now exists)
     await db.insert(schema.categories).values([
       { id: catId.celulares, name: 'Celulares', slug: 'celulares', parentId: catId.electronica, order: 1 },
     ]);
     console.log('Categories inserted');
  } else {
    const electronica = existingCategories.find(c => c.slug === 'electronica');
    const celulares = existingCategories.find(c => c.slug === 'celulares');
    const ropa = existingCategories.find(c => c.slug === 'ropa');

    if (!electronica || !celulares || !ropa) {
      throw new Error('Expected categories not found in database');
    }

    catId = {
      electronica: electronica.id,
      celulares: celulares.id,
      ropa: ropa.id,
    };
    console.log('Using existing categories');
  }

  // ── 4. Products ──────────────────────────────────────────────────────────
  console.log('Checking for existing products...');
  const existingProducts = await db.select().from(schema.products);
  console.log('Found existing products:', existingProducts.length);

  let prodId: { p1: string; p2: string; p3: string; p4: string; p5: string } = {} as any;

  if (existingProducts.length === 0) {
    prodId = {
      p1: createId(), p2: createId(), p3: createId(),
      p4: createId(), p5: createId(),
    };

     await db.insert(schema.products).values([
       { id: prodId.p1, storeId: storeId.s1, categoryId: catId.celulares,   name: 'Smartphone Pro X',   slug: 'smartphone-pro-x',   description: 'Smartphone de última generación', price: '599.99', stock: 50,  status: 'active', featured: true, images: []  },
       { id: prodId.p2, storeId: storeId.s1, categoryId: catId.celulares,   name: 'Tablet Ultra 10',    slug: 'tablet-ultra-10',    description: 'Tablet de alto rendimiento', price: '399.99', stock: 30,  status: 'active', featured: false, images: [] },
       { id: prodId.p3, storeId: storeId.s1, categoryId: catId.electronica, name: 'Auriculares BT Pro',  slug: 'auriculares-bt-pro', description: 'Auriculares Bluetooth premium', price: '89.99',  stock: 100, status: 'active', featured: true, images: []  },
       { id: prodId.p4, storeId: storeId.s2, categoryId: catId.ropa,        name: 'Camiseta Premium',   slug: 'camiseta-premium',   description: 'Camiseta de algodón premium', price: '29.99',  stock: 200, status: 'active', featured: false, images: [] },
       { id: prodId.p5, storeId: storeId.s2, categoryId: catId.ropa,        name: 'Jeans Clásicos',    slug: 'jeans-clasicos',     description: 'Jeans de corte clásico', price: '49.99',  stock: 150, status: 'active', featured: false, images: [] },
     ]);
    console.log('Products inserted');
  } else {
    const phone = existingProducts.find(p => p.slug === 'smartphone-pro-x');
    const tablet = existingProducts.find(p => p.slug === 'tablet-ultra-10');
    const headphones = existingProducts.find(p => p.slug === 'auriculares-bt-pro');
    const shirt = existingProducts.find(p => p.slug === 'camiseta-premium');
    const jeans = existingProducts.find(p => p.slug === 'jeans-clasicos');

    if (!phone || !tablet || !headphones || !shirt || !jeans) {
      throw new Error('Expected products not found in database');
    }

    prodId = {
      p1: phone.id, p2: tablet.id, p3: headphones.id,
      p4: shirt.id, p5: jeans.id,
    };
    console.log('Using existing products');
  }

  // ── 5. Orders ─────────────────────────────────────────────────────────────

  const orderId = { o1: createId(), o2: createId() };

  console.log('Inserting orders...');
  await db.insert(schema.orders).values([
    {
      id:             orderId.o1,
      userId:         userId.buyer1,
      status:         'paid',
      subtotal:       '599.99',
      totalAmount:    '599.99',
      discount:       '0',
      shippingCost:   '0',
      taxAmount:      '0',
      shippingAddress: '123 Main St, City',
      paymentMethod:  'stripe',
    },
    {
      id:             orderId.o2,
      userId:         userId.buyer2,
      status:         'delivered',
      subtotal:       '89.99',
      totalAmount:    '89.99',
      discount:       '0',
      shippingCost:   '0',
      taxAmount:      '0',
      shippingAddress: '456 Oak Ave, Town',
      paymentMethod:  'stripe',
    },
  ]).onConflictDoNothing();

  // Insert order items
  await db.insert(schema.orderItems).values([
    {
      orderId:        orderId.o1,
      productId:      prodId.p1,
      storeId:        storeId.s1,
      name:           'Smartphone Pro X',
      quantity:       1,
      price:          '599.99',
      commissionRate: '0.1000',
      commissionAmount: '59.99',
      subtotal:       '599.99',
    },
    {
      orderId:        orderId.o2,
      productId:      prodId.p3,
      storeId:        storeId.s1,
      name:           'Auriculares BT Pro',
      quantity:       1,
      price:          '89.99',
      commissionRate: '0.1000',
      commissionAmount: '8.99',
      subtotal:       '89.99',
    },
  ]).onConflictDoNothing();
  console.log('Order items inserted');

  // ── 6. Review aprobada (orden delivered) ────────────────────────────────
  // NOTA: reviews.schema.ts NO tiene campo orderId (se quitó el FK para evitar
  // dependencia cíclica reviews ← orders ← products). Usamos userId + productId.
  await db.insert(schema.reviews).values([
    {
      id:        createId(),
      productId: prodId.p3,
      userId:    userId.buyer2,
      rating:    5,
      title:     'Excelente calidad',
      body:      'Los auriculares superaron mis expectativas. Sonido cristalino.',
      status:    'approved',
    },
  ]).onConflictDoNothing();

  // ── 7. Cupón WELCOME10 ─────────────────────────────────────────────────────
  // NOTA: config.schema.ts usa campo 'active' (no 'isActive') y 'usedCount' (no 'usageCount')
  await db.insert(schema.coupons).values([
    {
      id:         createId(),
      code:       'WELCOME10',
      type:       'percentage',
      value:      '10.00',
      active:     true,
      startsAt:   new Date(),
      endsAt:     new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  ]).onConflictDoNothing();

  // ── 8. Banner hero ─────────────────────────────────────────────────────────
  // NOTA: config.schema.ts usa campo 'image' (no 'imageUrl'), 'url' (no 'linkUrl'),
  //       'active' (no 'isActive') y NO tiene 'sortOrder'
  await db.insert(schema.banners).values([
    {
      id:       createId(),
      title:    'Bienvenido a MarketFlux',
      image:    'https://placehold.co/1200x400/6366f1/white?text=MarketFlux',
      url:      '/search',
      position: 'hero',
      active:   true,
      startsAt: new Date(),
      endsAt:   new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  ]).onConflictDoNothing();

  // ── 9. MarketplaceConfig ─────────────────────────────────────────────────
  await db.insert(schema.marketplaceConfig).values([
    { id: createId(), key: 'commission_global_rate', value: '0.10' },
    { id: createId(), key: 'maintenance_mode',       value: 'false' },
    { id: createId(), key: 'review_auto_approve',    value: 'false' },
    { id: createId(), key: 'payout_schedule',        value: 'biweekly' },
    { id: createId(), key: 'vendor_onboarding_mode', value: 'manual' },
  ]).onConflictDoNothing();

  console.log('✅ Seed completed successfully');
  console.log('   Users: 6 | Stores: 2 | Categories: 3 | Products: 5 | Orders: 2 | Reviews: 1');
  console.log('   Coupon: WELCOME10 | Banner: hero | MarketplaceConfig: 5 keys');

  await pool.end();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await pool.end();
  process.exit(1);
});
