const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Tariff = sequelize.define(
    "Tariff",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    },
    {
        tableName: "tariffs",
        timestamps: true,
    }
);

module.exports = Tariff;