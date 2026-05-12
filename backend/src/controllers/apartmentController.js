const { Apartment, Resident } = require("../models");

exports.createApartment = async (req, res) => {
    try {
        const { houseAddress, apartmentNumber, area, residentsCount } = req.body;

        if (!houseAddress || !apartmentNumber || !area) {
            return res.status(400).json({
                message: "Адрес дома, номер квартиры и площадь обязательны",
            });
        }

        const apartment = await Apartment.create({
            houseAddress,
            apartmentNumber,
            area,
            residentsCount: residentsCount || 1,
        });

        res.status(201).json({
            message: "Квартира успешно добавлена",
            apartment,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка добавления квартиры",
            error: error.message,
        });
    }
};

exports.getApartments = async (req, res) => {
    try {
        const apartments = await Apartment.findAll({
            include: [
                {
                    model: Resident,
                    as: "residents",
                },
            ],
            order: [["id", "ASC"]],
        });

        res.json(apartments);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения квартир",
            error: error.message,
        });
    }
};

exports.getApartmentById = async (req, res) => {
    try {
        const apartment = await Apartment.findByPk(req.params.id, {
            include: [
                {
                    model: Resident,
                    as: "residents",
                },
            ],
        });

        if (!apartment) {
            return res.status(404).json({
                message: "Квартира не найдена",
            });
        }

        res.json(apartment);
    } catch (error) {
        res.status(500).json({
            message: "Ошибка получения квартиры",
            error: error.message,
        });
    }
};

exports.updateApartment = async (req, res) => {
    try {
        const apartment = await Apartment.findByPk(req.params.id);

        if (!apartment) {
            return res.status(404).json({
                message: "Квартира не найдена",
            });
        }

        await apartment.update(req.body);

        res.json({
            message: "Данные квартиры обновлены",
            apartment,
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка обновления квартиры",
            error: error.message,
        });
    }
};

exports.deleteApartment = async (req, res) => {
    try {
        const apartment = await Apartment.findByPk(req.params.id);

        if (!apartment) {
            return res.status(404).json({
                message: "Квартира не найдена",
            });
        }

        await apartment.destroy();

        res.json({
            message: "Квартира удалена",
        });
    } catch (error) {
        res.status(500).json({
            message: "Ошибка удаления квартиры",
            error: error.message,
        });
    }
};