const { Payment, Charge, Apartment, Service } = require("../models");
const writeAudit = require("../utils/audit");

exports.createPayment = async (req, res) => {
    try {
        const { chargeId, amount, paymentDate, paymentMethod } = req.body;

        if (!chargeId || !amount || !paymentDate) {
            return res.status(400).json({
                message: "Начисление, сумма и дата оплаты обязательны",
            });
        }

        const charge = await Charge.findByPk(chargeId);

        if (!charge) {
            return res.status(404).json({
                message: "Начисление не найдено",
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                message: "Сумма оплаты должна быть больше нуля",
            });
        }

        const existingPayments = await Payment.findAll({ where: { chargeId } });
        const alreadyPaid = existingPayments.reduce((sum, item) => sum + Number(item.amount), 0);
        const remaining = Number((Number(charge.amount) - alreadyPaid).toFixed(2));

        if (remaining <= 0) {
            return res.status(400).json({ message: "Начисление уже полностью оплачено" });
        }

        if (Number(amount) > remaining) {
            return res.status(400).json({ message: `Сумма оплаты не может превышать остаток ${remaining} ₽` });
        }

        const payment = await Payment.create({
            chargeId,
            amount,
            paymentDate,
            paymentMethod: paymentMethod || "cash",
        });

        const payments = await Payment.findAll({ where: { chargeId } });
        const paidTotal = payments.reduce((sum, item) => sum + Number(item.amount), 0);
        await charge.update({ status: paidTotal >= Number(charge.amount) ? "paid" : "unpaid" });
        await writeAudit(req, "Регистрация платежа", "Payment", payment.id, `Начисление #${chargeId}, сумма ${amount}`);

        res.status(201).json({
            message: "Платёж успешно зарегистрирован",
            payment,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка регистрации платежа",
            error: error.message,
        });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [
                {
                    model: Charge,
                    as: "charge",
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
                },
            ],
            order: [["id", "ASC"]],
        });

        res.json(payments);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения платежей",
            error: error.message,
        });
    }
};

exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [
                {
                    model: Charge,
                    as: "charge",
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
                },
            ],
        });

        if (!payment) {
            return res.status(404).json({
                message: "Платёж не найден",
            });
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения платежа",
            error: error.message,
        });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);

        if (!payment) {
            return res.status(404).json({
                message: "Платёж не найден",
            });
        }

        const chargeId = payment.chargeId;
        await payment.destroy();
        await writeAudit(req, "Удаление платежа", "Payment", Number(req.params.id), `Удалён платёж по начислению #${chargeId}`);

        const charge = await Charge.findByPk(chargeId);
        if (charge) {
            const payments = await Payment.findAll({ where: { chargeId } });
            const paidTotal = payments.reduce((sum, item) => sum + Number(item.amount), 0);
            await charge.update({ status: paidTotal >= Number(charge.amount) ? "paid" : "unpaid" });
        }

        res.json({
            message: "Платёж удалён",
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка удаления платежа",
            error: error.message,
        });
    }
};