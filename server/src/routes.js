import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Medicine, Supplier, Batch, Sale, StockMovement } from './models.js';
import { protect, allowRoles } from './middleware/auth.js';
import { allocateFEFO } from './utils/fefo.js';

const router = Router();
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

router.post('/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

router.use(protect);
router.get('/auth/me', (req, res) => res.json({ user: req.user }));

router.get('/medicines', asyncRoute(async (req, res) => {
  const q = String(req.query.q || '');
  const filter = q ? { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { sku: new RegExp(escapeRegex(q), 'i') }] } : {};
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [items, total] = await Promise.all([
    Medicine.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
    Medicine.countDocuments(filter)
  ]);
  res.json({ items, page, pages: Math.ceil(total / limit), total });
}));
router.post('/medicines', allowRoles('admin'), asyncRoute(async (req, res) => {
  const { name, sku, category } = req.body;
  if (!name || !sku || !category) return res.status(400).json({ message: 'Name, SKU and category are required' });
  const item = await Medicine.create(req.body);
  res.status(201).json(item);
}));

router.get('/suppliers', asyncRoute(async (_req, res) => res.json(await Supplier.find().sort({ name: 1 }))));
router.post('/suppliers', allowRoles('admin'), asyncRoute(async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'Supplier name is required' });
  res.status(201).json(await Supplier.create(req.body));
}));

router.get('/batches', asyncRoute(async (req, res) => {
  const filter = {};
  if (req.query.medicine) filter.medicine = req.query.medicine;
  const items = await Batch.find(filter).populate('medicine', 'name sku').populate('supplier', 'name').sort({ expiryDate: 1 });
  res.json(items);
}));
router.post('/batches', allowRoles('admin'), asyncRoute(async (req, res) => {
  const { medicine, batchNumber, quantity, purchasePrice, salePrice, expiryDate } = req.body;
  if (!medicine || !batchNumber || !expiryDate || ![quantity, purchasePrice, salePrice].every(v => Number.isFinite(Number(v))) || Number(quantity) <= 0 || Number(purchasePrice) < 0 || Number(salePrice) < 0) {
    return res.status(400).json({ message: 'Valid medicine, batch, quantity, prices and expiry date are required' });
  }
  const session = await mongoose.startSession();
  let batch;
  try {
    await session.withTransaction(async () => {
      [batch] = await Batch.create([{ ...req.body, quantity: Number(quantity) }], { session });
      await StockMovement.create([{
        medicine, batch: batch._id, type: 'PURCHASE', quantityChange: Number(quantity),
        reason: 'Stock received', reference: batch.batchNumber, performedBy: req.user._id
      }], { session });
    });
  } finally { await session.endSession(); }
  res.status(201).json(batch);
}));

router.post('/sales', allowRoles('admin', 'staff'), asyncRoute(async (req, res) => {
  const { items, taxRate = 0 } = req.body;
  if (!Array.isArray(items) || !items.length || !Number.isFinite(Number(taxRate)) || Number(taxRate) < 0 || Number(taxRate) > 100) {
    return res.status(400).json({ message: 'Sale items and a tax rate from 0 to 100 are required' });
  }
  const session = await mongoose.startSession();
  let sale;
  try {
    await session.withTransaction(async () => {
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const saleItems = [];
      const movements = [];
      let subtotal = 0;

      for (const line of items) {
        const qty = Number(line.quantity);
        if (!line.medicine || !Number.isInteger(qty) || qty <= 0) throw new Error('Each sale quantity must be a positive whole number');
        const medicine = await Medicine.findById(line.medicine).session(session);
        if (!medicine) throw new Error('Medicine not found');
        const docs = await Batch.find({ medicine: medicine._id, quantity: { $gt: 0 } }).session(session);
        const allocations = allocateFEFO(docs, qty, today());
        for (const allocation of allocations) {
          const batch = allocation.batch;
          const updated = await Batch.findOneAndUpdate(
            { _id: batch._id, quantity: { $gte: allocation.quantity }, expiryDate: { $gte: today() } },
            { $inc: { quantity: -allocation.quantity } }, { new: true, session }
          );
          if (!updated) throw new Error('Stock changed during sale; please retry');
          const unitPrice = Number(batch.salePrice);
          const lineTotal = unitPrice * allocation.quantity;
          subtotal += lineTotal;
          saleItems.push({
            medicine: medicine._id, batch: batch._id, batchNumber: batch.batchNumber,
            medicineName: medicine.name, quantity: allocation.quantity, unitPrice, lineTotal
          });
          movements.push({
            medicine: medicine._id, batch: batch._id, type: 'SALE',
            quantityChange: -allocation.quantity, reason: 'Customer sale',
            reference: invoiceNumber, performedBy: req.user._id
          });
        }
      }
      const taxAmount = Number((subtotal * Number(taxRate) / 100).toFixed(2));
      [sale] = await Sale.create([{
        invoiceNumber, items: saleItems, subtotal, taxRate: Number(taxRate),
        taxAmount, total: Number((subtotal + taxAmount).toFixed(2)), createdBy: req.user._id
      }], { session });
      await StockMovement.insertMany(movements, { session });
    });
  } finally { await session.endSession(); }
  res.status(201).json(sale);
}));

