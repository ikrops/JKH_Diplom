import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ResidentCabinetPage from "./pages/ResidentCabinetPage";

function App() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    const getHomePage = () => {
        if (!token) {
            return "/login";
        }

        if (user?.role === "resident") {
            return "/resident-cabinet";
        }

        return "/dashboard";
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/dashboard"
                    element={token ? <DashboardPage /> : <Navigate to="/login" />}
                />

                <Route
                    path="/resident-cabinet"
                    element={
                        token ? <ResidentCabinetPage /> : <Navigate to="/login" />
                    }
                />

                <Route path="*" element={<Navigate to={getHomePage()} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;