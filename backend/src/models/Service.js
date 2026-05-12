const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Service = sequelize.define(
    "Service",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        calculationType: {
            type: DataTypes.ENUM("meter", "area", "resident"),
            allowNull: false,
            defaultValue: "meter",
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "services",
        timestamps: true,
    }
);

module.exports = Service;