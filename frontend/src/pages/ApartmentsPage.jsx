import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

function ApartmentsPage() {
    const [apartments, setApartments] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [form, setForm] = useState({
        houseAddress: "",
        apartmentNumber: "",
        area: "",
        residentsCount: "",
    });

    const loadApartments = async () => {
        const response = await api.get("/apartments");
        setApartments(response.data);
    };

    useEffect(() => {
        loadApartments();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const createApartment = async (e) => {
        e.preventDefault();

        await api.post("/apartments", {
            houseAddress: form.houseAddress,
            apartmentNumber: form.apartmentNumber,
            area: Number(form.area),
            residentsCount: Number(form.residentsCount),
        });

        setForm({
            houseAddress: "",
            apartmentNumber: "",
            area: "",
            residentsCount: "",
        });

        loadApartments();
    };

    const deleteApartment = async (id) => {
    const isConfirmed = window.confirm("Удалить эту квартиру?");

        if (!isConfirmed) {
            return;
        }

    await api.delete(`/apartments/${id}`);
    loadApartments();
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredApartments = useMemo(() => prepareTableData(
        apartments,
        search,
        ["id", "houseAddress", "apartmentNumber", "area", "residentsCount"],
        sortBy,
        sortOrder
    ), [apartments, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Квартиры</h2>
                    <p>Учёт объектов недвижимости и привязанных жильцов</p>
                </div>
            </div>

            <form onSubmit={createApartment} className="form-box">
                <div className="form-row">
                    <input
                        name="houseAddress"
                        placeholder="Адрес дома"
                        value={form.houseAddress}
                        onChange={handleChange}
                    />

                    <input
                        name="apartmentNumber"
                        placeholder="Номер квартиры"
                        value={form.apartmentNumber}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <input
                        name="area"
                        type="number"
                        step="0.1"
                        placeholder="Площадь, м²"
                        value={form.area}
                        onChange={handleChange}
                    />

                    <input
                        name="residentsCount"
                        type="number"
                        placeholder="Количество проживающих"
                        value={form.residentsCount}
                        onChange={handleChange}
                    />
                </div>

                <button className="primary-btn" type="submit">
                    Добавить квартиру
                </button>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: адрес, номер квартиры, площадь"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="houseAddress" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Адрес</SortableTh>
                        <SortableTh field="apartmentNumber" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Квартира</SortableTh>
                        <SortableTh field="area" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Площадь</SortableTh>
                        <SortableTh field="residentsCount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Проживающих</SortableTh>
                        <th>Жильцы</th>
                        <th>Действия</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredApartments.map((apartment) => (
                        <tr key={apartment.id}>
                            <td>{apartment.id}</td>
                            <td>{apartment.houseAddress}</td>
                            <td>{apartment.apartmentNumber}</td>
                            <td>{apartment.area} м²</td>
                            <td>{apartment.residentsCount}</td>
                            <td>
                                {apartment.residents?.length > 0
                                    ? apartment.residents
                                        .map((resident) => resident.fullName)
                                        .join(", ")
                                    : "Нет жильцов"}
                            </td>
                            <td>
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteApartment(apartment.id)}
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ApartmentsPage;