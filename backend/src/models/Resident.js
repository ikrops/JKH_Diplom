const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Resident = sequelize.define(
    "Resident",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        benefitPercent: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        apartmentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: "residents",
        timestamps: true,
    }
);

module.exports = Resident;