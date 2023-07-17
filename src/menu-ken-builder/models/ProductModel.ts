import mongoose, { Schema } from 'mongoose';


const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  status: { type: String, required: true },
  duration: { type: Number, required: true },
  underwriter: { type: String, required: true },
  premiums: [{
    familySize: { type: String, required: true },
    principal: { type: Number, required: true },
    m1: { type: Number, required: true },
    m2: { type: Number, required: true },
    m3: { type: Number, required: true },
    m4: { type: Number, required: true },
    m5: { type: Number, required: true },
    m6: { type: Number, required: true },
  }],
  benefits: [{
    option: { type: String, required: true },
    annualLimitPerPerson: { type: String, required: true },
    lastExpensePerPerson: { type: String, required: true },
  }],
  partner_id: { type: Number, required: true },
});


const ProductModel = mongoose.model('Product', productSchema);

export default ProductModel;


