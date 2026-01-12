import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import ForgotPassword from "./auth/ForgotPassword";
import VerifyEmail from "./auth/VerifyEmail";

import Accueil from "./pages/Accueil";
import Profile from "./pages/Profile";
import SettingsProfile from "./pages/SettingsProfile";
import Dossier from "./pages/Dossier";
import Doctors from "./pages/Doctors";
import AppointmentBooking from "./pages/AppointmentBooking";
import DoctorAppointments from "./pages/DoctorAppointments";
import AppointmentPage from "./pages/AppointmentPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MyAppointments from "./pages/MyAppointments";
import VisitProfile from "./pages/VisitProfile"; // <-- Ajouter cette ligne

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserList from "./pages/admin/UserList";

/* Layout avec Navbar + Footer */
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Admin */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserList />} />
        </Route>

        {/* Pages publiques */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Accueil />
            </MainLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <MainLayout>
              <Profile />
            </MainLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <MainLayout>
              <SettingsProfile />
            </MainLayout>
          }
        />

        <Route
          path="/dossier"
          element={
            <MainLayout>
              <Dossier />
            </MainLayout>
          }
        />

        {/* Médecins */}
        <Route
          path="/doctors"
          element={
            <MainLayout>
              <Doctors />
            </MainLayout>
          }
        />

        {/* Rendez-vous - Utilisez AppointmentPage qui récupère les données */}
        <Route
          path="/appointment/:doctorId"
          element={
            <MainLayout>
              <AppointmentPage />
            </MainLayout>
          }
        />

        {/* Gardez l'ancienne route pour compatibilité */}
        <Route
          path="/appointment-booking"
          element={
            <MainLayout>
              <AppointmentBooking />
            </MainLayout>
          }
        />

        {/* Rendez-vous du docteur */}
        <Route
          path="/doctor/appointments"
          element={
            <MainLayout>
              <DoctorAppointments />
            </MainLayout>
          }
        />

        <Route
          path="/my-appointments"
          element={
            <MainLayout>
              <MyAppointments />
            </MainLayout>
          }
        />

        {/* Page de visite de profil */}
        <Route
          path="/profile/:userId"
          element={
            <MainLayout>
              <VisitProfile />
            </MainLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;