"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require('mongoose');
module.exports = (sequelize, DataTypes) => {
    const Logs = sequelize.define("log", {
        log_id: {
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
            primaryKey: true,
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: true
        },
        message: {
            type: DataTypes.STRING,
            allowNull: true
        },
        level: {
            type: DataTypes.STRING,
            defaultValue: 'info',
            allowNull: false // Added allowNull property
        },
        meta: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
        user: {
            type: DataTypes.UUID,
            allowNull: true
        },
        session: {
            type: DataTypes.UUID,
            allowNull: true
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
    }, { timestamps: true });
    return Logs;
};
