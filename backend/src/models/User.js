const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
    "User",
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
        login: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("admin", "employee", "accountant", "resident"),
            allowNull: false,
            defaultValue: "resident",
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "users",
        timestamps: true,
    }
);

module.exports = User;