router.post('/sales/:id/return', allowRoles('admin', 'staff'), asyncRoute(async (req, res) => {
  const { medicine, quantity, reason } = req.body;
  const qty = Number(quantity);
  if (!reason?.trim() || !medicine || !Number.isInteger(qty) || qty <= 0) return res.status(400).json({ message: 'Medicine, positive quantity and return reason are required' });
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const sale = await Sale.findById(req.params.id).session(session);
      if (!sale) throw new Error('Sale not found');
      const soldLines = sale.items.filter(i => String(i.medicine) === String(medicine));
      const returnableQty = soldLines.reduce((sum, line) => sum + (line.quantity - (line.returnedQuantity || 0)), 0);
      if (!soldLines.length || qty > returnableQty) throw new Error('Return quantity exceeds the unreturned quantity for this medicine');
      let remaining = qty;
      for (const line of soldLines) {
        if (!remaining) break;
        const stillReturnable = line.quantity - (line.returnedQuantity || 0);
        const take = Math.min(stillReturnable, remaining);
        if (take <= 0) continue;
        const batch = await Batch.findById(line.batch).session(session);
        if (!batch) throw new Error('Original batch no longer exists');
        batch.quantity += take;
        await batch.save({ session });
        line.returnedQuantity = (line.returnedQuantity || 0) + take;
        await StockMovement.create([{
          medicine: line.medicine, batch: batch._id, type: 'RETURN',
          quantityChange: take, reason: reason.trim(), reference: sale.invoiceNumber,
          performedBy: req.user._id
        }], { session });
        remaining -= take;
      }
      sale.returnedQuantity += qty;
      await sale.save({ session });
      result = sale;
    });
  } finally { await session.endSession(); }
  res.json(result);
}));

router.post('/inventory/adjustments', allowRoles('admin'), asyncRoute(async (req, res) => {
  const { batchId, quantityChange, reason } = req.body;
  const change = Number(quantityChange);
  if (!batchId || !Number.isInteger(change) || change === 0 || !reason?.trim()) return res.status(400).json({ message: 'Batch, non-zero whole quantity change and reason are required' });
  const session = await mongoose.startSession();
  let batch;
  try {
    await session.withTransaction(async () => {
      batch = await Batch.findOneAndUpdate(
        { _id: batchId, ...(change < 0 ? { quantity: { $gte: Math.abs(change) } } : {}) },
        { $inc: { quantity: change } }, { new: true, session }
      );
      if (!batch) throw new Error('Batch not found or adjustment would make stock negative');
      await StockMovement.create([{
        medicine: batch.medicine, batch: batch._id, type: 'ADJUSTMENT',
        quantityChange: change, reason: reason.trim(), reference: 'MANUAL',
        performedBy: req.user._id
      }], { session });
    });
  } finally { await session.endSession(); }
  res.json(batch);
}));

router.get('/inventory/movements', asyncRoute(async (_req, res) => {
  res.json(await StockMovement.find().populate('medicine', 'name sku').populate('batch', 'batchNumber').populate('performedBy', 'name').sort({ createdAt: -1 }).limit(200));
}));

router.get('/reports/dashboard', asyncRoute(async (_req, res) => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + Number(process.env.NEAR_EXPIRY_DAYS || 90));
  const [medicines, batches, sales, lowStock, nearExpiry] = await Promise.all([
    Medicine.countDocuments({ active: true }),
    Batch.find(),
    Sale.find({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    Medicine.aggregate([{ $lookup: { from: 'batches', localField: '_id', foreignField: 'medicine', as: 'b' } }, { $project: { name: 1, total: { $sum: '$b.quantity' }, reorderLevel: 1 } }, { $match: { $expr: { $lte: ['$total', '$reorderLevel'] } } }]),
    Batch.find({ expiryDate: { $gte: today(), $lte: cutoff }, quantity: { $gt: 0 } }).populate('medicine', 'name')
  ]);
  res.json({
    medicineCount: medicines, stockUnits: batches.reduce((s,b)=>s+b.quantity,0),
    stockValue: Number(batches.reduce((s,b)=>s+b.quantity*b.purchasePrice,0).toFixed(2)),
    todaySales: sales.length, todayRevenue: Number(sales.reduce((s,x)=>s+x.total,0).toFixed(2)),
    lowStock, nearExpiry
  });
}));
router.get('/reports/stock', asyncRoute(async (_req, res) => {
  const batches = await Batch.find().populate('medicine', 'name sku category').sort({ expiryDate: 1 });
  res.json(batches.map(b => ({ medicine: b.medicine?.name, sku: b.medicine?.sku, batch: b.batchNumber, quantity: b.quantity, purchasePrice: b.purchasePrice, value: b.quantity*b.purchasePrice, expiryDate: b.expiryDate })));
}));
router.get('/reports/sales', asyncRoute(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setDate(new Date().getDate()-30));
  const to = req.query.to ? new Date(req.query.to) : new Date();
  res.json(await Sale.find({ createdAt: { $gte: from, $lte: to } }).sort({ createdAt: -1 }).populate('createdBy', 'name'));
}));

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export default router;
