import mongoose, { Schema } from 'mongoose';

const transactionSchema = new Schema({
  transaction_id: { 
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
    unique: true,
    },

  amount: { type: Number, required: true },
  status: { type: String, required: true, default: "pending" },
  transaction_reference: { type: String, required: true },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    },
},
{ timestamps: true }
);



const TransactionModel = mongoose.model('Transaction', transactionSchema);

export default TransactionModel;
