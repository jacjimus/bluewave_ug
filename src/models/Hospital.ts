
import { uuid } from 'uuidv4';
module.exports = (sequelize, DataTypes) => {
    const Hospital = sequelize.define("hospital", {
        hospital_id: {
            type: DataTypes.UUID,
            defaultValue: uuid(),
            unique: true,
            primaryKey: true,
        },
        district: {
            type: DataTypes.STRING,
            allowNull: true

        },
        region: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hospital_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        category: {
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
        country: {
            type: DataTypes.STRING,
            allowNull: true
        },
    
    })
   
    return Hospital
}






