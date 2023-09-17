"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Sequelize } = require("sequelize");
const { db } = require("../models/db");
const uuid_1 = require("uuid");
const User = db.users;
const Policy = db.policies;
const Installment = db.installments;
module.exports = (sequelize, DataTypes) => {
    const Installment = sequelize.define("installment", {
        installment_id: {
            type: DataTypes.UUID,
            defaultValue: (0, uuid_1.v4)(),
            unique: true,
            primaryKey: true,
        },
        policy_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        installment_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        installment_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        installment_alert_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        tax_rate_vat: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        tax_rate_ext: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        installment_deduction_amount: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        premium: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        sum_insured: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        excess_premium: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        discount_premium: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        currency_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        country_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });
    Installment.belongsTo(Policy, {
        as: "policy",
        foreignKey: "policy_id",
    });
    Policy.hasMany(Installment, {
        as: "installments",
        foreignKey: "policy_id",
    });
    return Installment;
};
