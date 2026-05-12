import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./LoginPage.css";

const emptyRegisterForm = {
    fullName: "",
    login: "",
    password: "",
    repeatPassword: "",
    email: "",
    phone: "",
    accountNumber: "",
};

function LoginPage() {
    const navigate = useNavigate();

    const [mode, setMode] = useState("login");
    const [login, setLogin] = useState("admin");
    const [password, setPassword] = useState("123456");
    const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const response = await api.post("/auth/login", {
                login,
                password,
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            if (response.data.user.role === "resident") {
                navigate("/resident-cabinet");
            } else {
                navigate("/dashboard");
            }

            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || "Ошибка входа");
        }
    };

    const handleRegisterChange = (e) => {
        setRegisterForm({
            ...registerForm,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (registerForm.password !== registerForm.repeatPassword) {
            setError("Пароли не совпадают");
            return;
        }

        if (registerForm.password.length < 4) {
            setError("Пароль должен содержать минимум 4 символа");
            return;
        }

        try {
            await api.post("/auth/register", {
                fullName: registerForm.fullName,
                login: registerForm.login,
                password: registerForm.password,
                email: registerForm.email,
                phone: registerForm.phone,
                accountNumber: registerForm.accountNumber,
            });

            setSuccess("Регистрация выполнена. Теперь можно войти в систему.");
            setLogin(registerForm.login);
            setPassword("");
            setRegisterForm(emptyRegisterForm);
            setMode("login");
        } catch (err) {
            setError(err.response?.data?.message || "Ошибка регистрации");
        }
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={mode === "login" ? handleSubmit : handleRegister}>
                <h1>Система ЖКХ</h1>
                <p>{mode === "login" ? "Вход в систему" : "Регистрация жильца"}</p>

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={mode === "login" ? "active" : ""}
                        onClick={() => {
                            setMode("login");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Вход
                    </button>
                    <button
                        type="button"
                        className={mode === "register" ? "active" : ""}
                        onClick={() => {
                            setMode("register");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Регистрация
                    </button>
                </div>

                {error && <div className="error">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {mode === "login" ? (
                    <>
                        <label>Логин</label>
                        <input
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="Введите логин"
                        />

                        <label>Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                        />

                        <div className="security-note">
                            После 5 неверных попыток вход временно ограничивается.
                        </div>

                        <button type="submit">Войти</button>
                    </>
                ) : (
                    <>
                        <label>ФИО</label>
                        <input
                            name="fullName"
                            value={registerForm.fullName}
                            onChange={handleRegisterChange}
                            placeholder="Иванов Иван Иванович"
                            required
                        />

                        <label>Логин</label>
                        <input
                            name="login"
                            value={registerForm.login}
                            onChange={handleRegisterChange}
                            placeholder="Придумайте логин"
                            required
                        />

                        <label>Email</label>
                        <input
                            name="email"
                            type="email"
                            value={registerForm.email}
                            onChange={handleRegisterChange}
                            placeholder="example@mail.ru"
                        />

                        <label>Телефон</label>
                        <input
                            name="phone"
                            value={registerForm.phone}
                            onChange={handleRegisterChange}
                            placeholder="+7..."
                        />

                        <label>Лицевой счёт</label>
                        <input
                            name="accountNumber"
                            value={registerForm.accountNumber}
                            onChange={handleRegisterChange}
                            placeholder="Можно оставить пустым"
                        />

                        <label>Пароль</label>
                        <input
                            name="password"
                            type="password"
                            value={registerForm.password}
                            onChange={handleRegisterChange}
                            placeholder="Минимум 4 символа"
                            required
                        />

                        <label>Повторите пароль</label>
                        <input
                            name="repeatPassword"
                            type="password"
                            value={registerForm.repeatPassword}
                            onChange={handleRegisterChange}
                            placeholder="Повторите пароль"
                            required
                        />

                        <div className="security-note">
                            Самостоятельная регистрация создаёт роль жильца. Права администратора выдаются только администратором.
                        </div>

                        <button type="submit">Зарегистрироваться</button>
                    </>
                )}
            </form>
        </div>
    );
}

export default LoginPage;
