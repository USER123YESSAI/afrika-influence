// backend/models/tokenRevoque.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TokenRevoque = sequelize.define('TokenRevoque', {
    jti: { type: DataTypes.STRING(64), primaryKey: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  }, {
    tableName: 'tokens_revoques',
    timestamps: false,
  });
  return TokenRevoque;
};