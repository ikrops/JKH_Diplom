const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AuditLog = sequelize.define(
    "AuditLog",
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: true },
        userLogin: { type: DataTypes.STRING, allowNull: true },
        userRole: { type: DataTypes.STRING, allowNull: true },
        action: { type: DataTypes.STRING, allowNull: false },
        entity: { type: DataTypes.STRING, allowNull: true },
        entityId: { type: DataTypes.INTEGER, allowNull: true },
        details: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "audit_logs", timestamps: true }
);

module.exports = AuditLog;
