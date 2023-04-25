module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define( "user", {
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            isEmail: true, //checks for email format
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
        national_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.STRING,
            allowNull: true,
            default: "user"
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
        pin: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
       
    }, {timestamps: true}, )
    return User
 }