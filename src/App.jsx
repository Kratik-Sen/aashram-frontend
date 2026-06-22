import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/DashboardLive";
import Departments from "./pages/Departments";
import Donations from "./pages/Donations";
import IssuedByAdmin from "./pages/IssuedByAdmin";
import Items from "./pages/Items";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
import Requests from "./pages/Requests";
import StockIssues from "./pages/StockIssues";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import { staffRoles } from "./utils/constants";

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="issues" element={<StockIssues />} />
        <Route element={<RoleRoute roles={staffRoles} />}>
          <Route path="issue-by-admin" element={<IssuedByAdmin />} />
        </Route>
        <Route path="donations" element={<Donations />} />
        <Route path="requests" element={<Requests />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="departments" element={<Departments />} />
        <Route path="reports" element={<Reports />} />
        <Route element={<RoleRoute roles={["Super Admin"]} />}>
          <Route path="users" element={<Users />} />
        </Route>
      </Route>
    </Route>
    <Route path="/404" element={<NotFound />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default App;
