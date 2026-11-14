import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { User, Medicine, Supplier, Batch } from './models.js';

await connectDB();
await Promise.all([User.deleteMany({}), Medicine.deleteMany({}), Supplier.deleteMany({}), Batch.deleteMany({})]);

const admin = await User.create({ name: 'Demo Admin', email: 'admin@demo.pharmacy', password: await bcrypt.hash('Admin123!', 10), role: 'admin' });
await User.create({ name: 'Demo Staff', email: 'staff@demo.pharmacy', password: await bcrypt.hash('Staff123!', 10), role: 'staff' });
const supplier = await Supplier.create({ name: 'Sample Healthcare Supplies', phone: '9000000000', email: 'supplier@example.test', address: 'Demo address' });
const data = await Medicine.insertMany([
  { name: 'Paracetamol 500mg', sku: 'MED-001', category: 'Pain relief', reorderLevel: 20 },
  { name: 'Vitamin C 500mg', sku: 'MED-002', category: 'Supplement', reorderLevel: 15 },
  { name: 'Cetirizine 10mg', sku: 'MED-003', category: 'Allergy', reorderLevel: 10 }
]);
const now = new Date();
const inDays = n => new Date(now.getTime() + n * 86400000);
await Batch.insertMany([
  { medicine: data[0]._id, supplier: supplier._id, batchNumber: 'PCM-A101', quantity: 40, purchasePrice: 1.2, salePrice: 2, expiryDate: inDays(45) },
  { medicine: data[0]._id, supplier: supplier._id, batchNumber: 'PCM-B202', quantity: 80, purchasePrice: 1.3, salePrice: 2.2, expiryDate: inDays(220) },
  { medicine: data[1]._id, supplier: supplier._id, batchNumber: 'VTC-C303', quantity: 8, purchasePrice: 3, salePrice: 4.5, expiryDate: inDays(300) },
  { medicine: data[2]._id, supplier: supplier._id, batchNumber: 'CTZ-D404', quantity: 25, purchasePrice: 1, salePrice: 1.8, expiryDate: inDays(15) }
]);
console.log('Seed complete. Demo admin:', admin.email);
process.exit(0);
