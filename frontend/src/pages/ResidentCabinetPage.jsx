import { useEffect, useState } from "react";
import api from "../api/axios";
import "./DashboardPage.css";

const formatNumber = (value, digits = 2) => Number(value || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
});

const getConsumption = (currentValue, previousValue) => {
    const result = Number(currentValue || 0) - Number(previousValue || 0);
    return Math.max(Number(result.toFixed(2)), 0);
};

function ResidentCabinetPage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const [data, setData] = useState(null);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState("");
    const [activeTab, setActiveTab] = useState("profile");
    const [profileForm, setProfileForm] = useState({ phone: "", email: "" });
    const [readingForm, setReadingForm] = useState({ serviceId: "", currentValue: "", readingDate: new Date().toISOString().slice(0, 10) });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

    const loadCabinet = async () => {
        try {
            const response = await api.get("/resident-cabinet/me");
            setData(response.data);
            setProfileForm({
                phone: response.data.resident.phone || "",
                email: response.data.resident.email || "",
            });
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка загрузки личного кабинета");
        }
    };

    useEffect(() => {
        loadCabinet();
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        setSuccess("");
        setMessage("");
        try {
            await api.put("/resident-cabinet/me", profileForm);
            setSuccess("Контактные данные обновлены");
            loadCabinet();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка обновления данных");
        }
    };


    const changePassword = async (e) => {
        e.preventDefault();
        setSuccess("");
        setMessage("");
        try {
            await api.put("/auth/me/password", passwordForm);
            setSuccess("Пароль успешно изменён");
            setPasswordForm({ currentPassword: "", newPassword: "" });
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка смены пароля");
        }
    };

    const sendReading = async (e) => {
        e.preventDefault();
        setSuccess("");
        setMessage("");
        try {
            await api.post("/resident-cabinet/meter-readings", {
                serviceId: Number(readingForm.serviceId),
                currentValue: Number(readingForm.currentValue),
                readingDate: readingForm.readingDate,
            });
            setSuccess("Показания успешно переданы");
            setReadingForm({ serviceId: "", currentValue: "", readingDate: new Date().toISOString().slice(0, 10) });
            loadCabinet();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка передачи показаний");
        }
    };

    if (message && !data) {
        return (
            <div className="dashboard">
                <main className="content">
                    <div className="card">
                        <div className="message error">{message}</div>
                        <button className="logout-btn" onClick={logout}>Выйти</button>
                    </div>
                </main>
            </div>
        );
    }

    if (!data) {
        return <div className="dashboard"><main className="content"><div className="card"><h2>Загрузка личного кабинета...</h2></div></main></div>;
    }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">ЛК</div>
                    <div><h2>Кабинет</h2><span>Жилец</span></div>
                </div>

                <nav className="menu">
                    <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>Мои данные</button>
                    <button className={activeTab === "charges" ? "active" : ""} onClick={() => setActiveTab("charges")}>Начисления</button>
                    <button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}>Платежи</button>
                    <button className={activeTab === "readings" ? "active" : ""} onClick={() => setActiveTab("readings")}>Показания</button>
                    <button className={activeTab === "debt" ? "active" : ""} onClick={() => setActiveTab("debt")}>Задолженность</button>
                </nav>
            </aside>

            <main className="content">
                <div className="topbar">
                    <div><h1>Личный кабинет жильца</h1><span>{user?.fullName} — {user?.role}</span></div>
                    <button className="logout-btn" onClick={logout}>Выйти</button>
                </div>

                {message && <div className="message error">{message}</div>}
                {success && <div className="message success">{success}</div>}

                <div className="stats-grid">
                    <div className="stat-card"><span>Начислено</span><strong>{data.summary.totalCharges} ₽</strong></div>
                    <div className="stat-card"><span>Оплачено</span><strong>{data.summary.totalPaid} ₽</strong></div>
                    <div className="stat-card debt"><span>Задолженность</span><strong>{data.summary.totalDebt} ₽</strong></div>
                    <div className="stat-card"><span>Лицевой счёт</span><strong>{data.resident.accountNumber}</strong></div>
                </div>

                {activeTab === "profile" && (
                    <div className="card cabinet-grid">
                        <div>
                            <div className="section-header"><div><h2>Моя информация</h2><p>Персональные данные жильца</p></div></div>
                            <div className="info-list">
                                <p><strong>ФИО:</strong> {data.resident.fullName}</p>
                                <p><strong>Телефон:</strong> {data.resident.phone}</p>
                                <p><strong>Email:</strong> {data.resident.email}</p>
                                <p><strong>Льгота:</strong> {data.resident.benefitPercent}%</p>
                            </div>

                            <form className="form-box" onSubmit={updateProfile}>
                                <div className="form-row">
                                    <input placeholder="Телефон" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                                    <input placeholder="Email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                                </div>
                                <button className="primary-btn" type="submit">Обновить контакты</button>
                            </form>

                            <form className="form-box" onSubmit={changePassword}>
                                <div className="section-header"><div><h2>Смена пароля</h2><p>Пароль не отображается в системе, его можно только заменить</p></div></div>
                                <div className="form-row">
                                    <input type="password" placeholder="Текущий пароль" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                                    <input type="password" placeholder="Новый пароль" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                                </div>
                                <button className="secondary-btn" type="submit">Сменить пароль</button>
                            </form>
                        </div>

                        <div>
                            <div className="section-header"><div><h2>Моя квартира</h2><p>Информация об объекте недвижимости</p></div></div>
                            <div className="info-list">
                                <p><strong>Адрес:</strong> {data.apartment?.houseAddress}</p>
                                <p><strong>Квартира:</strong> {data.apartment?.apartmentNumber}</p>
                                <p><strong>Площадь:</strong> {data.apartment?.area} м²</p>
                                <p><strong>Проживающих:</strong> {data.apartment?.residentsCount}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "charges" && <SimpleTable title="Мои начисления" headers={["ID", "Период", "Услуга", "Сумма", "Статус"]} rows={data.charges.map((charge) => [charge.id, charge.period, charge.service?.name, `${charge.amount} ₽`, charge.status === "paid" ? "Оплачено" : "Не оплачено"])} />}

                {activeTab === "payments" && <SimpleTable title="Мои платежи" headers={["ID", "Начисление", "Услуга", "Сумма", "Дата", "Способ"]} rows={data.payments.map((payment) => [payment.id, payment.chargeId, payment.charge?.service?.name, `${payment.amount} ₽`, payment.paymentDate, payment.paymentMethod])} />}

                {activeTab === "readings" && (
                    <div className="card cabinet-section">
                        <div className="section-header"><div><h2>Передача показаний</h2><p>Ввод текущих показаний приборов учёта</p></div></div>
                        <form onSubmit={sendReading} className="form-box">
                            <div className="form-row">
                                <select className="select-input" value={readingForm.serviceId} onChange={(e) => setReadingForm({ ...readingForm, serviceId: e.target.value })}>
                                    <option value="">Выберите счётчик</option>
                                    {data.meterServices.map((service) => <option key={service.id} value={service.id}>{service.name} ({service.unit})</option>)}
                                </select>
                                <input type="number" step="0.01" placeholder="Текущее показание" value={readingForm.currentValue} onChange={(e) => setReadingForm({ ...readingForm, currentValue: e.target.value })} />
                                <input type="date" value={readingForm.readingDate} onChange={(e) => setReadingForm({ ...readingForm, readingDate: e.target.value })} />
                            </div>
                            <button className="primary-btn" type="submit">Передать показания</button>
                        </form>

                        <SimpleTable title="История показаний" headers={["Дата", "Услуга", "Предыдущее", "Текущее", "Расход"]} rows={data.meterReadings.map((reading) => [reading.readingDate, reading.service?.name, formatNumber(reading.previousValue), formatNumber(reading.currentValue), `${formatNumber(getConsumption(reading.currentValue, reading.previousValue))} ${reading.service?.unit || ""}`])} />
                    </div>
                )}

                {activeTab === "debt" && (
                    <div className="card cabinet-section">
                        <div className="section-header"><div><h2>Задолженность</h2><p>Итоговое состояние лицевого счёта</p></div></div>
                        <div className="report-summary"><p>К оплате по лицевому счёту <strong>{data.resident.accountNumber}</strong>: <strong>{data.summary.totalDebt} ₽</strong>.</p></div>
                    </div>
                )}
            </main>
        </div>
    );
}

function SimpleTable({ title, headers, rows }) {
    return (
        <div className="card cabinet-section">
            <div className="section-header"><div><h2>{title}</h2></div></div>
            <table className="table">
                <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                <tbody>
                    {rows.length > 0 ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}>Данных пока нет</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

export default ResidentCabinetPage;
