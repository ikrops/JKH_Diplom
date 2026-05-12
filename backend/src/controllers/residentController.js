const { Resident, Apartment, User } = require("../models");

exports.createResident = async (req, res) => {
    try {
        const { fullName, accountNumber, phone, email, benefitPercent, apartmentId, userId } = req.body;

        if (!fullName || !accountNumber) {
            return res.status(400).json({
                message: "ФИО и лицевой счёт обязательны",
            });
        }

        const existingResident = await Resident.findOne({
            where: { accountNumber },
        });

        if (existingResident) {
            return res.status(400).json({
                message: "Жилец с таким лицевым счётом уже существует",
            });
        }

        const resident = await Resident.create({
            fullName,
            accountNumber,
            phone,
            email,
            benefitPercent: benefitPercent || 0,
            apartmentId: apartmentId || null,
            userId: userId || null,
        });

        res.status(201).json({
            message: "Жилец успешно добавлен",
            resident,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка добавления жильца",
            error: error.message,
        });
    }
};

exports.getResidents = async (req, res) => {
    try {
        const residents = await Resident.findAll({
            include: [
                {
                    model: Apartment,
                    as: "apartment",
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "fullName", "login", "role", "email"],
                },
            ],
            order: [["id", "ASC"]],
        });

        res.json(residents);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения жильцов",
            error: error.message,
        });
    }
};

exports.getResidentById = async (req, res) => {
    try {
        const resident = await Resident.findByPk(req.params.id, {
            include: [
                {
                    model: Apartment,
                    as: "apartment",
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "fullName", "login", "role", "email"],
                },
            ],
        });

        if (!resident) {
            return res.status(404).json({
                message: "Жилец не найден",
            });
        }

        res.json(resident);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения жильца",
            error: error.message,
        });
    }
};

exports.updateResident = async (req, res) => {
    try {
        const resident = await Resident.findByPk(req.params.id);

        if (!resident) {
            return res.status(404).json({
                message: "Жилец не найден",
            });
        }

        await resident.update(req.body);

        res.json({
            message: "Данные жильца обновлены",
            resident,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка обновления жильца",
            error: error.message,
        });
    }
};

exports.deleteResident = async (req, res) => {
    try {
        const resident = await Resident.findByPk(req.params.id);

        if (!resident) {
            return res.status(404).json({
                message: "Жилец не найден",
            });
        }

        await resident.destroy();

        res.json({
            message: "Жилец удалён",
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка удаления жильца",
            error: error.message,
        });
    }
};