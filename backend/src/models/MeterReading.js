const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MeterReading = sequelize.define(
    "MeterReading",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        apartmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        previousValue: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        currentValue: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        readingDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        tableName: "meter_readings",
        timestamps: true,
    }
);

module.exports = MeterReading;