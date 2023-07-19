module.exports = (sequelize, DataTypes) => {
    const Partner = sequelize.define("partner", {
        partner_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        partner_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        business_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        business_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        business_category: {
            type: DataTypes.STRING,
            allowNull: true
        },
        business_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            isEmail: true,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            default: true
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            default: false
        },
    }, { timestamps: true });
    return Partner;
};
//example of a model
// {
//     "id": "6492e21e428f748ba7008f91",
//     "tenant_name": "Vodacom",
//     "tenant_id": "1",
//     "business_name": "Vodacom",
//     "business_type": "Telecom",
//     "business_category": "insurance",
//     "business_address": "Dar es salaam",
//     "country": "Tanzania",
//     "email": "info@vodacom.com",
//     "phone_number": "255754000000",
//     "is_active": true,
//     "is_verified": true,
// }
