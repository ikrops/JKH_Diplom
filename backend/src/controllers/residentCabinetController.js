const {
    Resident,
    Apartment,
    Charge,
    Payment,
    Service,
    MeterReading,
} = require("../models");

async function getResidentByUser(userId) {
    return Resident.findOne({
        where: { userId },
        include: [{ model: Apartment, as: "apartment" }],
    });
}

exports.getMyCabinet = async (req, res) => {
    try {
        const resident = await getResidentByUser(req.user.id);
        if (!resident) {
            return res.status(404).json({ message: "Профиль жильца для данного пользователя не найден" });
        }

        const charges = await Charge.findAll({
            where: { apartmentId: resident.apartmentId },
            include: [{ model: Service, as: "service" }],
            order: [["id", "ASC"]],
        });

        const chargeIds = charges.map((charge) => charge.id);
        const payments = await Payment.findAll({
            where: { chargeId: chargeIds },
            include: [{ model: Charge, as: "charge", include: [{ model: Service, as: "service" }] }],
            order: [["id", "ASC"]],
        });

        const meterReadings = await MeterReading.findAll({
            where: { apartmentId: resident.apartmentId },
            include: [{ model: Service, as: "service" }],
            order: [["readingDate", "DESC"], ["id", "DESC"]],
        });

        const meterServices = await Service.findAll({
            where: { calculationType: "meter" },
            order: [["name", "ASC"]],
        });

        const totalCharges = charges.reduce((sum, charge) => sum + Number(charge.amount), 0);
        const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const totalDebt = totalCharges - totalPaid;

        res.json({
            resident,
            apartment: resident.apartment,
            charges,
            payments,
            meterReadings,
            meterServices,
            summary: {
                totalCharges: Number(totalCharges.toFixed(2)),
                totalPaid: Number(totalPaid.toFixed(2)),
                totalDebt: Number(totalDebt.toFixed(2)),
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка получения личного кабинета", error: error.message });
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const resident = await getResidentByUser(req.user.id);
        if (!resident) {
            return res.status(404).json({ message: "Профиль жильца не найден" });
        }

        const { phone, email } = req.body;
        await resident.update({ phone, email });
        res.json({ message: "Контактные данные обновлены", resident });
    } catch (error) {
        res.status(500).json({ message: "Ошибка обновления профиля", error: error.message });
    }
};

exports.createMyMeterReading = async (req, res) => {
    try {
        const resident = await getResidentByUser(req.user.id);
        if (!resident || !resident.apartmentId) {
            return res.status(404).json({ message: "Квартира жильца не найдена" });
        }

        const { serviceId, currentValue, readingDate } = req.body;
        if (!serviceId || currentValue === undefined || !readingDate) {
            return res.status(400).json({ message: "Услуга, показание и дата обязательны" });
        }

        const service = await Service.findByPk(serviceId);
        if (!service || service.calculationType !== "meter") {
            return res.status(400).json({ message: "Выберите услугу, которая рассчитывается по счётчику" });
        }

        const lastReading = await MeterReading.findOne({
            where: { apartmentId: resident.apartmentId, serviceId },
            order: [["readingDate", "DESC"], ["id", "DESC"]],
        });

        const previousValue = lastReading ? Number(lastReading.currentValue) : 0;
        if (Number(currentValue) < previousValue) {
            return res.status(400).json({ message: "Новое показание не может быть меньше предыдущего" });
        }

        const meterReading = await MeterReading.create({
            apartmentId: resident.apartmentId,
            serviceId,
            previousValue,
            currentValue: Number(currentValue),
            readingDate,
        });

        res.status(201).json({ message: "Показания успешно переданы", meterReading });
    } catch (error) {
        res.status(500).json({ message: "Ошибка передачи показаний", error: error.message });
    }
};
