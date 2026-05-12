const { MeterReading, Apartment, Service } = require("../models");

exports.createMeterReading = async (req, res) => {
    try {
        const {
            apartmentId,
            serviceId,
            previousValue,
            currentValue,
            readingDate,
        } = req.body;

        if (
            !apartmentId ||
            !serviceId ||
            previousValue === undefined ||
            currentValue === undefined ||
            !readingDate
        ) {
            return res.status(400).json({
                message: "Квартира, услуга, показания и дата обязательны",
            });
        }

        const apartment = await Apartment.findByPk(apartmentId);

        if (!apartment) {
            return res.status(404).json({
                message: "Квартира не найдена",
            });
        }

        const service = await Service.findByPk(serviceId);

        if (!service) {
            return res.status(404).json({
                message: "Услуга не найдена",
            });
        }

        if (service.calculationType !== "meter") {
            return res.status(400).json({
                message: "Для этой услуги показания счётчика не используются",
            });
        }

        if (Number(currentValue) < Number(previousValue)) {
            return res.status(400).json({
                message: "Текущее показание не может быть меньше предыдущего",
            });
        }

        const meterReading = await MeterReading.create({
            apartmentId,
            serviceId,
            previousValue,
            currentValue,
            readingDate,
        });

        res.status(201).json({
            message: "Показания счётчика успешно добавлены",
            meterReading,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка добавления показаний счётчика",
            error: error.message,
        });
    }
};

exports.getMeterReadings = async (req, res) => {
    try {
        const meterReadings = await MeterReading.findAll({
            include: [
                {
                    model: Apartment,
                    as: "apartment",
                },
                {
                    model: Service,
                    as: "service",
                },
            ],
            order: [["id", "ASC"]],
        });

        res.json(meterReadings);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения показаний счётчиков",
            error: error.message,
        });
    }
};

exports.getLatestMeterReading = async (req, res) => {
    try {
        const { apartmentId, serviceId } = req.query;

        if (!apartmentId || !serviceId) {
            return res.status(400).json({
                message: "Квартира и услуга обязательны",
            });
        }

        const lastReading = await MeterReading.findOne({
            where: { apartmentId, serviceId },
            include: [
                { model: Apartment, as: "apartment" },
                { model: Service, as: "service" },
            ],
            order: [["readingDate", "DESC"], ["id", "DESC"]],
        });

        res.json({
            previousValue: lastReading ? Number(lastReading.currentValue) : 0,
            previousDate: lastReading ? lastReading.readingDate : null,
            lastReading,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения предыдущего показания",
            error: error.message,
        });
    }
};

exports.getMeterReadingById = async (req, res) => {
    try {
        const meterReading = await MeterReading.findByPk(req.params.id, {
            include: [
                {
                    model: Apartment,
                    as: "apartment",
                },
                {
                    model: Service,
                    as: "service",
                },
            ],
        });

        if (!meterReading) {
            return res.status(404).json({
                message: "Показания не найдены",
            });
        }

        res.json(meterReading);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения показаний",
            error: error.message,
        });
    }
};

exports.updateMeterReading = async (req, res) => {
    try {
        const meterReading = await MeterReading.findByPk(req.params.id);

        if (!meterReading) {
            return res.status(404).json({
                message: "Показания не найдены",
            });
        }

        const previousValue =
            req.body.previousValue !== undefined
                ? req.body.previousValue
                : meterReading.previousValue;

        const currentValue =
            req.body.currentValue !== undefined
                ? req.body.currentValue
                : meterReading.currentValue;

        if (Number(currentValue) < Number(previousValue)) {
            return res.status(400).json({
                message: "Текущее показание не может быть меньше предыдущего",
            });
        }

        await meterReading.update(req.body);

        res.json({
            message: "Показания счётчика обновлены",
            meterReading,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка обновления показаний",
            error: error.message,
        });
    }
};

exports.deleteMeterReading = async (req, res) => {
    try {
        const meterReading = await MeterReading.findByPk(req.params.id);

        if (!meterReading) {
            return res.status(404).json({
                message: "Показания не найдены",
            });
        }

        await meterReading.destroy();

        res.json({
            message: "Показания счётчика удалены",
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка удаления показаний",
            error: error.message,
        });
    }
};