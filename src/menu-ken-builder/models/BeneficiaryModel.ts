import mongoose, { Document, Schema } from 'mongoose';



const beneficiarySchema = new Schema({
  full_name: { type: String },
  relationship: { type: String },
  national_id: { type: Number },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  age: { type: Number },
  dob: { type: Date },
  birth_cert: { type: String },
},
{ timestamps: true });


const BeneficiaryModel = mongoose.model('Beneficiary', beneficiarySchema);

export default BeneficiaryModel;
