const mongoose = require('mongoose');
import { v4 as uuid } from "uuid";

module.exports = (sequelize: any, DataTypes: any) => {
    const Logs = sequelize.define("log", {
        log_id: {
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
            primaryKey: true,
            
        },
        timestamp: {
            type: DataTypes.DATE, // Corrected data type
            allowNull: true
        },
        message: {
            type: DataTypes.STRING, // Corrected data type
            allowNull: true
        },
        level: {
            type: DataTypes.STRING, // Corrected data type
            defaultValue: 'info', // Corrected default value
            allowNull: false // Added allowNull property
        },
        meta: {
            type: DataTypes.JSON, // Changed to JSON data type
            defaultValue: {},
        },
        user: {
            type: DataTypes.UUID, // Changed to UUID data type
            allowNull: true
        },
        session: {
            type: DataTypes.UUID, // Changed to UUID data type
            allowNull: true
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
    }, { timestamps: true });

    return Logs;
}
