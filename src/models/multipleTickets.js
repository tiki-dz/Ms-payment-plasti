
module.exports = (sequelize, DataTypes) => {
  const MultipleTicket = sequelize.define('MultipleTicket', {
    idTicket: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  }, {
    timestamps: true,
    classMethods: {
      associate: function (models) {
        MultipleTicket.belongsTo(models.Purchase)
      }
    }
  })
  return MultipleTicket
}
