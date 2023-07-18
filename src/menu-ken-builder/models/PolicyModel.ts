import mongoose, { Document, Schema } from 'mongoose';


const policySchema = new Schema({
    product_id: {
        type:
            Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },

    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    parner_id: { type: Number, required: true },
    policy_start_date: { type: Date, required: true },
    policy_status: { type: String, required: true },
    beneficiary_id: { type: Schema.Types.ObjectId, ref: 'Beneficiary', required: true },
    policy_type: { type: String, required: true },
    policy_end_date: { type: Date, required: true },
    policy_deduction_amount: { type: Number, required: true },
    policy_next_deduction_date: { type: Date, required: true },
    policy_deduction_day: { type: Number, required: true },
    installment_order: { type: Number, required: true  },
    installment_date: { type: Date },
    installment_alert_date: { type: Date },
    tax_rate_vat: { type: Number },
    tax_rate_ext: { type: Number },
    premium: { type: Number },
    country_code: { type: String , required: true },
    currency_code: { type: String, required: true  },
    sum_insured: { type: Number , required: true },
    excess_premium: { type: Number },
    discount_premium: { type: Number },
}, { timestamps: true });


const PolicyModel = mongoose.model('Policy', policySchema);

export default PolicyModel;
