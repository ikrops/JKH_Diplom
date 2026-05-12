import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import TableToolbar from "../components/TableToolbar";
import SortableTh from "../components/SortableTh";
import { prepareTableData } from "../utils/tableHelpers";

const emptyForm = {
    fullName: "",
    login: "",
    password: "",
    role: "resident",
    email: "",
};

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const loadUsers = async () => {
        const response = await api.get("/auth/users");
        setUsers(response.data);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const saveUser = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        try {
            const payload = { ...form };
            if (editingId && !payload.password) {
                delete payload.password;
            }

            if (editingId) {
                await api.put(`/auth/users/${editingId}`, payload);
                setMessage("Пользователь обновлён");
            } else {
                await api.post("/auth/register", payload);
                setMessage("Пользователь создан");
            }

            setMessageType("success");
            resetForm();
            loadUsers();
        } catch (error) {
            setMessage(error.response?.data?.message || "Ошибка сохранения пользователя");
            setMessageType("error");
        }
    };

    const editUser = (user) => {
        setEditingId(user.id);
        setForm({
            fullName: user.fullName || "",
            login: user.login || "",
            password: "",
            role: user.role || "resident",
            email: user.email || "",
        });
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Удалить пользователя?")) return;
        await api.delete(`/auth/users/${id}`);
        loadUsers();
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            return;
        }

        setSortBy(field);
        setSortOrder("asc");
    };

    const filteredUsers = useMemo(() => prepareTableData(
        users,
        search,
        ["id", "fullName", "login", "role", "email", "resident.fullName", "resident.accountNumber"],
        sortBy,
        sortOrder
    ), [users, search, sortBy, sortOrder]);

    return (
        <div className="card">
            <div className="section-header">
                <div>
                    <h2>Пользователи</h2>
                    <p>Пароли не отображаются в таблице из-за безопасности. Для смены пароля нажмите «Изменить» и заполните поле «Новый пароль».</p>
                </div>
            </div>

            {message && <div className={`message ${messageType}`}>{message}</div>}

            <form onSubmit={saveUser} className="form-box">
                <div className="form-row">
                    <input name="fullName" placeholder="ФИО" value={form.fullName} onChange={handleChange} />
                    <input name="login" placeholder="Логин" value={form.login} onChange={handleChange} />
                    <input name="password" type="password" placeholder={editingId ? "Новый пароль, если нужно сменить" : "Пароль"} value={form.password} onChange={handleChange} required={!editingId} />
                </div>

                <div className="form-row">
                    <select name="role" value={form.role} onChange={handleChange} className="select-input">
                        <option value="admin">Администратор</option>
                        <option value="employee">Сотрудник</option>
                        <option value="accountant">Бухгалтер</option>
                        <option value="resident">Жилец</option>
                    </select>
                    <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
                </div>

                <div className="form-actions">
                    <button className="primary-btn" type="submit">
                        {editingId ? "Сохранить изменения" : "Создать пользователя"}
                    </button>
                    {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>Отмена</button>}
                </div>
            </form>

            <TableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Поиск: ФИО, логин, роль, email"
            />

            <table className="table">
                <thead>
                    <tr>
                        <SortableTh field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ID</SortableTh>
                        <SortableTh field="fullName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>ФИО</SortableTh>
                        <SortableTh field="login" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Логин</SortableTh>
                        <SortableTh field="role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Роль</SortableTh>
                        <SortableTh field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Email</SortableTh>
                        <th>Пароль</th>
                        <SortableTh field="resident.fullName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Профиль жильца</SortableTh>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.fullName}</td>
                            <td>{user.login}</td>
                            <td>{user.role}</td>
                            <td>{user.email}</td>
                            <td>Скрыт / можно сменить</td>
                            <td>{user.resident ? `${user.resident.fullName}, л/с ${user.resident.accountNumber}` : "—"}</td>
                            <td>
                                <button className="edit-btn" onClick={() => editUser(user)}>Изменить</button>
                                <button className="delete-btn" onClick={() => deleteUser(user.id)}>Удалить</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default UsersPage;
