const {
    Charge,
    Apartment,
    Service,
    Tariff,
    MeterReading,
    Resident,
    Payment,
} = require("../models");
const writeAudit = require("../utils/audit");

exports.createCharge = async (req, res) => {
    try {
        const { apartmentId, serviceId, period } = req.body;

        if (!apartmentId || !serviceId || !period) {
            return res.status(400).json({
                message: "Квартира, услуга и период обязательны",
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

        const existingCharge = await Charge.findOne({
            where: { apartmentId, serviceId, period },
            include: [{ model: Service, as: "service" }],
        });

        if (existingCharge) {
            return res.status(409).json({
                message: `За период ${period} для выбранной квартиры уже есть начисление по услуге «${existingCharge.service?.name || service.name}»`,
            });
        }

        const tariff = await Tariff.findOne({
            where: { serviceId },
            order: [["startDate", "DESC"]],
        });

        if (!tariff) {
            return res.status(404).json({
                message: "Тариф для услуги не найден",
            });
        }

        let amount = 0;

        if (service.calculationType === "meter") {
            const reading = await MeterReading.findOne({
                where: { apartmentId, serviceId },
                order: [["readingDate", "DESC"]],
            });

            if (!reading) {
                return res.status(404).json({
                    message: "Показания счётчика для услуги не найдены",
                });
            }

            const consumption = reading.currentValue - reading.previousValue;
            amount = consumption * tariff.price;
        }

        if (service.calculationType === "area") {
            amount = apartment.area * tariff.price;
        }

        if (service.calculationType === "resident") {
            amount = apartment.residentsCount * tariff.price;
        }

        const residents = await Resident.findAll({ where: { apartmentId } });
        const benefitPercent = residents.length
            ? Math.max(...residents.map((resident) => Number(resident.benefitPercent || 0)))
            : 0;

        if (benefitPercent > 0) {
            amount = amount - amount * (benefitPercent / 100);
        }

        amount = Number(amount.toFixed(2));

        const charge = await Charge.create({
            apartmentId,
            serviceId,
            period,
            amount,
            status: "unpaid",
        });

        await writeAudit(req, "Создание начисления", "Charge", charge.id, `Квартира #${apartmentId}, услуга #${serviceId}, период ${period}, сумма ${amount}`);

        res.status(201).json({
            message: "Начисление успешно создано",
            charge,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка создания начисления",
            error: error.message,
        });
    }
};

exports.getCharges = async (req, res) => {
    try {
        const { status } = req.query;
        const where = status ? { status } : {};

        const charges = await Charge.findAll({
            where,
            include: [
                {
                    model: Apartment,
                    as: "apartment",
                },
                {
                    model: Service,
                    as: "service",
                },
                {
                    model: Payment,
                    as: "payments",
                    required: false,
                },
            ],
            order: [["id", "ASC"]],
        });

        const result = charges.map((charge) => {
            const plain = charge.toJSON();
            const paidTotal = (plain.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            plain.paidTotal = Number(paidTotal.toFixed(2));
            plain.remainingAmount = Number(Math.max(Number(plain.amount || 0) - paidTotal, 0).toFixed(2));
            plain.paymentStatusText = plain.remainingAmount <= 0 ? "Оплачено" : paidTotal > 0 ? "Частично оплачено" : "Не оплачено";
            return plain;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения начислений",
            error: error.message,
        });
    }
};

exports.getChargeById = async (req, res) => {
    try {
        const charge = await Charge.findByPk(req.params.id, {
            include: [
                {
                    model: Apartment,
                    as: "apartment",
                },
                {
                    model: Service,
                    as: "service",
                },
                {
                    model: Payment,
                    as: "payments",
                    required: false,
                },
            ],
        });

        if (!charge) {
            return res.status(404).json({
                message: "Начисление не найдено",
            });
        }

        res.json(charge);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения начисления",
            error: error.message,
        });
    }
};

exports.updateCharge = async (req, res) => {
    try {
        const charge = await Charge.findByPk(req.params.id);

        if (!charge) {
            return res.status(404).json({
                message: "Начисление не найдено",
            });
        }

        await charge.update(req.body);
        await writeAudit(req, "Обновление начисления", "Charge", charge.id, `Обновлено начисление #${charge.id}`);

        res.json({
            message: "Начисление обновлено",
            charge,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка обновления начисления",
            error: error.message,
        });
    }
};

exports.deleteCharge = async (req, res) => {
    try {
        const charge = await Charge.findByPk(req.params.id);

        if (!charge) {
            return res.status(404).json({
                message: "Начисление не найдено",
            });
        }

        await charge.destroy();
        await writeAudit(req, "Удаление начисления", "Charge", Number(req.params.id), `Удалено начисление #${req.params.id}`);

        res.json({
            message: "Начисление удалено",
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка удаления начисления",
            error: error.message,
        });
    }
};