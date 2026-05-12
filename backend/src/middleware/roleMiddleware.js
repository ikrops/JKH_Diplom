function allowRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Недостаточно прав доступа" });
        }

        next();
    };
}

module.exports = allowRoles;
