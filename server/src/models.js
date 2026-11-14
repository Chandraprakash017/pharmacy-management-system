import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' }
}, { timestamps: true });

const medicineSchema = new Schema({
  name: { type: String, required: true, trim: true, index: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  category: { type: String, required: true },
  unit: { type: String, default: 'strip' },
  reorderLevel: { type: Number, default: 10, min: 0 },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const supplierSchema = new Schema({
  name: { type: String, required: true, trim: true },
  phone: String,
  email: String,
  address: String
}, { timestamps: true });

const batchSchema = new Schema({
  medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  batchNumber: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true, index: true },
  receivedAt: { type: Date, default: Date.now }
}, { timestamps: true });
batchSchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });

const saleSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  items: [{
    medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNumber: String,
    medicineName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    returnedQuantity: { type: Number, default: 0, min: 0 }
  }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  taxAmount: { type: Number, required: true },
  total: { type: Number, required: true },
  returnedQuantity: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const movementSchema = new Schema({
  medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  type: { type: String, enum: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT'], required: true },
  quantityChange: { type: Number, required: true },
  reason: { type: String, required: true },
  reference: String,
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const User = model('User', userSchema);
export const Medicine = model('Medicine', medicineSchema);
export const Supplier = model('Supplier', supplierSchema);
export const Batch = model('Batch', batchSchema);
export const Sale = model('Sale', saleSchema);
export const StockMovement = model('StockMovement', movementSchema);
