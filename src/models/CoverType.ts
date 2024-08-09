

module.exports = (sequelize, DataTypes) => {

    const CoverType = sequelize.define("cover_types", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sum_insured: {
            type: DataTypes.STRING,
            allowNull: true
        },
        suminsured: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        premium: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        yearly_premium: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        yearpremium: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        last_expense_insured: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lastexpenseinsured: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        inpatient: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        outpatient: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        maternity: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        hospitalcash: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    },
        {
            timestamps: false
        }
);

    return CoverType;

}

