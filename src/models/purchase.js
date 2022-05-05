
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
    }
  }, {
    timestamps: true
  })

  return Purchase
}
