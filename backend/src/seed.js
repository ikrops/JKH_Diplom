const bcrypt = require("bcrypt");
require("dotenv").config();
const {
    sequelize,
    User,
    Apartment,
    Resident,
    Service,
    Tariff,
    MeterReading,
    Charge,
    Payment,
    AuditLog,
} = require("./models");

const HOUSE_ADDRESS = "ул. Центральная, 10";
const PERIOD = "2026-05";

const maleResidents = [
    ["Иванов", "Александр", "Сергеевич"],
    ["Петров", "Дмитрий", "Андреевич"],
    ["Сидоров", "Иван", "Петрович"],
    ["Кузнецов", "Максим", "Алексеевич"],
    ["Смирнов", "Сергей", "Иванович"],
    ["Попов", "Андрей", "Дмитриевич"],
    ["Васильев", "Артём", "Олегович"],
    ["Новиков", "Павел", "Викторович"],
    ["Фёдоров", "Никита", "Павлович"],
    ["Морозов", "Егор", "Михайлович"],
    ["Волков", "Алексей", "Николаевич"],
    ["Лебедев", "Кирилл", "Романович"],
];

const femaleResidents = [
    ["Иванова", "Анна", "Сергеевна"],
    ["Петрова", "Мария", "Андреевна"],
    ["Сидорова", "Елена", "Петровна"],
    ["Кузнецова", "Ольга", "Алексеевна"],
    ["Смирнова", "Наталья", "Ивановна"],
    ["Попова", "Ирина", "Дмитриевна"],
    ["Васильева", "Татьяна", "Олеговна"],
    ["Новикова", "Светлана", "Викторовна"],
    ["Фёдорова", "Дарья", "Павловна"],
    ["Морозова", "Виктория", "Михайловна"],
    ["Волкова", "Екатерина", "Николаевна"],
    ["Лебедева", "Алина", "Романовна"],
];

function fullName(index) {
    const list = index % 2 === 0 ? femaleResidents : maleResidents;
    const [lastName, firstName, middleName] = list[(index - 1) % list.length];
    return `${lastName} ${firstName} ${middleName}`;
}

function roundMoney(value) {
    return Number(Number(value).toFixed(2));
}

function apartmentArea(apartmentIndex) {
    // В доме квартиры одного типа на одинаковых позициях имеют близкую площадь.
    // Разброс небольшой, чтобы демонстрационные данные выглядели реалистично.
    const positionVariants = [48.2, 49.1, 51.4, 52.0, 56.3, 57.1];
    const position = (apartmentIndex - 1) % 6;
    const floor = Math.floor((apartmentIndex - 1) / 6) + 2;
    const floorAdjustment = (floor % 3) * 0.1;
    return Number((positionVariants[position] + floorAdjustment).toFixed(1));
}

function residentsCount(apartmentIndex) {
    // Детерминированное распределение 1-5 проживающих, чтобы данные выглядели реалистично,
    // но при каждом запуске seed оставались одинаковыми.
    return ((apartmentIndex * 7) % 5) + 1;
}

function benefitPercent(apartmentIndex) {
    if (apartmentIndex % 19 === 0) return 50;
    if (apartmentIndex % 11 === 0) return 25;
    if (apartmentIndex % 7 === 0) return 10;
    return 0;
}

async function createUser({ fullName, login, password, role, email }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await User.findOrCreate({
        where: { login },
        defaults: { fullName, login, password: hashedPassword, role, email },
    });
    return user;
}

async function createChargeWithOptionalPayment({ apartment, service, amount, paidAmount = 0 }) {
    const [charge] = await Charge.findOrCreate({
        where: { apartmentId: apartment.id, serviceId: service.id, period: PERIOD },
        defaults: {
            amount: roundMoney(amount),
            status: paidAmount >= amount ? "paid" : "unpaid",
        },
    });

    const existingPayments = await Payment.findAll({ where: { chargeId: charge.id } });
    if (!existingPayments.length && paidAmount > 0) {
        await Payment.create({
            chargeId: charge.id,
            amount: roundMoney(paidAmount),
            paymentDate: "2026-05-12",
            paymentMethod: paidAmount >= amount ? "card" : "cash",
        });
        await charge.update({ status: paidAmount >= Number(charge.amount) ? "paid" : "unpaid" });
    }

    return charge;
}

