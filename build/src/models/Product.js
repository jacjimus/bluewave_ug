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
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        underwriter: {
            type: DataTypes.STRING,
            allowNull: false
        },
        benefits: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true
        },
        currency_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        annual_premium: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        monthly_premium: {
            type: DataTypes.JSONB,
            allowNull: true
        },
    });
    Product.hasMany(sequelize.models.policy, {
        as: "policies",
        foreignKey: "product_id",
    });
    sequelize.models.policy.belongsTo(Product, {
        as: "product",
        foreignKey: "product_id",
    });
    return Product;
};
