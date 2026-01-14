import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
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
import Chatbot from "./pages/Chatbot"; // <-- Ajouter le chatbot
import NotFound from "./pages/NotFound"; // <-- Ajouter une page 404

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserList from "./pages/admin/UserList";


/* Layout avec Navbar + Footer (sans Chatbot ici) */
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

function App() {
  const [showChatbot] = useState(true); // État pour contrôler le chatbot

  return (
    <BrowserRouter>
      {/* Le Chatbot est en dehors des Routes, donc présent sur toutes les pages */}
      {showChatbot && <Chatbot />}
      
      <Routes>
        {/* Pages d'authentification */}
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

        {/* Toutes les autres pages avec MainLayout */}
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

        {/* ... toutes vos autres routes ... */}

        <Route
          path="/profile/:userId"
          element={
            <MainLayout>
              <VisitProfile />
            </MainLayout>
          }
        />

        {/* Page 404 */}
        <Route
          path="*"
          element={
            <MainLayout>
              <NotFound />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;