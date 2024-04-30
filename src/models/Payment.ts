import { v4 as uuid } from "uuid";
module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define("payment", {
        payment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        claim_id: {
            type: DataTypes.INTEGER,
            allowNull:  true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        policy_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        payment_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        payment_amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        payment_metadata: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        payment_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        payment_status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        payment_description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        airtel_transaction_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        
        
    })

    Payment.associate = (models: any) => {
        Payment.belongsTo(models.User, { foreignKey: 'user_id' , as: 'user'});
        Payment.belongsTo(models.Policy, { foreignKey: 'policy_id', as: 'policy'});
    };
    return Payment
}


