"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const Claim = db_1.db.claims;
const User = db_1.db.users;
const Policy = db_1.db.policies;
const Partner = db_1.db.partners;
const Product = db_1.db.products;
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
        id: {
            //BIGINT PRIMARY KEY 
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        middle_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        dob: {
            type: DataTypes.DATE,
            allowNull: true
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        marital_status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        addressline: {
            type: DataTypes.STRING,
            allowNull: true
        },
        nationality: {
            type: DataTypes.STRING,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        pinzip: {
            type: DataTypes.STRING,
            allowNull: true
        },
        weight: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        height: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            isEmail: true,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        national_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.STRING,
            allowNull: true,
            default: "user"
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            default: true
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            default: false
        },
        pin: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        driver_licence: {
            type: DataTypes.STRING,
            allowNull: true
        },
        voter_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, { timestamps: true });
    // User.hasMany(Policy, {
    //     as: 'policies',
    //     foreignKey: "policy_id",
    // });
    // Policy.belongsTo(User, {
    //     as: 'user',
    //     foreignKey: "user_id",
    // });
    return User;
};
