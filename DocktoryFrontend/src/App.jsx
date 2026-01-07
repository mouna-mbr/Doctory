import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import Accueil from "./pages/Accueil";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserList from "./pages/admin/UserList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* pages sans navbar */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signup" element={<SignUp />} />
        {/* pages admin */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserList />} />
        </Route>

        {/* pages avec navbar */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
