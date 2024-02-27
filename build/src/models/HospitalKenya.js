module.exports = (sequelize, DataTypes) => {
    const HospitalKenya = sequelize.define("hospitals_kenya", {
        hospital_id: {
            type: DataTypes.UUID,
            unique: true,
            primaryKey: true,
        },
        provider_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        speciality: {
            type: DataTypes.STRING,
            allowNull: true
        },
        region: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hospital_contact_person: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hospital_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hospital_contact: {
            type: DataTypes.STRING,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    });
    return HospitalKenya;
};
