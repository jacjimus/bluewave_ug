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
        first_name: {
            type: DataTypes.STRING,
        },
        last_name: {
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
        },
        dob: {
            type: DataTypes.DATE,
            allowNull: true
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "pending"
        },
    });
    Beneficiary.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(Beneficiary, {
        foreignKey: "user_id",
    });
    return Beneficiary;
};
