const { AuditLog } = require("../models");

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.findAll({ order: [["createdAt", "DESC"]], limit: 200 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Ошибка получения журнала действий", error: error.message });
    }
};
