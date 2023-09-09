"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4_1 = require("uuidv4");
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
        user_id: {
            type: DataTypes.UUID,
            defaultValue: (0, uuidv4_1.uuid)(),
            primaryKey: true,
        },
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
        },
        membership_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
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
            enum: ["user", "admin", "superadmin", "partner", "manager", "agent"],
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
        number_of_policies: {
            type: DataTypes.INTEGER,
            default: 0
        }
    }, { timestamps: true });
    return User;
};
