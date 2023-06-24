
module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define( "payment", {
        payment_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        claim_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        
        policy_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: false
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
    return Payment
}


// example of a payment object payload
