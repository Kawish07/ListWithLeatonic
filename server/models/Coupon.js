import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  title: { type: String, required: true },
  planName: { type: String, required: true },
  price: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  planDuration: { type: String, required: true },
  referralFee: { type: Number, required: true },
  paymentLink: { type: String, required: true },
  code: { type: String, required: true, unique: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
