
module.exports = (sequelize, DataTypes) => {
    const FamilyCover = sequelize.define("family_covers", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code_name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        timestamps: false
    
    });

    FamilyCover.associate = models => {
        FamilyCover.hasMany(models.Packages, { foreignKey: 'family_cover_id' });
      };

    return FamilyCover;
}



