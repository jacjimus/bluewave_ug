module.exports = (sequelize, DataTypes) => {
    const UserHospital = sequelize.define("user_hospital", {
        user_hospital_id: {
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        hospital_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        hospital_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hospital_address: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hospital_phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hospital_email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hospital_contact_person: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hospital_contact_person_phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
    });
    UserHospital.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(UserHospital, {
        foreignKey: "user_id",
    });
    return UserHospital;
};
