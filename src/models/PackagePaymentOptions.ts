module.exports = (sequelize, DataTypes) => {
    const PackagePaymentOptions = sequelize.define('PackagePaymentOptions', {
        package_id: DataTypes.INTEGER,
        payment_option_id: DataTypes.INTEGER,
    });

    return PackagePaymentOptions;
};
