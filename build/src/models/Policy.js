"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const uuidv4_1 = require("uuidv4");
const User = db_1.db.users;
module.exports = (sequelize, DataTypes) => {
    const Policy = sequelize.define("policy", {
        policy_id: {
            type: DataTypes.UUID,
            defaultValue: (0, uuidv4_1.uuid)(),
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
            allowNull: false
        },
        beneficiary: {
            type: DataTypes.STRING,
            allowNull: false
        },
        policy_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        policy_end_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_deduction_amount: {
            type: DataTypes.NUMBER,
            allowNull: false
        },
        policy_next_deduction_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_deduction_day: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        installment_order: {
            type: DataTypes.INTEGER,
            allowNull: true
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
        excess_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        discount_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        hospital_details: {
            type: DataTypes.JSONB,
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
        }
    }, { timestamps: true });
    Policy.belongsTo(User, {
        as: "user",
        foreignKey: "user_id",
    });
    return Policy;
};
//A.hasOne(B) and B.belongsTo(A)
