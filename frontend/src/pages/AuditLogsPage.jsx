import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const loadLogs = async () => {
        const response = await api.get("/audit-logs");
        setLogs(response.data);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }
        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredLogs = useMemo(() => prepareTableData(
        logs,
        search,
        ["createdAt", "userLogin", "userRole", "action", "entity", "details"],
        sortBy,
        sortOrder
    ), [logs, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Журнал действий</h2>
                    <p>Последние операции пользователей в системе</p>
                </div>
            </div>

            <TableToolbar search={search} onSearchChange={setSearch} placeholder="Поиск: пользователь, действие, объект" />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Дата</SortableTh>
                        <SortableTh field="userLogin" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Пользователь</SortableTh>
                        <SortableTh field="userRole" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Роль</SortableTh>
                        <SortableTh field="action" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Действие</SortableTh>
                        <SortableTh field="entity" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Объект</SortableTh>
                        <th>Описание</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLogs.map((log) => (
                        <tr key={log.id}>
                            <td>{new Date(log.createdAt).toLocaleString("ru-RU")}</td>
                            <td>{log.userLogin || "—"}</td>
                            <td>{log.userRole || "—"}</td>
                            <td>{log.action}</td>
                            <td>{log.entity || "—"}</td>
                            <td>{log.details || "—"}</td>
                        </tr>
                    ))}
                    {filteredLogs.length === 0 && <tr><td colSpan="6">Записей нет</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

export default AuditLogsPage;
