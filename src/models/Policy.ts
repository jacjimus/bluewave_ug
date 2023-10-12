import { Sequelize } from "sequelize";
import { db } from "../models/db";
import { uuid } from 'uuidv4';

const User = db.users;

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
        policy_start_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_status: {
            type: DataTypes.STRING,
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
        policy_end_date: {
            type: DataTypes.DATE,
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
