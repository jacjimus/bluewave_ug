import { v4 as uuid } from "uuid";

module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define( "transaction", {
        transaction_id: {
            type: DataTypes.UUID,
            defaultValue: uuid(),
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
            type: DataTypes.STRING,
            allowNull: false
        },

        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        beneficiary_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        policy_id:{
            type: DataTypes.UUID,
            allowNull: false
        },
        partner_id:{
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
    })
    Transaction.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
        });
        sequelize.models.user.hasMany(Transaction, {
        foreignKey: "user_id",
        });
    
        Transaction.belongsTo(sequelize.models.beneficiary, {
        foreignKey: "beneficiary_id",
        });
        sequelize.models.beneficiary.hasMany(Transaction, {
        foreignKey: "beneficiary_id",
        });
        
    
    return Transaction
    }
