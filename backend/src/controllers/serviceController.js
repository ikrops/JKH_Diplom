const { Service } = require("../models");

exports.createService = async (req, res) => {
    try {
        const { name, unit, calculationType, description } = req.body;

        if (!name || !unit || !calculationType) {
            return res.status(400).json({
                message: "Название услуги, единица измерения и тип расчёта обязательны",
            });
        }

        const existingService = await Service.findOne({
            where: { name },
        });

        if (existingService) {
            return res.status(400).json({
                message: "Такая услуга уже существует",
            });
        }

        const service = await Service.create({
            name,
            unit,
            calculationType,
            description,
        });

        res.status(201).json({
            message: "Услуга успешно добавлена",
            service,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка добавления услуги",
            error: error.message,
        });
    }
};

exports.getServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            order: [["id", "ASC"]],
        });

        res.json(services);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения услуг",
            error: error.message,
        });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({
                message: "Услуга не найдена",
            });
        }

        res.json(service);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения услуги",
            error: error.message,
        });
    }
};

exports.updateService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({
                message: "Услуга не найдена",
            });
        }

        await service.update(req.body);

        res.json({
            message: "Услуга обновлена",
            service,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка обновления услуги",
            error: error.message,
        });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({
                message: "Услуга не найдена",
            });
        }

        await service.destroy();

        res.json({
            message: "Услуга удалена",
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка удаления услуги",
            error: error.message,
        });
    }
};