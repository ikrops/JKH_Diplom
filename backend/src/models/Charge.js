const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Charge = sequelize.define(
    "Charge",
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
        period: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("unpaid", "paid"),
            allowNull: false,
            defaultValue: "unpaid",
        },
    },
    {
        tableName: "charges",
        timestamps: true,
    }
);

module.exports = Charge;