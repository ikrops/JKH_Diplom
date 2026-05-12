import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

function ServicesPage() {
    const [services, setServices] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [form, setForm] = useState({
        name: "",
        unit: "",
        calculationType: "meter",
        description: "",
    });

    const loadServices = async () => {
        const response = await api.get("/services");
        setServices(response.data);
    };

    useEffect(() => {
        loadServices();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const createService = async (e) => {
        e.preventDefault();

        await api.post("/services", form);

        setForm({
            name: "",
            unit: "",
            calculationType: "meter",
            description: "",
        });

        loadServices();
    };

    const getCalculationTypeText = (type) => {
        if (type === "meter") return "По счётчику";
        if (type === "area") return "По площади";
        if (type === "resident") return "По жильцам";
        return type;
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredServices = useMemo(() => prepareTableData(
        services,
        search,
        ["id", "name", "unit", "calculationType", "description"],
        sortBy,
        sortOrder
    ), [services, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Услуги</h2>
                    <p>Справочник коммунальных услуг и способов расчёта</p>
                </div>
            </div>

            <form onSubmit={createService} className="form-box">
                <div className="form-row">
                    <input
                        name="name"
                        placeholder="Название услуги"
                        value={form.name}
                        onChange={handleChange}
                    />

                    <input
                        name="unit"
                        placeholder="Единица измерения, например кВт·ч, м², чел."
                        value={form.unit}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <select
                        name="calculationType"
                        value={form.calculationType}
                        onChange={handleChange}
                        className="select-input"
                    >
                        <option value="meter">По счётчику</option>
                        <option value="area">По площади</option>
                        <option value="resident">По количеству жильцов</option>
                    </select>

                    <input
                        name="description"
                        placeholder="Описание услуги"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                <button className="primary-btn" type="submit">
                    Добавить услугу
                </button>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: название, единица, тип расчёта"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Название</SortableTh>
                        <SortableTh field="unit" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Ед. изм.</SortableTh>
                        <SortableTh field="calculationType" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Тип расчёта</SortableTh>
                        <SortableTh field="description" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Описание</SortableTh>
                    </tr>
                </thead>

                <tbody>
                    {filteredServices.map((service) => (
                        <tr key={service.id}>
                            <td>{service.id}</td>
                            <td>{service.name}</td>
                            <td>{service.unit}</td>
                            <td>{getCalculationTypeText(service.calculationType)}</td>
                            <td>{service.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ServicesPage;