import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

function ChargesPage() {
    const [charges, setCharges] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [apartments, setApartments] = useState([]);
    const [services, setServices] = useState([]);

    const [form, setForm] = useState({
        apartmentId: "",
        serviceId: "",
        period: "2026-05",
    });

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const loadCharges = async () => {
        const response = await api.get("/charges");
        setCharges(response.data);
    };

    const loadApartments = async () => {
        const response = await api.get("/apartments");
        setApartments(response.data);
    };

    const loadServices = async () => {
        const response = await api.get("/services");
        setServices(response.data);
    };

    useEffect(() => {
        loadCharges();
        loadApartments();
        loadServices();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const createCharge = async (e) => {
    e.preventDefault();

        setMessage("");
        setMessageType("");

        try {
            await api.post("/charges", {
                apartmentId: Number(form.apartmentId),
                serviceId: Number(form.serviceId),
                period: form.period,
            });

            setForm({
                apartmentId: "",
                serviceId: "",
                period: "2026-05",
            });

            setMessage("Начисление успешно создано");
            setMessageType("success");

            loadCharges();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка создания начисления");
            setMessageType("error");
        }
    };

    const getStatusText = (status) => {
        if (status === "paid") return "Оплачено";
        if (status === "unpaid") return "Не оплачено";
        return status;
    };

    const getStatusClass = (charge) => {
        const paidTotal = Number(charge.paidTotal || 0);
        const remaining = Number(charge.remainingAmount ?? charge.amount ?? 0);

        if (remaining <= 0 || charge.status === "paid") return "paid";
        if (paidTotal > 0) return "partial";
        return "unpaid";
    };

    const printReceipt = (charge) => {
        const apartment = charge.apartment
            ? `${charge.apartment.houseAddress || ""}, кв. ${charge.apartment.apartmentNumber || ""}`
            : "—";
        const statusText = charge.paymentStatusText || getStatusText(charge.status);
        const paidTotal = Number(charge.paidTotal || 0).toFixed(2);
        const remaining = Number(charge.remainingAmount ?? charge.amount ?? 0).toFixed(2);
        const amount = Number(charge.amount || 0).toFixed(2);

        const receiptHtml = `
            <html>
                <head>
                    <title>Квитанция №${charge.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 32px; color: #222; }
                        .receipt { max-width: 720px; margin: 0 auto; border: 1px solid #ccc; padding: 24px; }
                        h1 { margin-top: 0; font-size: 24px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
                        td { border: 1px solid #ddd; padding: 10px; }
                        td:first-child { font-weight: 700; background: #f5f5f5; width: 40%; }
                        .total { font-size: 18px; font-weight: 700; }
                        .footer { margin-top: 28px; font-size: 13px; color: #666; }
                        @media print { button { display: none; } body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <h1>Квитанция на оплату коммунальных услуг</h1>
                        <table>
                            <tr><td>Номер начисления</td><td>№${charge.id}</td></tr>
                            <tr><td>Период</td><td>${charge.period}</td></tr>
                            <tr><td>Квартира</td><td>${apartment}</td></tr>
                            <tr><td>Услуга</td><td>${charge.service?.name || "—"}</td></tr>
                            <tr><td>Начислено</td><td>${amount} ₽</td></tr>
                            <tr><td>Оплачено</td><td>${paidTotal} ₽</td></tr>
                            <tr><td>Остаток к оплате</td><td class="total">${remaining} ₽</td></tr>
                            <tr><td>Статус</td><td>${statusText}</td></tr>
                        </table>
                        <div class="footer">Квитанция сформирована автоматически в веб-приложении учёта и расчётов ЖКХ.</div>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;

        const receiptWindow = window.open("", "_blank", "width=800,height=900");
        receiptWindow.document.write(receiptHtml);
        receiptWindow.document.close();
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredCharges = useMemo(() => prepareTableData(
        charges,
        search,
        ["id", "period", "apartment.houseAddress", "apartment.apartmentNumber", "service.name", "amount", "paidTotal", "remainingAmount", "paymentStatusText"],
        sortBy,
        sortOrder
    ), [charges, search, sortBy, sortOrder]);

    const usedServiceIds = useMemo(() => {
        if (!form.apartmentId || !form.period) return new Set();

        return new Set(
            charges
                .filter((charge) =>
                    Number(charge.apartmentId) === Number(form.apartmentId) &&
                    charge.period === form.period
                )
                .map((charge) => Number(charge.serviceId))
        );
    }, [charges, form.apartmentId, form.period]);

    const availableServices = useMemo(() =>
        services.filter((service) => !usedServiceIds.has(Number(service.id))),
        [services, usedServiceIds]
    );

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Начисления</h2>
                    <p>Автоматический расчёт коммунальных платежей по тарифам</p>
                </div>
            </div>

            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            <form onSubmit={createCharge} className="form-box">
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
                        {availableServices.map((service) => (
                            <option key={service.id} value={service.id}>
                                {service.name} ({service.unit})
                            </option>
                        ))}
                    </select>

                    {form.apartmentId && form.period && availableServices.length === 0 && (
                        <span className="form-hint">За выбранный месяц по этой квартире уже созданы начисления по всем услугам.</span>
                    )}

                    <input
                        name="period"
                        type="month"
                        value={form.period}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button className="primary-btn" type="submit">
                    Создать начисление
                </button>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: период, квартира, услуга, сумма, статус"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="period" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Период</SortableTh>
                        <SortableTh field="apartment.apartmentNumber" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Квартира</SortableTh>
                        <SortableTh field="service.name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Услуга</SortableTh>
                        <SortableTh field="amount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Сумма</SortableTh>
                        <SortableTh field="paidTotal" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Оплачено</SortableTh>
                        <SortableTh field="remainingAmount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Остаток</SortableTh>
                        <SortableTh field="paymentStatusText" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Статус</SortableTh>
                        <th>Квитанция</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredCharges.map((charge) => (
                        <tr key={charge.id}>
                            <td>{charge.id}</td>
                            <td>{charge.period}</td>
                            <td>
                                {charge.apartment?.houseAddress}, кв.{" "}
                                {charge.apartment?.apartmentNumber}
                            </td>
                            <td>{charge.service?.name}</td>
                            <td>{charge.amount} ₽</td>
                            <td>{charge.paidTotal ?? 0} ₽</td>
                            <td>{charge.remainingAmount ?? charge.amount} ₽</td>
                            <td>
                                <span
                                    className={`status-badge ${getStatusClass(charge)}`}
                                >
                                    {charge.paymentStatusText || getStatusText(charge.status)}
                                </span>
                            </td>
                            <td>
                                <button className="secondary-btn" type="button" onClick={() => printReceipt(charge)}>
                                    Квитанция
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ChargesPage;