
module.exports = (sequelize, DataTypes) => {
  const Purchase = sequelize.define('Purchase', {
    idPurchase: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    idClient: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    idEvent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nbTickets: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    codePromo: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    timestamps: true,
    classMethods: {
      associate: function (models) {
        Purchase.hasMany(models.MultipleTicket)
      }
    }
  })

  return Purchase
}