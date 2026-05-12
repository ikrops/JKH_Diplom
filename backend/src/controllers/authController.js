const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Resident } = require("../models");
const writeAudit = require("../utils/audit");

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOGIN_BLOCK_MINUTES = Number(process.env.LOGIN_BLOCK_MINUTES || 10);

function getAttemptKey(req, login) {
    return `${req.ip}:${String(login || "").toLowerCase()}`;
}

function getBlockedMessage(record) {
    const unlockAt = new Date(record.blockedUntil);
    return `Слишком много неверных попыток входа. Повторите после ${unlockAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}

function checkLoginLimit(req, login) {
    const key = getAttemptKey(req, login);
    const record = loginAttempts.get(key);

    if (!record) return null;

    if (record.blockedUntil && Date.now() < record.blockedUntil) {
        return getBlockedMessage(record);
    }

    if (record.blockedUntil && Date.now() >= record.blockedUntil) {
        loginAttempts.delete(key);
    }

    return null;
}

function saveFailedLogin(req, login) {
    const key = getAttemptKey(req, login);
    const current = loginAttempts.get(key) || { count: 0, blockedUntil: null };
    const nextCount = current.count + 1;

    if (nextCount >= MAX_LOGIN_ATTEMPTS) {
        loginAttempts.set(key, {
            count: nextCount,
            blockedUntil: Date.now() + LOGIN_BLOCK_MINUTES * 60 * 1000,
        });
        return;
    }

    loginAttempts.set(key, { count: nextCount, blockedUntil: null });
}

function clearFailedLogins(req, login) {
    loginAttempts.delete(getAttemptKey(req, login));
}

const safeUser = (user) => ({
    id: user.id,
    fullName: user.fullName,
    login: user.login,
    role: user.role,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

exports.register = async (req, res) => {
    try {
        const { fullName, login, password, role, email, phone, accountNumber } = req.body;

        if (!fullName || !login || !password) {
            return res.status(400).json({ message: "Заполните ФИО, логин и пароль" });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: "Пароль должен содержать минимум 4 символа" });
        }

        const existingUser = await User.findOne({ where: { login } });
        if (existingUser) {
            return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
        }

        const isAdminCreatingUser = Boolean(req.user);
        const allowedRoles = ["admin", "employee", "accountant", "resident"];
        const newRole = isAdminCreatingUser && allowedRoles.includes(role) ? role : "resident";

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            fullName,
            login,
            password: hashedPassword,
            role: newRole,
            email,
        });

        if (newRole === "resident") {
            const generatedAccountNumber = accountNumber || `LS-${String(user.id).padStart(5, "0")}`;
            await Resident.create({
                fullName,
                accountNumber: generatedAccountNumber,
                phone,
                email,
                benefitPercent: 0,
                userId: user.id,
                apartmentId: null,
            });
        }

        if (req.user) {
            await writeAudit(req, "Создание пользователя", "User", user.id, `Создан пользователь ${login}`);
        }

        res.status(201).json({ message: "Пользователь успешно зарегистрирован", user: safeUser(user) });
    } catch (error) {
        res.status(500).json({ message: "Ошибка регистрации", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ message: "Введите логин и пароль" });
        }

        const limitMessage = checkLoginLimit(req, login);
        if (limitMessage) {
            return res.status(429).json({ message: limitMessage });
        }

        const user = await User.findOne({ where: { login } });
        if (!user) {
            saveFailedLogin(req, login);
            return res.status(400).json({ message: "Неверный логин или пароль" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            saveFailedLogin(req, login);
            return res.status(400).json({ message: "Неверный логин или пароль" });
        }

        clearFailedLogins(req, login);

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
        await writeAudit({ ...req, user: { id: user.id } }, "Вход в систему", "User", user.id, `Пользователь ${user.login} вошёл в систему`);
        res.json({ message: "Вход выполнен успешно", token, user: safeUser(user) });
    } catch (error) {
        res.status(500).json({ message: "Ошибка входа", error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "fullName", "login", "role", "email", "createdAt", "updatedAt"],
            include: [{ model: Resident, as: "resident", attributes: ["id", "fullName", "accountNumber"] }],
            order: [["id", "ASC"]],
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Ошибка получения пользователей", error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { fullName, login, password, role, email } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        const payload = { fullName, login, role, email };
        Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
        if (password) {
            payload.password = await bcrypt.hash(password, 10);
        }

        await user.update(payload);
        await writeAudit(req, "Обновление пользователя", "User", user.id, `Обновлён пользователь ${user.login}`);
        res.json({ message: "Пользователь обновлён", user: safeUser(user) });
    } catch (error) {
        res.status(500).json({ message: "Ошибка обновления пользователя", error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        const deletedLogin = user.login;
        await Resident.update({ userId: null }, { where: { userId: user.id } });
        await user.destroy();
        await writeAudit(req, "Удаление пользователя", "User", Number(req.params.id), `Удалён пользователь ${deletedLogin}`);
        res.json({ message: "Пользователь удалён" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка удаления пользователя", error: error.message });
    }
};


exports.changeMyPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Введите текущий и новый пароль" });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ message: "Новый пароль должен содержать минимум 4 символа" });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Текущий пароль указан неверно" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        await writeAudit(req, "Смена пароля", "User", user.id, "Пользователь изменил свой пароль");

        res.json({ message: "Пароль успешно изменён" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка смены пароля", error: error.message });
    }
};
