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
        
    })

    Payment.belongsTo(sequelize.models.claim, {
        as: "claim",
        foreignKey: "claim_id",
    });
    sequelize.models.claim.hasMany(Payment, {
        as: "payments",
        foreignKey: "claim_id",
    });

    Payment.belongsTo(sequelize.models.user, {
        as: "user",
        foreignKey: "user_id",
    });

    sequelize.models.user.hasMany(Payment, {
        as: "payments",
        foreignKey: "user_id",
    });

    Payment.belongsTo(sequelize.models.policy, {
        as: "policy",
        foreignKey: "policy_id",
    });

    sequelize.models.policy.hasMany(Payment, {
        as: "payments",
        foreignKey: "policy_id",
    });
    return Payment
}


