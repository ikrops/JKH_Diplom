const sequelize = require("../config/db");

const User = require("./User");
const Resident = require("./Resident");
const Apartment = require("./Apartment");
const Service = require("./Service");
const Tariff = require("./Tariff");
const MeterReading = require("./MeterReading");
const Charge = require("./Charge");
const Payment = require("./Payment");
const AuditLog = require("./AuditLog");

Apartment.hasMany(Resident, {
    foreignKey: "apartmentId",
    as: "residents",
});

Resident.belongsTo(Apartment, {
    foreignKey: "apartmentId",
    as: "apartment",
});

User.hasOne(Resident, {
    foreignKey: "userId",
    as: "resident",
});

Resident.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
});

Service.hasMany(Tariff, {
    foreignKey: "serviceId",
    as: "tariffs",
});

Tariff.belongsTo(Service, {
    foreignKey: "serviceId",
    as: "service",
});

Apartment.hasMany(MeterReading, {
    foreignKey: "apartmentId",
    as: "meterReadings",
});

MeterReading.belongsTo(Apartment, {
    foreignKey: "apartmentId",
    as: "apartment",
});

Service.hasMany(MeterReading, {
    foreignKey: "serviceId",
    as: "meterReadings",
});

MeterReading.belongsTo(Service, {
    foreignKey: "serviceId",
    as: "service",
});

Apartment.hasMany(Charge, {
    foreignKey: "apartmentId",
    as: "charges",
});

Charge.belongsTo(Apartment, {
    foreignKey: "apartmentId",
    as: "apartment",
});

Service.hasMany(Charge, {
    foreignKey: "serviceId",
    as: "charges",
});

Charge.belongsTo(Service, {
    foreignKey: "serviceId",
    as: "service",
});

Charge.hasMany(Payment, {
    foreignKey: "chargeId",
    as: "payments",
});

Payment.belongsTo(Charge, {
    foreignKey: "chargeId",
    as: "charge",
});

module.exports = {
    sequelize,
    User,
    Resident,
    Apartment,
    Service,
    Tariff,
    MeterReading,
    Charge,
    Payment,
    AuditLog,
};