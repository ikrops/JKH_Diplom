const { Op } = require("sequelize");
const { Tariff, Service } = require("../models");
const writeAudit = require("../utils/audit");

function previousDay(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
}

exports.createTariff = async (req, res) => {
    try {
        const { serviceId, price, startDate, endDate } = req.body;

        if (!serviceId || !price || !startDate) {
            return res.status(400).json({ message: "Услуга, цена и дата начала действия тарифа обязательны" });
        }

        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Услуга не найдена" });
        }

        const activeTariffs = await Tariff.findAll({
            where: {
                serviceId,
                [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: startDate } }],
                startDate: { [Op.lt]: startDate },
            },
        });

        for (const activeTariff of activeTariffs) {
            await activeTariff.update({ endDate: previousDay(startDate) });
        }

        const tariff = await Tariff.create({
            serviceId,
            price,
            startDate,
            endDate: endDate || null,
        });

        await writeAudit(req, "Добавление тарифа", "Tariff", tariff.id, `Услуга: ${service.name}, цена: ${price}`);
        res.status(201).json({ message: "Тариф успешно добавлен. Предыдущий активный тариф закрыт автоматически", tariff });
    } catch (error) {
        res.status(500).json({ message: "Ошибка добавления тарифа", error: error.message });
    }
};

exports.getTariffs = async (req, res) => {
    try {
        const tariffs = await Tariff.findAll({ include: [{ model: Service, as: "service" }], order: [["serviceId", "ASC"], ["startDate", "DESC"], ["id", "DESC"]] });
        res.json(tariffs);
    } catch (error) {
        res.status(500).json({ message: "Ошибка получения тарифов", error: error.message });
    }
};

exports.getTariffById = async (req, res) => {
    try {
        const tariff = await Tariff.findByPk(req.params.id, { include: [{ model: Service, as: "service" }] });
        if (!tariff) {
            return res.status(404).json({ message: "Тариф не найден" });
        }
        res.json(tariff);
    } catch (error) {
        res.status(500).json({ message: "Ошибка получения тарифа", error: error.message });
    }
};

exports.updateTariff = async (req, res) => {
    try {
        const tariff = await Tariff.findByPk(req.params.id);
        if (!tariff) {
            return res.status(404).json({ message: "Тариф не найден" });
        }
        await tariff.update(req.body);
        await writeAudit(req, "Обновление тарифа", "Tariff", tariff.id, `Обновлён тариф #${tariff.id}`);
        res.json({ message: "Тариф обновлён", tariff });
    } catch (error) {
        res.status(500).json({ message: "Ошибка обновления тарифа", error: error.message });
    }
};

exports.deleteTariff = async (req, res) => {
    try {
        const tariff = await Tariff.findByPk(req.params.id);
        if (!tariff) {
            return res.status(404).json({ message: "Тариф не найден" });
        }
        await tariff.destroy();
        await writeAudit(req, "Удаление тарифа", "Tariff", Number(req.params.id), `Удалён тариф #${req.params.id}`);
        res.json({ message: "Тариф удалён" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка удаления тарифа", error: error.message });
    }
};
