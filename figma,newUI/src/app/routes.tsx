import { createBrowserRouter } from "react-router";
import App from "./App";
import AuthLayout from "./layouts/auth-layout";
import DashboardLayout from "./layouts/dashboard-layout";

// Auth Pages
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/dashboard";
import DoctorProfile from "./pages/doctor/profile";
import DoctorApprovals from "./pages/doctor/approvals";
import DoctorReport from "./pages/doctor/report";
import DoctorSlots from "./pages/doctor/slots";
import DoctorAppointments from "./pages/doctor/appointments";

// Patient Pages
import PatientDashboard from "./pages/patient/dashboard";
import PatientProfile from "./pages/patient/profile";
import PatientBooking from "./pages/patient/booking";
import PatientAppointments from "./pages/patient/appointments";

// Supervisor Pages
import SupervisorDashboard from "./pages/supervisor/dashboard";
import SupervisorProfile from "./pages/supervisor/profile";

// Admin Pages
import AdminDashboard from "./pages/admin/dashboard";
import AdminDoctorRequests from "./pages/admin/doctor-requests";
import AdminSupervisorRequests from "./pages/admin/supervisor-requests";
import AdminUsers from "./pages/admin/users";

// Shared Pages
import Chat from "./pages/shared/chat";
import Notifications from "./pages/shared/notifications";
import Settings from "./pages/shared/settings";
import Leaderboard from "./pages/shared/leaderboard";
import Game from "./pages/shared/game";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
  {
    path: "/doctor",
    element: <DashboardLayout role="doctor" />,
    children: [
      { index: true, element: <DoctorDashboard /> },
      { path: "profile", element: <DoctorProfile /> },
      { path: "approvals", element: <DoctorApprovals /> },
      { path: "report", element: <DoctorReport /> },
      { path: "slots", element: <DoctorSlots /> },
      { path: "appointments", element: <DoctorAppointments /> },
      { path: "chat", element: <Chat /> },
      { path: "notifications", element: <Notifications /> },
      { path: "settings", element: <Settings /> },
      { path: "leaderboard", element: <Leaderboard /> },
      { path: "game", element: <Game /> },
    ],
  },
  {
    path: "/patient",
    element: <DashboardLayout role="patient" />,
    children: [
      { index: true, element: <PatientDashboard /> },
      { path: "profile", element: <PatientProfile /> },
      { path: "booking", element: <PatientBooking /> },
      { path: "appointments", element: <PatientAppointments /> },
      { path: "chat", element: <Chat /> },
      { path: "notifications", element: <Notifications /> },
      { path: "settings", element: <Settings /> },
      { path: "leaderboard", element: <Leaderboard /> },
      { path: "game", element: <Game /> },
    ],
  },
  {
    path: "/supervisor",
    element: <DashboardLayout role="supervisor" />,
    children: [
      { index: true, element: <SupervisorDashboard /> },
      { path: "profile", element: <SupervisorProfile /> },
      { path: "chat", element: <Chat /> },
      { path: "notifications", element: <Notifications /> },
      { path: "settings", element: <Settings /> },
      { path: "leaderboard", element: <Leaderboard /> },
      { path: "game", element: <Game /> },
    ],
  },
  {
    path: "/admin",
    element: <DashboardLayout role="admin" />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "doctor-requests", element: <AdminDoctorRequests /> },
      { path: "supervisor-requests", element: <AdminSupervisorRequests /> },
      { path: "users", element: <AdminUsers /> },
      { path: "notifications", element: <Notifications /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
