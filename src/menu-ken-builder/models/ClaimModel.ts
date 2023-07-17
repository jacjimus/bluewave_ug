import mongoose, { Document, Schema } from 'mongoose';



const claimSchema = new Schema({
  policy_id: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },
  claim_date: { type: Date },
  claim_status: { type: String },
  claim_amount: { type: Number },
  claim_description: { type: String },
  claim_type: { type: String },
  claim_documents: { type: [String], default: [] },
  claim_comments: { type: String },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parner_id: { type: Number, required: true },

},
{ timestamps: true });


const ClaimModel = mongoose.model('Claim', claimSchema);

export default ClaimModel;
