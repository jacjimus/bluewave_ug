module.exports = (sequelize, DataTypes) => {
    const Beneficiary = sequelize.define("beneficiary", {
        beneficiary_id: {
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
            primaryKey: true,
        },
        full_name: {
            type: DataTypes.STRING,
        },
        relationship: {
            type: DataTypes.STRING,
        },
        national_id: {
            type: DataTypes.INTEGER,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });
    Beneficiary.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(Beneficiary, {
        foreignKey: "user_id",
    });
    return Beneficiary;
};
