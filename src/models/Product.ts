//insurance product model
module.exports = (sequelize, DataTypes) => {

    const Product = sequelize.define("product", {
    
        product_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        product_description: {
            type: DataTypes.STRING,
            allowNull: false
        },

        product_type: {
            type: DataTypes.STRING,
            allowNull: false
        },

        product_category: {
            type: DataTypes.STRING,
            allowNull: false
        },

        product_premium: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        product_image: {
            type: DataTypes.STRING,
            allowNull: false
        },

        product_status: {
            type: DataTypes.STRING,
            allowNull: false
        },

        product_duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        underwriter: {
            type: DataTypes.STRING,
            allowNull: false
        }


    })
    return Product
}