async function seed() {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    await createUser({
        fullName: "Администратор системы",
        login: "admin",
        password: "admin123",
        role: "admin",
        email: "admin@jkh.local",
    });

    await createUser({
        fullName: "Сотрудник управляющей компании",
        login: "employee",
        password: "employee123",
        role: "employee",
        email: "employee@jkh.local",
    });

    await createUser({
        fullName: "Бухгалтер управляющей компании",
        login: "accountant",
        password: "accountant123",
        role: "accountant",
        email: "accountant@jkh.local",
    });

    const servicesData = [
        { name: "Электроснабжение", unit: "кВт·ч", calculationType: "meter", oldPrice: 4.95, price: 5.20 },
        { name: "Холодное водоснабжение", unit: "м³", calculationType: "meter", oldPrice: 32.80, price: 35.50 },
        { name: "Горячее водоснабжение", unit: "м³", calculationType: "meter", oldPrice: 145.00, price: 152.40 },
        { name: "Газоснабжение", unit: "м³", calculationType: "meter", oldPrice: 7.10, price: 7.80 },
        { name: "Отопление", unit: "м²", calculationType: "area", oldPrice: 36.50, price: 39.20 },
        { name: "Содержание жилья", unit: "м²", calculationType: "area", oldPrice: 17.30, price: 18.40 },
        { name: "Вывоз ТБО", unit: "чел.", calculationType: "resident", oldPrice: 105.00, price: 120.00 },
    ];

    const services = {};
    for (const item of servicesData) {
        const [service] = await Service.findOrCreate({
            where: { name: item.name },
            defaults: {
                unit: item.unit,
                calculationType: item.calculationType,
                description: `Коммунальная услуга: ${item.name}`,
            },
        });
        services[item.name] = service;

        await Tariff.findOrCreate({
            where: { serviceId: service.id, startDate: "2026-01-01" },
            defaults: { price: item.oldPrice, endDate: "2026-04-30" },
        });

        await Tariff.findOrCreate({
            where: { serviceId: service.id, startDate: "2026-05-01" },
            defaults: { price: item.price, endDate: null },
        });
    }

    const apartments = [];
    let apartmentIndex = 1;

    // 20-этажный дом: 1 этаж нежилой, 2-20 этажи жилые, по 6 квартир на этаже.
    // Слева условно квартиры 1-3 на этаже, справа 4-6.
    for (let floor = 2; floor <= 20; floor++) {
        for (let position = 1; position <= 6; position++) {
            const apartmentNumber = String(apartmentIndex);
            const area = apartmentArea(apartmentIndex);
            const count = residentsCount(apartmentIndex);

            const [apartment] = await Apartment.findOrCreate({
                where: { houseAddress: HOUSE_ADDRESS, apartmentNumber },
                defaults: { area, residentsCount: count },
            });
            apartments.push({ apartment, floor, position, apartmentIndex, area, count });

            const name = fullName(apartmentIndex);
            // Для каждой квартиры создаётся основной жилец-владелец и отдельный аккаунт
            // для входа в личный кабинет. Логин совпадает с номером квартиры в демонстрационной базе.
            const user = await createUser({
                fullName: name,
                login: `resident${String(apartmentIndex).padStart(3, "0")}`,
                password: "resident123",
                role: "resident",
                email: `resident${String(apartmentIndex).padStart(3, "0")}@example.com`,
            });
            const userId = user.id;

            await Resident.findOrCreate({
                where: { accountNumber: `LS-2026-${String(apartmentIndex).padStart(4, "0")}` },
                defaults: {
                    fullName: name,
                    phone: `+7 949 ${String(100 + apartmentIndex).padStart(3, "0")}-${String(10 + (apartmentIndex % 90)).padStart(2, "0")}-${String(20 + (apartmentIndex % 70)).padStart(2, "0")}`,
                    email: `resident${String(apartmentIndex).padStart(3, "0")}@example.com`,
                    benefitPercent: benefitPercent(apartmentIndex),
                    userId,
                    apartmentId: apartment.id,
                },
            });

            apartmentIndex++;
        }
    }

    const meterServiceNames = ["Электроснабжение", "Холодное водоснабжение", "Горячее водоснабжение", "Газоснабжение"];

    for (const item of apartments) {
        const { apartment, apartmentIndex, area, count } = item;
        const benefit = benefitPercent(apartmentIndex);
        const discountMultiplier = 1 - benefit / 100;

        for (const serviceName of meterServiceNames) {
            const service = services[serviceName];

            let basePrevious = 0;
            let consumption = 0;

            if (serviceName === "Электроснабжение") {
                basePrevious = 1200 + apartmentIndex * 17;
                consumption = 85 + (apartmentIndex % 6) * 14 + count * 9;
            }

            if (serviceName === "Холодное водоснабжение") {
                basePrevious = 80 + apartmentIndex * 2.1;
                consumption = 5 + count * 1.3 + (apartmentIndex % 3);
            }

            if (serviceName === "Горячее водоснабжение") {
                basePrevious = 45 + apartmentIndex * 1.4;
                consumption = 3 + count * 0.9 + (apartmentIndex % 2);
            }

            if (serviceName === "Газоснабжение") {
                basePrevious = 260 + apartmentIndex * 3.2;
                consumption = 8 + count * 1.5 + (apartmentIndex % 4);
            }

            const previousValue = roundMoney(basePrevious);
            const currentValue = roundMoney(basePrevious + consumption);

            await MeterReading.findOrCreate({
                where: { apartmentId: apartment.id, serviceId: service.id, readingDate: "2026-05-25" },
                defaults: { previousValue, currentValue },
            });

            const tariff = servicesData.find((row) => row.name === serviceName).price;
            const amount = roundMoney((currentValue - previousValue) * tariff * discountMultiplier);
            const paymentMode = apartmentIndex % 5;
            const paidAmount = paymentMode === 0 ? amount : paymentMode === 1 ? amount * 0.5 : paymentMode === 2 ? amount * 0.8 : 0;

            await createChargeWithOptionalPayment({ apartment, service, amount, paidAmount });
        }

        const heatingAmount = roundMoney(area * 39.20 * discountMultiplier);
        const maintenanceAmount = roundMoney(area * 18.40 * discountMultiplier);
        const garbageAmount = roundMoney(count * 120.00 * discountMultiplier);

        await createChargeWithOptionalPayment({
            apartment,
            service: services["Отопление"],
            amount: heatingAmount,
            paidAmount: apartmentIndex % 4 === 0 ? heatingAmount : 0,
        });

        await createChargeWithOptionalPayment({
            apartment,
            service: services["Содержание жилья"],
            amount: maintenanceAmount,
            paidAmount: apartmentIndex % 6 === 0 ? maintenanceAmount * 0.5 : 0,
        });

        await createChargeWithOptionalPayment({
            apartment,
            service: services["Вывоз ТБО"],
            amount: garbageAmount,
            paidAmount: apartmentIndex % 3 === 0 ? garbageAmount : 0,
        });
    }

    await AuditLog.findOrCreate({
        where: { action: "Заполнение демонстрационной базы", entity: "SeedData" },
        defaults: {
            userLogin: "system",
            userRole: "system",
            action: "Заполнение демонстрационной базы",
            entity: "SeedData",
            details: "Создан 20-этажный дом: 1 этаж нежилой, со 2 по 20 этаж — 114 квартир. Для каждой квартиры создан владелец-жилец, отдельный аккаунт личного кабинета, тарифы, показания, начисления и оплаты.",
        },
    });

    console.log("Демонстрационная база заполнена");
    console.log("Дом: 20 этажей, 1 этаж нежилой, 2-20 этажи жилые, 6 квартир на этаже");
    console.log(`Создано квартир: ${apartments.length}`);
    console.log(`Создано аккаунтов жильцов: ${apartments.length}`);
    console.log("Администратор: admin / admin123");
    console.log("Сотрудник: employee / employee123");
    console.log("Бухгалтер: accountant / accountant123");
    console.log("Жильцы: resident001-resident114 / resident123");
    console.log("Примеры жильцов: resident001 / resident123, resident025 / resident123, resident114 / resident123");
    await sequelize.close();
}

seed().catch((error) => {
    console.error("Ошибка заполнения базы:", error);
    process.exit(1);
});
