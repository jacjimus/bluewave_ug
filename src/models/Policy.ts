module.exports = (sequelize, DataTypes) => {
    const Policy = sequelize.define("policy", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        policy_start_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_status: {
            type: DataTypes.STRING,
            allowNull: false

        },
        beneficiary: {
            type: DataTypes.STRING,
            allowNull: false
        },
        policy_type: {
            type: DataTypes.STRING,
            allowNull: false

        },
        policy_end_date: {
            type: DataTypes.DATE,
            allowNull: false

        },
        policy_deduction_amount: {
            type: DataTypes.NUMBER,
            allowNull: false
        },
        policy_next_deduction_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_deduction_day: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        installment_order: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        installment_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        installment_alert_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        tax_rate_vat: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        tax_rate_ext: {
            type: DataTypes.NUMBER,
            allowNull: true
        } ,
        premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        sum_insured: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        excess_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        discount_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        }
    },

        { timestamps: true },)  

    Policy.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(Policy, {
        foreignKey: "user_id",
    });

    return Policy
}
//  User.hasMany(Policy, { foreignKey: 'user_id' });
//  Policy.belongsTo(User, { foreignKey: 'user_id' });

