const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Apartment = sequelize.define(
    "Apartment",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        houseAddress: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        apartmentNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        area: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        residentsCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    },
    {
        tableName: "apartments",
        timestamps: true,
    }
);

module.exports = Apartment;