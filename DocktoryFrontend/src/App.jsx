import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import ForgotPassword from "./auth/ForgotPassword";
import VerifyEmail from "./auth/VerifyEmail";
import Contact from "./pages/Contact";

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
import VisitProfile from "./pages/VisitProfile"; 
import Chatbot from "./pages/Chatbot";  
import NotFound from "./pages/NotFound"; 
import Services from "./pages/Services";
import TwoFactor from "./pages/TwoFactor";
import SecuritySettings from "./pages/SecuritySettings";
import Notifications from "./pages/Notifications";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserList from "./pages/admin/UserList";
import VideoRoom from "./pages/VideoRoom";


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

        <Route path="/2fa" element={<TwoFactor />} />

        <Route
          path="/profile"
          element={
            <MainLayout>
              <Profile />
            </MainLayout>
          }
        />

        <Route
          path="/profile/:userId"
          element={
            <MainLayout>
              <VisitProfile />
            </MainLayout>
          }
        />

        <Route
          path="/doctors"
          element={
            <MainLayout>
              <Doctors />
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

        <Route
          path="/appointment/:doctorId"
          element={
            <MainLayout>
              <AppointmentBooking />
            </MainLayout>
          }
        />

        <Route
          path="/doctor-appointments"
          element={
            <MainLayout>
              <DoctorAppointments />
            </MainLayout>
          }
        />

        <Route
          path="/appointments"
          element={
            <MainLayout>
              <AppointmentPage />
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

        <Route
          path="/settings"
          element={
            <MainLayout>
              <SettingsProfile />
            </MainLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <Contact />
              <Footer />
            </>
          }
        />
        <Route
          path="/services"
          element={
            <>
              <Navbar />
              <Services />
              <Footer />
            </>
          }
        />
        <Route
          path="/security"
          element={
            <>
              <Navbar />
              <SecuritySettings />
              <Footer />
            </>
          }
        />

          <Route
           path="/video/:roomId" 
           element={
            <>
                        <Navbar />
                        <VideoRoom />
                        <Footer />      
                      </>} />
        <Route
          path="/notifications"
          element={
            <MainLayout>
              <Notifications />
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