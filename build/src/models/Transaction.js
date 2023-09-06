"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define("transaction", {
        transaction_id: {
            type: DataTypes.UUID,
            defaultValue: (0, uuid_1.v4)(),
            primaryKey: true,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending"
        },
        transaction_reference: {
            type: DataTypes.UUID,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        policy_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });
    Transaction.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(Transaction, {
        foreignKey: "user_id",
    });
    Transaction.belongsTo(sequelize.models.policy, {
        foreignKey: "policy_id",
    });
    sequelize.models.policy.hasMany(Transaction, {
        foreignKey: "policy_id",
    });
    Transaction.belongsTo(sequelize.models.partner, {
        foreignKey: "partner_id",
    });
    sequelize.models.partner.hasMany(Transaction, {
        foreignKey: "partner_id",
    });
    return Transaction;
};
