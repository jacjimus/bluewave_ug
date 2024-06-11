
module.exports = (sequelize, DataTypes) => {
    const PaymentOption = sequelize.define("payment_options", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        package_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        premium: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        yearly_premium: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        installment_type: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        period: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
        {
            timestamps: false
        }
    );

    PaymentOption.associate = models => {
        PaymentOption.belongsToMany(models.Packages, { through: 'PackagePaymentOptions', foreignKey: 'payment_option_id' });
    };


    return PaymentOption;
}