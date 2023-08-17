module.exports = (sequelize, DataTypes) => {
    const Beneficiary = sequelize.define("beneficiary", {
        beneficiary_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
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
            type: DataTypes.INTEGER,
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
        gender: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
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
