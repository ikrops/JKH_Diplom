import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./DashboardPage.css";
import ApartmentsPage from "./ApartmentsPage";
import ServicesPage from "./ServicesPage";
import TariffsPage from "./TariffsPage";
import MeterReadingsPage from "./MeterReadingsPage";
import ChargesPage from "./ChargesPage";
import PaymentsPage from "./PaymentsPage";
import ReportsPage from "./ReportsPage";
import UsersPage from "./UsersPage";
import AuditLogsPage from "./AuditLogsPage";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

function DashboardPage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const [activePage, setActivePage] = useState(user?.role === "admin" ? "users" : user?.role === "accountant" ? "charges" : "residents");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const allMenuItems = [
        { key: "users", label: "Пользователи", roles: ["admin"] },
        { key: "residents", label: "Жильцы", roles: ["admin", "employee", "accountant"] },
        { key: "apartments", label: "Квартиры", roles: ["admin", "employee", "accountant"] },
        { key: "services", label: "Услуги", roles: ["admin", "employee", "accountant"] },
        { key: "tariffs", label: "Тарифы", roles: ["admin", "employee", "accountant"] },
        { key: "meter-readings", label: "Показания", roles: ["admin", "employee", "accountant"] },
        { key: "charges", label: "Начисления", roles: ["admin", "accountant"] },
        { key: "payments", label: "Платежи", roles: ["admin", "accountant"] },
        { key: "reports", label: "Отчёт", roles: ["admin", "accountant"] },
        { key: "audit", label: "Журнал действий", roles: ["admin"] },
    ];

    const menuItems = allMenuItems.filter((item) => item.roles.includes(user?.role));

    const renderPage = () => {
    if (activePage === "users") {
        return <UsersPage />;
    }

    if (activePage === "residents") {
        return <ResidentsPage />;
    }

    if (activePage === "apartments") {
        return <ApartmentsPage />;
    }

    if (activePage === "services") {
        return <ServicesPage />;
    }

    if (activePage === "tariffs") {
        return <TariffsPage />;
    }

    if (activePage === "meter-readings") {
        return <MeterReadingsPage />;
    }

    if (activePage === "charges") {
        return <ChargesPage />;
    }

    if (activePage === "payments") {
        return <PaymentsPage />;
    }

    if (activePage === "reports") {
        return <ReportsPage />;
    }

    if (activePage === "audit") {
        return <AuditLogsPage />;
    }

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Раздел в разработке</h2>
                    <p>Здесь будет модуль: {activePage}</p>
                </div>
            </div>
        </div>
    );
    };

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">ЖК</div>
                    <div>
                        <h2>ЖКХ Admin</h2>
                        <span>Учёт и расчёты</span>
                    </div>
                </div>

                <nav className="menu">
                    {menuItems.map((item) => (
                        <button
                            key={item.key}
                            className={activePage === item.key ? "active" : ""}
                            onClick={() => setActivePage(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="content">
                <div className="topbar">
                    <div>
                        <h1>Панель управления</h1>
                        <span>{user?.fullName} — {user?.role}</span>
                    </div>

                    <button className="logout-btn" onClick={logout}>
                        Выйти
                    </button>
                </div>

                <DashboardStats userRole={user?.role} />

                {renderPage()}
            </main>
        </div>
    );
}

function DashboardStats({ userRole }) {
    const [summary, setSummary] = useState(null);
    const [residentsCount, setResidentsCount] = useState(0);

    useEffect(() => {
        const loadStats = async () => {
            try {
                if (["admin", "employee", "accountant"].includes(userRole)) {
                    const residents = await api.get("/residents");
                    setResidentsCount(residents.data.length);
                }

                if (["admin", "accountant"].includes(userRole)) {
                    const report = await api.get("/reports/summary?period=2026-05");
                    setSummary(report.data);
                }
            } catch (error) {
                console.log("Ошибка загрузки статистики", error);
            }
        };

        loadStats();
    }, [userRole]);

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <span>Жильцов</span>
                <strong>{residentsCount}</strong>
            </div>

            <div className="stat-card">
                <span>Начислено</span>
                <strong>{summary ? `${summary.totalCharges} ₽` : "—"}</strong>
            </div>

            <div className="stat-card">
                <span>Оплачено</span>
                <strong>{summary ? `${summary.totalPaid} ₽` : "—"}</strong>
            </div>

            <div className="stat-card debt">
                <span>Задолженность</span>
                <strong>{summary ? `${summary.totalDebt} ₽` : "—"}</strong>
            </div>
        </div>
    );
}

function ResidentsPage() {
    const [residents, setResidents] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");
    const [form, setForm] = useState({
        fullName: "",
        accountNumber: "",
        phone: "",
        email: "",
        benefitPercent: 0,
        apartmentId: "",
    });

    const [apartments, setApartments] = useState([]);
    
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const loadResidents = async () => {
        try {
            const response = await api.get("/residents");
            setResidents(response.data);
        } catch {
            setMessage("Ошибка загрузки жильцов");
            setMessageType("error");
        }
    };

    const loadApartments = async () => {
        try {
            const response = await api.get("/apartments");
            setApartments(response.data);
        } catch {
            setMessage("Ошибка загрузки квартир");
            setMessageType("error");
        }
    };

    useEffect(() => {
        loadResidents();
        loadApartments();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const createResident = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        try {
            await api.post("/residents", {
                ...form,
                benefitPercent: Number(form.benefitPercent),
                apartmentId: form.apartmentId ? Number(form.apartmentId) : null,
            });

            setForm({
                fullName: "",
                accountNumber: "",
                phone: "",
                email: "",
                benefitPercent: 0,
                apartmentId: "",
            });

            setMessage("Жилец успешно добавлен");
            setMessageType("success");

            loadResidents();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка добавления жильца");
            setMessageType("error");
        }
    };

    const deleteResident = async (id) => {
        const isConfirmed = window.confirm("Удалить этого жильца?");

        if (!isConfirmed) {
            return;
        }

        setMessage("");
        setMessageType("");

        try {
            await api.delete(`/residents/${id}`);

            setMessage("Жилец удалён");
            setMessageType("success");

            loadResidents();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка удаления жильца");
            setMessageType("error");
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredResidents = useMemo(() => prepareTableData(
        residents,
        search,
        ["id", "fullName", "accountNumber", "phone", "email", "benefitPercent", "apartment.houseAddress", "apartment.apartmentNumber"],
        sortBy,
        sortOrder
    ), [residents, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Жильцы</h2>
                    <p>Управление базой жильцов, лицевыми счетами и процентом льготы</p>
                </div>
            </div>

            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            <form onSubmit={createResident} className="form-box">
                <div className="form-row">
                    <input
                        name="fullName"
                        placeholder="ФИО"
                        value={form.fullName}
                        onChange={handleChange}
                    />

                    <input
                        name="accountNumber"
                        placeholder="Лицевой счёт"
                        value={form.accountNumber}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <input
                        name="phone"
                        placeholder="Телефон"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    <input
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    <label className="field-label">
                        Льгота жильца, %
                        <input
                            name="benefitPercent"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            placeholder="0 — если льготы нет"
                            value={form.benefitPercent}
                            onChange={handleChange}
                        />
                    </label>
                </div>

                <div className="form-row">
                    <select
                        name="apartmentId"
                        value={form.apartmentId}
                        onChange={handleChange}
                        className="select-input"
                    >
                        <option value="">Выберите квартиру</option>

                        {apartments.map((apartment) => (
                            <option key={apartment.id} value={apartment.id}>
                                {apartment.houseAddress}, кв. {apartment.apartmentNumber}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="primary-btn" type="submit">
                    Добавить жильца
                </button>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: ФИО, лицевой счёт, телефон, квартира"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="fullName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ФИО</SortableTh>
                        <SortableTh field="accountNumber" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Лицевой счёт</SortableTh>
                        <SortableTh field="phone" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Телефон</SortableTh>
                        <SortableTh field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Email</SortableTh>
                        <SortableTh field="benefitPercent" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Льгота</SortableTh>
                        <SortableTh field="apartment.apartmentNumber" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Квартира</SortableTh>
                        <th>Действия</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredResidents.map((resident) => (
                        <tr key={resident.id}>
                            <td>{resident.id}</td>
                            <td>{resident.fullName}</td>
                            <td>{resident.accountNumber}</td>
                            <td>{resident.phone}</td>
                            <td>{resident.email}</td>
                            <td>{resident.benefitPercent}%</td>
                            <td>
                                {resident.apartment
                                    ? `${resident.apartment.houseAddress}, кв. ${resident.apartment.apartmentNumber}`
                                    : "Не указана"}
                            </td>
                            <td>
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteResident(resident.id)}
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

export default DashboardPage;

