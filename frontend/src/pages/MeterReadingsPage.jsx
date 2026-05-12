import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

const today = () => new Date().toISOString().slice(0, 10);

const formatNumber = (value, digits = 2) => Number(value || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
});

const getConsumption = (currentValue, previousValue) => {
    const result = Number(currentValue || 0) - Number(previousValue || 0);
    return Math.max(Number(result.toFixed(2)), 0);
};

function MeterReadingsPage() {
    const [readings, setReadings] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [apartments, setApartments] = useState([]);
    const [services, setServices] = useState([]);
    const [previousInfo, setPreviousInfo] = useState(null);

    const [form, setForm] = useState({
        apartmentId: "",
        serviceId: "",
        previousValue: 0,
        currentValue: "",
        readingDate: today(),
    });

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const loadReadings = async () => {
        const response = await api.get("/meter-readings");
        setReadings(response.data);
    };

    const loadApartments = async () => {
        const response = await api.get("/apartments");
        setApartments(response.data);
    };

    const loadServices = async () => {
        const response = await api.get("/services");
        const meterServices = response.data.filter(
            (service) => service.calculationType === "meter"
        );
        setServices(meterServices);
    };

    const loadPreviousValue = async (apartmentId, serviceId) => {
        if (!apartmentId || !serviceId) {
            setPreviousInfo(null);
            setForm((current) => ({ ...current, previousValue: 0 }));
            return;
        }

        try {
            const response = await api.get("/meter-readings/latest/previous", {
                params: { apartmentId, serviceId },
            });

            setPreviousInfo(response.data);
            setForm((current) => ({
                ...current,
                previousValue: response.data.previousValue ?? 0,
            }));
        } catch (error) {
            setPreviousInfo(null);
            setMessage(error.response?.data?.message || "Ошибка получения предыдущего показания");
            setMessageType("error");
        }
    };

    useEffect(() => {
        loadReadings();
        loadApartments();
        loadServices();
    }, []);

    useEffect(() => {
        loadPreviousValue(form.apartmentId, form.serviceId);
    }, [form.apartmentId, form.serviceId]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const createReading = async (e) => {
        e.preventDefault();

        setMessage("");
        setMessageType("");

        if (Number(form.currentValue) < Number(form.previousValue)) {
            setMessage("Текущее показание не может быть меньше предыдущего");
            setMessageType("error");
            return;
        }

        try {
            await api.post("/meter-readings", {
                apartmentId: Number(form.apartmentId),
                serviceId: Number(form.serviceId),
                previousValue: Number(form.previousValue),
                currentValue: Number(form.currentValue),
                readingDate: form.readingDate,
            });

            setForm({
                apartmentId: "",
                serviceId: "",
                previousValue: 0,
                currentValue: "",
                readingDate: today(),
            });
            setPreviousInfo(null);

            setMessage("Показания счётчика успешно добавлены");
            setMessageType("success");

            loadReadings();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка добавления показаний");
            setMessageType("error");
        }
    };

    const consumption = form.currentValue === "" ? 0 : getConsumption(form.currentValue, form.previousValue);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredReadings = useMemo(() => prepareTableData(
        readings,
        search,
        ["id", "apartment.houseAddress", "apartment.apartmentNumber", "service.name", "previousValue", "currentValue", "readingDate"],
        sortBy,
        sortOrder
    ), [readings, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Показания счётчиков</h2>
                    <p>Предыдущее показание подставляется автоматически после выбора квартиры и услуги</p>
                </div>
            </div>

            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            <form onSubmit={createReading} className="form-box">
                <div className="form-row">
                    <select
                        name="apartmentId"
                        value={form.apartmentId}
                        onChange={handleChange}
                        className="select-input"
                        required
                    >
                        <option value="">Выберите квартиру</option>
                        {apartments.map((apartment) => (
                            <option key={apartment.id} value={apartment.id}>
                                {apartment.houseAddress}, кв. {apartment.apartmentNumber}
                            </option>
                        ))}
                    </select>

                    <select
                        name="serviceId"
                        value={form.serviceId}
                        onChange={handleChange}
                        className="select-input"
                        required
                    >
                        <option value="">Выберите услугу</option>
                        {services.map((service) => (
                            <option key={service.id} value={service.id}>
                                {service.name} ({service.unit})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-row">
                    <label className="field-label">
                        Предыдущее показание
                        <input
                            name="previousValue"
                            type="number"
                            step="0.01"
                            value={form.previousValue}
                            readOnly
                        />
                    </label>

                    <label className="field-label">
                        Текущее показание
                        <input
                            name="currentValue"
                            type="number"
                            step="0.01"
                            placeholder="Введите новое показание"
                            value={form.currentValue}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field-label">
                        Дата показания
                        <input
                            name="readingDate"
                            type="date"
                            value={form.readingDate}
                            onChange={handleChange}
                            required
                        />
                    </label>
                </div>

                <div className="message success">
                    {previousInfo?.previousDate
                        ? `Последнее показание было ${formatNumber(previousInfo.previousValue)} от ${previousInfo.previousDate}. Расход сейчас: ${formatNumber(consumption)}`
                        : "Для выбранной квартиры и услуги прошлых показаний нет. Начальное значение будет 0."}
                </div>

                <button className="primary-btn" type="submit">
                    Добавить показания
                </button>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: квартира, услуга, показание, дата"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="apartment.apartmentNumber" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Квартира</SortableTh>
                        <SortableTh field="service.name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Услуга</SortableTh>
                        <SortableTh field="previousValue" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Предыдущее</SortableTh>
                        <SortableTh field="currentValue" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Текущее</SortableTh>
                        <th>Расход</th>
                        <SortableTh field="readingDate" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Дата</SortableTh>
                    </tr>
                </thead>

                <tbody>
                    {filteredReadings.map((reading) => (
                        <tr key={reading.id}>
                            <td>{reading.id}</td>
                            <td>{reading.apartment?.houseAddress}, кв. {reading.apartment?.apartmentNumber}</td>
                            <td>{reading.service?.name}</td>
                            <td>{formatNumber(reading.previousValue)}</td>
                            <td>{formatNumber(reading.currentValue)}</td>
                            <td>{formatNumber(getConsumption(reading.currentValue, reading.previousValue))} {reading.service?.unit}</td>
                            <td>{reading.readingDate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default MeterReadingsPage;
