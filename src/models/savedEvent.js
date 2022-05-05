
module.exports = (sequelize, DataTypes) => {
  const SavedEvent = sequelize.define('SavedEvent', {
    idEvent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    idClient: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true
  })

  return SavedEvent
}
