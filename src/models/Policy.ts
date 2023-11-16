import { Sequelize } from "sequelize";
import { db } from "../models/db";
import { uuid } from 'uuidv4';

const User = db.users;
const Payment = db.payments;
const Policy = db.policies;

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
            allowNull: true
            
        },
        beneficiary: {
            type: DataTypes.STRING,
            allowNull: true
        },
        policy_type: {
            type: DataTypes.STRING,
            allowNull: false,
            enum: ["MINI", "MIDI", "BIGGIE"]
        },
        policy_start_date: {
            type: DataTypes.DATE,
            defaultValue: new Date(),
            allowNull: false
        },
        policy_end_date: {
            type: DataTypes.DATE,
            defaultValue: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
            allowNull: true

        },
        policy_deduction_amount: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        policy_next_deduction_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        policy_deduction_day: {
            type: DataTypes.INTEGER,
            defaultValue: new Date().getDate() - 1,
            allowNull: true
        },
        installment_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11, 12] // monthly
        },
        installment_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
            enum: [1, 2]  // 1 = annual, 2 = monthly
        },
        installment_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        installment_alert_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        tax_rate_vat: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        tax_rate_ext: {
            type: DataTypes.NUMBER,
            allowNull: true
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
            allowNull: true
        },
        last_expense_insured: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        excess_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        discount_premium: {
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
        // TEXT []
        policy_documents: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true

        },
        policy_paid_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        policy_paid_amount: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        policy_pending_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
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
            allowNull: true
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
      renewal_date: {
            type: DataTypes.DATE,
            allowNull: true
      },
        renewal_order: {
            type: DataTypes.NUMBER,
            allowNull: true
        },  
        renewal_status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dependant_member_numbers: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true
        },
        inpatient_cover: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        outpatient_cover: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        hospital_cash: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        maternity_cover: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        
    },

        { timestamps: true },)

    Policy.belongsTo(User, {
        as: "user",
        foreignKey: "user_id",
    });
    User.hasMany(Policy, {
        as: "policies",
        foreignKey: "user_id",
    });

    return Policy
}


//A.hasOne(B) and B.belongsTo(A)
