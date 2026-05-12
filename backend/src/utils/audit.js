const { AuditLog, User } = require("../models");

async function writeAudit(req, action, entity, entityId = null, details = "") {
    try {
        let userLogin = null;
        let userRole = req.user?.role || null;

        if (req.user?.id) {
            const user = await User.findByPk(req.user.id, { attributes: ["login", "role"] });
            userLogin = user?.login || null;
            userRole = user?.role || userRole;
        }

        await AuditLog.create({
            userId: req.user?.id || null,
            userLogin,
            userRole,
            action,
            entity,
            entityId,
            details: typeof details === "string" ? details : JSON.stringify(details),
        });
    } catch (error) {
        console.error("Ошибка записи журнала действий:", error.message);
    }
}

module.exports = writeAudit;
