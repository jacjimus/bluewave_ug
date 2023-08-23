import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';


const paymentSchema = new Schema({

  payment_id: { 
    type: Schema.Types.UUID,
    required: true,
    index: true,
    unique: true,
    default: () => {
      return uuidv4();
    },
  },
  claim_id: { type: Schema.Types.ObjectId, ref: 'Claim', required: false },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  policy_id: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },
  partner_id: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
  payment_date: { type: Date, required: true },
  payment_amount: { type: Number, required: true },
  payment_metadata: { type: Schema.Types.Mixed, required: false },
  payment_type: { type: String, required: true },
  payment_status: { type: String, required: true },
  payment_description: { type: String, required: true },
},
{ timestamps: true });



const PaymentModel = mongoose.model('Payment', paymentSchema);

export default PaymentModel;
