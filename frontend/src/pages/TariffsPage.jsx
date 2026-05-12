import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

const today = () => new Date().toISOString().slice(0, 10);

function TariffsPage() {
    const [tariffs, setTariffs] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [services, setServices] = useState([]);

    const [form, setForm] = useState({
        serviceId: "",
        price: "",
        startDate: today(),
        endDate: "",
    });

    const loadTariffs = async () => {
        const response = await api.get("/tariffs");
        setTariffs(response.data);
    };

    const loadServices = async () => {
        const response = await api.get("/services");
        setServices(response.data);
    };

    useEffect(() => {
        loadTariffs();
        loadServices();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const createTariff = async (e) => {
        e.preventDefault();

        await api.post("/tariffs", {
            serviceId: Number(form.serviceId),
            price: Number(form.price),
            startDate: form.startDate,
            endDate: form.endDate || null,
        });

        setForm({
            serviceId: "",
            price: "",
            startDate: today(),
            endDate: "",
        });

        loadTariffs();
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredTariffs = useMemo(() => prepareTableData(
        tariffs,
        search,
        ["id", "service.name", "service.unit", "price", "startDate", "endDate"],
        sortBy,
        sortOrder
    ), [tariffs, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Тарифы</h2>
                    <p>Дата начала подставляется автоматически, дату окончания можно оставить пустой</p>
                </div>
            </div>

            <form onSubmit={createTariff} className="form-box">
                <div className="form-row">
                    <select
                        name="serviceId"
                        value={form.serviceId}
                        onChange={handleChange}
                        className="select-input"
                    >
                        <option value="">Выберите услугу</option>
                        {services.map((service) => (
                            <option key={service.id} value={service.id}>
                                {service.name} ({service.unit})
                            </option>
                        ))}
                    </select>

                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="Цена тарифа"
                        value={form.price}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <label className="field-label">
                        Дата начала действия
                        <input
                            name="startDate"
                            type="date"
                            value={form.startDate}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field-label">
                        Дата окончания, если тариф временный
                        <input
                            name="endDate"
                            type="date"
                            value={form.endDate}
                            onChange={handleChange}
                        />
                    </label>
                </div>

                <button className="primary-btn" type="submit">
                    Добавить тариф
                </button>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: услуга, цена, дата"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="service.name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Услуга</SortableTh>
                        <SortableTh field="service.unit" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Ед. изм.</SortableTh>
                        <SortableTh field="price" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Цена</SortableTh>
                        <SortableTh field="startDate" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Дата начала</SortableTh>
                        <SortableTh field="endDate" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Дата окончания</SortableTh>
                    </tr>
                </thead>

                <tbody>
                    {filteredTariffs.map((tariff) => (
                        <tr key={tariff.id}>
                            <td>{tariff.id}</td>
                            <td>{tariff.service?.name}</td>
                            <td>{tariff.service?.unit}</td>
                            <td>{tariff.price} ₽</td>
                            <td>{tariff.startDate}</td>
                            <td>{tariff.endDate || "Действует"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TariffsPage;