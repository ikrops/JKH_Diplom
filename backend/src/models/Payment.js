const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define(
    "Payment",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        chargeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        paymentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "cash",
        },
    },
    {
        tableName: "payments",
        timestamps: true,
    }
);

module.exports = Payment;