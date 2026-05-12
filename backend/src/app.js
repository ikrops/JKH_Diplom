const express = require("express");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const path = require("path");
require("dotenv").config();

const sequelize = require("./config/db");

require("./models");

const authRoutes = require("./routes/authRoutes");
const residentRoutes = require("./routes/residentRoutes");
const apartmentRoutes = require("./routes/apartmentRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const tariffRoutes = require("./routes/tariffRoutes");
const meterReadingRoutes = require("./routes/meterReadingRoutes");
const chargeRoutes = require("./routes/chargeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const residentCabinetRoutes = require("./routes/residentCabinetRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://localhost:5173",
];

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(null, true);
    },
    credentials: true,
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/apartments", apartmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/tariffs", tariffRoutes);
app.use("/api/meter-readings", meterReadingRoutes);
app.use("/api/charges", chargeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/resident-cabinet", residentCabinetRoutes);
app.use("/api/audit-logs", auditLogRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Сервер ЖКХ работает" });
});

const PORT = process.env.PORT || 5000;
const USE_HTTPS = process.env.USE_HTTPS === "true";

function runHttpServer() {
    app.listen(PORT, () => {
        console.log(`HTTP сервер запущен: http://localhost:${PORT}`);
    });
}

function runHttpsServer() {
    const keyPath = path.join(__dirname, "..", "certs", "localhost-key.pem");
    const certPath = path.join(__dirname, "..", "certs", "localhost-cert.pem");

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.warn("Сертификаты HTTPS не найдены, сервер будет запущен по HTTP");
        runHttpServer();
        return;
    }

    https.createServer({
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    }, app).listen(PORT, () => {
        console.log(`HTTPS сервер запущен: https://localhost:${PORT}`);
        console.log("При первом открытии браузер может попросить подтвердить локальный сертификат");
    });
}

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("База данных PostgreSQL подключена");
        await sequelize.sync({ alter: true });
        console.log("Таблицы синхронизированы");

        if (USE_HTTPS) {
            runHttpsServer();
        } else {
            runHttpServer();
        }
    } catch (error) {
        console.error("Ошибка подключения к базе данных:", error);
    }
}

startServer();
