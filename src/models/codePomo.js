
module.exports = (sequelize, DataTypes) => {
  const CodePromo = sequelize.define('CodePromo', {
    idCodePromo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    use: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    idAdmin: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    timestamps: true,
    classMethods: {
      associate: function (models) {
        CodePromo.hasOne(models.Purchase)
      }
    }
  })

  return CodePromo
}
