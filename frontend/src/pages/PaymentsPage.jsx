import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [charges, setCharges] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [form, setForm] = useState({
        chargeId: "",
        amount: "",
        paymentDate: "",
        paymentMethod: "cash",
    });

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const loadPayments = async () => {
        const response = await api.get("/payments");
        setPayments(response.data);
    };

    const loadCharges = async () => {
        const response = await api.get("/charges", { params: { status: "unpaid" } });
        setCharges(response.data);
    };

    useEffect(() => {
        loadPayments();
        loadCharges();
    }, []);

    const getPaidTotal = (charge) => {
        if (!charge?.payments?.length) return 0;
        return charge.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    };

    const getRemainingAmount = (charge) => {
        const remaining = Number(charge.amount || 0) - getPaidTotal(charge);
        return Number(Math.max(remaining, 0).toFixed(2));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value,
        });

        if (name === "chargeId") {
            const selectedCharge = charges.find(
                (charge) => charge.id === Number(value)
            );

            if (selectedCharge) {
                setForm((prev) => ({
                    ...prev,
                    chargeId: value,
                    amount: getRemainingAmount(selectedCharge),
                }));
            }
        }
    };

    const createPayment = async (e) => {
        e.preventDefault();

        setMessage("");
        setMessageType("");

        try {
            await api.post("/payments", {
                chargeId: Number(form.chargeId),
                amount: Number(form.amount),
                paymentDate: form.paymentDate,
                paymentMethod: form.paymentMethod,
            });

            setForm({
                chargeId: "",
                amount: "",
                paymentDate: "",
                paymentMethod: "cash",
            });

            setMessage("Платёж успешно зарегистрирован");
            setMessageType("success");

            loadPayments();
            loadCharges();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка регистрации платежа");
            setMessageType("error");
        }
    };

    const getPaymentMethodText = (method) => {
        if (method === "cash") return "Наличные";
        if (method === "card") return "Карта";
        if (method === "bank") return "Банк";
        return method;
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredPayments = useMemo(() => prepareTableData(
        payments,
        search,
        ["id", "chargeId", "charge.apartment.houseAddress", "charge.apartment.apartmentNumber", "charge.service.name", "amount", "paymentDate", "paymentMethod"],
        sortBy,
        sortOrder
    ), [payments, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Платежи</h2>
                    <p>В списке начислений отображаются только неоплаченные позиции</p>
                </div>
            </div>

            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            <form onSubmit={createPayment} className="form-box">
                <div className="form-row">
                    <select
                        name="chargeId"
                        value={form.chargeId}
                        onChange={handleChange}
                        className="select-input"
                        required
                    >
                        <option value="">Выберите неоплаченное начисление</option>
                        {charges.map((charge) => (
                            <option key={charge.id} value={charge.id}>
                                #{charge.id} — {charge.service?.name}, кв. {charge.apartment?.apartmentNumber}, к оплате {getRemainingAmount(charge)} ₽
                            </option>
                        ))}
                    </select>

                    <input
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="Сумма оплаты"
                        value={form.amount}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <input
                        name="paymentDate"
                        type="date"
                        value={form.paymentDate}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="paymentMethod"
                        value={form.paymentMethod}
                        onChange={handleChange}
                        className="select-input"
                    >
                        <option value="cash">Наличные</option>
                        <option value="card">Карта</option>
                        <option value="bank">Банк</option>
                    </select>
                </div>

                <button className="primary-btn" type="submit">
                    Зарегистрировать платёж
                </button>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: квартира, услуга, дата, сумма"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="chargeId" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Начисление</SortableTh>
                        <SortableTh field="charge.apartment.apartmentNumber" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Квартира</SortableTh>
                        <SortableTh field="charge.service.name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Услуга</SortableTh>
                        <SortableTh field="amount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Сумма</SortableTh>
                        <SortableTh field="paymentDate" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Дата оплаты</SortableTh>
                        <SortableTh field="paymentMethod" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Способ</SortableTh>
                    </tr>
                </thead>

                <tbody>
                    {filteredPayments.map((payment) => (
                        <tr key={payment.id}>
                            <td>{payment.id}</td>
                            <td>#{payment.chargeId}</td>
                            <td>{payment.charge?.apartment?.houseAddress}, кв. {payment.charge?.apartment?.apartmentNumber}</td>
                            <td>{payment.charge?.service?.name}</td>
                            <td>{payment.amount} ₽</td>
                            <td>{payment.paymentDate}</td>
                            <td>{getPaymentMethodText(payment.paymentMethod)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PaymentsPage;
