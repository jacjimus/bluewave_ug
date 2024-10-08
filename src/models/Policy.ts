import { Sequelize } from "sequelize";
import { db } from "../models/db";
import { uuid } from 'uuidv4';
import moment from 'moment';

module.exports = (sequelize, DataTypes) => {
    const Policy = sequelize.define("policy", {
        policy_id: {
            type: DataTypes.UUID,
            defaultValue: uuid(),
            unique: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        policy_status: {
            type: DataTypes.STRING,
            defaultValue: "pending",
            allowNull: true,
            enum: ["pending", "paid", "expired", 'unpaid', 'cancelled']

        },
        beneficiary: {
            type: DataTypes.STRING,
            allowNull: true,
            enum: ["SELF", "FAMILY", "OTHER"]
        },
        policy_type: {
            type: DataTypes.STRING,
            allowNull: false,
            enum: ["S MINI", "MINI", "MIDI", "BIGGIE", "BAMBA", "ZIDI", "SMARTA", "COMPREHENSIVE", "FT", "TPO"]
        },
        policy_start_date: {
            type: DataTypes.DATE,
            defaultValue: moment().toDate(),
            allowNull: false
        },
        policy_end_date: {
            type: DataTypes.DATE,
            defaultValue: new Date(moment().toDate().setFullYear(moment().toDate().getFullYear() + 1, moment().toDate().getMonth(), moment().toDate().getDate() - 1)),
            allowNull: true

        },
        policy_deduction_amount: {
            type: DataTypes.NUMBER,
            allowNull: true,
            defaultValue: 0
        },
        policy_next_deduction_date: {
            type: DataTypes.DATE,
            allowNull: true,
            default: new Date(moment().toDate().setFullYear(moment().toDate().getFullYear() + 1, moment().toDate().getMonth(), moment().toDate().getDate() - 1))
        },
        policy_deduction_day: {
            type: DataTypes.INTEGER,
            defaultValue: moment().toDate().getDate() - 1,
            allowNull: true
        },
        installment_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // monthly
        },
        installment_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
            enum: [1, 2]  // 1 = annual, 2 = monthly
        },
        installment_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: new Date(moment().toDate().setFullYear(moment().toDate().getFullYear() + 1, moment().toDate().getMonth(), moment().toDate().getDate() - 3))
        },
        installment_alert_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: new Date(moment().toDate().setFullYear(moment().toDate().getFullYear() + 1, moment().toDate().getMonth(), moment().toDate().getDate() - 3))
        },

        premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        yearly_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        sum_insured: {
            type: DataTypes.NUMBER,
            allowNull: true,
            defaultValue: 0
        },
        last_expense_insured: {
            type: DataTypes.NUMBER,
            allowNull: true
        },

        currency_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country_code: {
            type: DataTypes.STRING,
            allowNull: true
        },

        policy_documents: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true
        },
        policy_paid_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        cancelled_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        policy_paid_amount: {
            type: DataTypes.NUMBER,
            allowNull: true,
            defaultValue: 0
        },
        policy_pending_premium: {
            type: DataTypes.NUMBER,
            allowNull: true,
            defaultValue: 0
        },
        arr_policy_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        bought_for: {
            type: DataTypes.UUID,
            allowNull: true
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true

        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        membership_id: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        total_member_number: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'M'
        },
        airtel_money_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        airtel_transaction_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        bluewave_transaction_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        airtel_transaction_ids: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            default: []
        },

        dependant_member_numbers: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            default: []
        },
        inpatient_cover: {
            type: DataTypes.NUMBER,
            allowNull: true,
            default: 0
        },
        outpatient_cover: {
            type: DataTypes.NUMBER,
            allowNull: true,
            default: 0
        },
        hospital_cash: {
            type: DataTypes.NUMBER,
            allowNull: true,
            default: 0
        },
        maternity_cover: {
            type: DataTypes.NUMBER,
            allowNull: true,
            default: 0
        },
        policy_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_cancelled: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        is_expired: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        referral_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
    },

        { timestamps: true },)
    Policy.associate = (models: any) => {
        Policy.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Policy.hasMany(models.Payment, { foreignKey: 'policy_id', as: 'payments' });
    };


    return Policy
}


//A.hasOne(B) and B.belongsTo(A)
