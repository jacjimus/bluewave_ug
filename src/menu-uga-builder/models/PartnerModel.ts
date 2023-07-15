import mongoose, { Document, Schema } from 'mongoose';


const partnerSchema = new Schema({
  parner_id: { type: Number, required: true },
  partner_name: { type: String },
  business_name: { type: String },
  business_type: { type: String },
  business_category: { type: String },
  business_address: { type: String },
  country: { type: String },
  email: { type: String, unique: true, required: true, isEmail: true },
  password: { type: String, required: true },
  phone_number: { type: String },
  is_active: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
}, { timestamps: true });

const PartnerModel = mongoose.model('Partner', partnerSchema);

export default  PartnerModel;
