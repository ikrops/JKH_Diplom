const { Charge, Payment, Apartment, Service, Resident } = require("../models");

function sum(list, field) {
    return list.reduce((total, item) => total + Number(item[field] || 0), 0);
}

exports.getSummaryReport = async (req, res) => {
    try {
        const { period } = req.query;
        if (!period) {
            return res.status(400).json({ message: "Период обязателен. Пример: ?period=2026-05" });
        }

        const charges = await Charge.findAll({ where: { period } });
        const chargeIds = charges.map((charge) => charge.id);
        const payments = await Payment.findAll({ where: { chargeId: chargeIds } });

        const totalCharges = sum(charges, "amount");
        const totalPaid = sum(payments, "amount");
        const totalDebt = totalCharges - totalPaid;

        res.json({
            period,
            totalCharges: Number(totalCharges.toFixed(2)),
            totalPaid: Number(totalPaid.toFixed(2)),
            totalDebt: Number(totalDebt.toFixed(2)),
            chargesCount: charges.length,
            paymentsCount: payments.length,
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка формирования отчёта", error: error.message });
    }
};

exports.getDebtorsReport = async (req, res) => {
    try {
        const { period } = req.query;
        const where = period ? { period } : {};

        const charges = await Charge.findAll({
            where,
            include: [
                { model: Apartment, as: "apartment", include: [{ model: Resident, as: "residents" }] },
                { model: Service, as: "service" },
                { model: Payment, as: "payments" },
            ],
            order: [["period", "DESC"], ["id", "ASC"]],
        });

        const debtors = charges
            .map((charge) => {
                const paid = charge.payments.reduce((total, payment) => total + Number(payment.amount), 0);
                const debt = Number(charge.amount) - paid;
                return {
                    chargeId: charge.id,
                    period: charge.period,
                    service: charge.service?.name,
                    apartment: charge.apartment,
                    residents: charge.apartment?.residents || [],
                    amount: Number(Number(charge.amount).toFixed(2)),
                    paid: Number(paid.toFixed(2)),
                    debt: Number(debt.toFixed(2)),
                };
            })
            .filter((item) => item.debt > 0);

        res.json({
            period: period || "Все периоды",
            debtors,
            totalDebt: Number(debtors.reduce((total, item) => total + item.debt, 0).toFixed(2)),
            debtorsCount: debtors.length,
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка формирования списка должников", error: error.message });
    }
};
