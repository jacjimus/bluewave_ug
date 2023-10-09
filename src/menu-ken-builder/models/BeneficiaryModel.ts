import mongoose, { Document, Schema } from 'mongoose';



const beneficiarySchema = new Schema({
  full_name: { type: String },
  first_name: { type: String },
  middle_name: { type: String },
  last_name: { type: String },
  status: { type: String },
  relationship: { type: String },
  national_id: { type: Number },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  age: { type: Number },
  dob: { type: Date },
  birth_cert: { type: String },
  date_of_death: { type: Date },
  beneficiary_type: { type: String },
  phone_number: { type: String },
},
{ timestamps: true });


const BeneficiaryModel = mongoose.model('Beneficiary', beneficiarySchema);

export default BeneficiaryModel;
