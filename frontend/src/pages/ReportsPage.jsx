import { useEffect, useState } from "react";
import api from "../api/axios";

function ReportsPage() {
    const [period, setPeriod] = useState("2026-05");
    const [report, setReport] = useState(null);
    const [debtors, setDebtors] = useState(null);

    const loadReport = async () => {
        const response = await api.get(`/reports/summary?period=${period}`);
        setReport(response.data);

        const debtorsResponse = await api.get(`/reports/debtors?period=${period}`);
        setDebtors(debtorsResponse.data);
    };

    useEffect(() => {
        loadReport();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        loadReport();
    };

    const printReport = () => {
        window.print();
    };
    const exportCsv = () => {
        if (!debtors) return;
        const rows = [
            ["Период", "Квартира", "Жильцы", "Услуга", "Начислено", "Оплачено", "Долг"],
            ...debtors.debtors.map((item) => [
                item.period,
                `${item.apartment?.houseAddress || ""}, кв. ${item.apartment?.apartmentNumber || ""}`,
                item.residents?.map((resident) => resident.fullName).join(", ") || "—",
                item.service,
                item.amount,
                item.paid,
                item.debt,
            ]),
        ];

        const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `debtors_${period}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };


    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Отчётность</h2>
                    <p>Сводный отчёт по начислениям, оплатам и задолженности</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="form-box">
                <div className="form-row">
                    <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
                </div>

                <div className="form-actions">
                    <button className="primary-btn" type="submit">Сформировать отчёт</button>
                    <button className="secondary-btn" type="button" onClick={printReport}>Печать</button>
                    <button className="secondary-btn" type="button" onClick={exportCsv}>Экспорт CSV</button>
                </div>
            </form>

            {report && (
                <>
                    <div className="report-grid">
                        <div className="report-card"><span>Период</span><strong>{report.period}</strong></div>
                        <div className="report-card"><span>Начислено</span><strong>{report.totalCharges} ₽</strong></div>
                        <div className="report-card"><span>Оплачено</span><strong>{report.totalPaid} ₽</strong></div>
                        <div className="report-card debt"><span>Задолженность</span><strong>{report.totalDebt} ₽</strong></div>
                        <div className="report-card"><span>Кол-во начислений</span><strong>{report.chargesCount}</strong></div>
                        <div className="report-card"><span>Кол-во платежей</span><strong>{report.paymentsCount}</strong></div>
                    </div>

                    <div className="report-summary">
                        <h3>Итог по периоду {report.period}</h3>
                        <p>
                            За выбранный период начислено <strong>{report.totalCharges} ₽</strong>, оплачено <strong>{report.totalPaid} ₽</strong>.
                            Текущая задолженность составляет <strong>{report.totalDebt} ₽</strong>.
                        </p>
                    </div>
                </>
            )}

            {debtors && (
                <div className="report-summary">
                    <h3>Список должников</h3>
                    <p>Всего позиций с задолженностью: <strong>{debtors.debtorsCount}</strong>. Общая сумма: <strong>{debtors.totalDebt} ₽</strong>.</p>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Период</th>
                                <th>Квартира</th>
                                <th>Жильцы</th>
                                <th>Услуга</th>
                                <th>Начислено</th>
                                <th>Оплачено</th>
                                <th>Долг</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debtors.debtors.map((item) => (
                                <tr key={item.chargeId}>
                                    <td>{item.period}</td>
                                    <td>{item.apartment?.houseAddress}, кв. {item.apartment?.apartmentNumber}</td>
                                    <td>{item.residents?.map((resident) => resident.fullName).join(", ") || "—"}</td>
                                    <td>{item.service}</td>
                                    <td>{item.amount} ₽</td>
                                    <td>{item.paid} ₽</td>
                                    <td>{item.debt} ₽</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ReportsPage;
