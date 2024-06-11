
module.exports = (sequelize, DataTypes) => {
    const Packages = sequelize.define("packages", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        family_cover_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cover_type_id: {
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
        sum_insured: {
            type: DataTypes.STRING,
            allowNull: true
        },
        suminsured: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        last_expense_insured: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lastexpenseinsured: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        year_premium: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        inpatient_cover: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        outpatient_cover: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        hospital_cash: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        maternity: {
            type: DataTypes.NUMERIC,
            allowNull: true
        }
    },
        {
            timestamps: false,
        }

    );
    Packages.associate = models => {
        Packages.belongsTo(models.FamilyCover, { foreignKey: 'family_cover_id' });
        Packages.belongsToMany(models.PaymentOption, { through: 'PackagePaymentOptions', foreignKey: 'package_id' });
    };

    return Packages;
}