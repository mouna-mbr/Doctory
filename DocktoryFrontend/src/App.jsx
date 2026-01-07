import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import Accueil from "./pages/Accueil";
import Profile from "./pages/Profile";
import SettingsProfile from "./pages/SettingsProfile"; 
import Dossier from "./pages/Dossier"; 
import Doctors from "./pages/Doctors";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserList from "./pages/admin/UserList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages sans Navbar */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signup" element={<SignUp />} />
        {/* pages admin */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserList />} />
        </Route>

        {/* Pages avec Navbar et Footer */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Accueil />
              <Footer />
            </>
          }
        />

        <Route
          path="/profile"
          element={
            <>
              <Navbar />
              <Profile />
              <Footer />
            </>
          }
        />

        <Route
          path="/settings"
          element={
            <>
              <Navbar />
              <SettingsProfile />
              <Footer />
            </>
          }
        />
        <Route
          path="/dossier"
          element={
            <>
              <Navbar />
              <Dossier />
              <Footer />
            </>
          }
        />
        <Route
            path="/doctors"
            element={
              <>
                <Navbar />
                <Doctors />
                <Footer />
              </>
            }
          />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
