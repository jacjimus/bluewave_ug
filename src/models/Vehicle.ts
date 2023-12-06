module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define("vehicle", {
        vehicle_id: {
            type: DataTypes.UUID,
            autoIncrement: true,
            primaryKey: true,
        },
        vehicle_make: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vehicle_model: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vehicle_year: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        vehicle_vin: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vehicle_category:{
            type: DataTypes.STRING,
            allowNull: true
        },
        vehicle_license_plate: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vehicle_registration: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vehicle_registration_expiration: {
            type: DataTypes.DATE,
            allowNull: true
        },
        vehicle_insurance_expiration: {
            type: DataTypes.DATE,
            allowNull: true
        },
        vehicle_purchase_price: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        vehicle_mileage: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        vehicle_documents: {
            type: DataTypes.ARRAY(DataTypes.STRING), // Update to ARRAY of strings
            allowNull: true,
            defaultValue: [] // Set an empty array as the default value
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        policy_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
    }, {
        timestamps: false
    });

    return Vehicle;
}

