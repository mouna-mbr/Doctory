import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import Accueil from "./pages/Accueil";
import Profile from "./pages/Profile";
import SettingsProfile from "./pages/SettingsProfile"; 
import Dossier from "./pages/Dossier"; 

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages sans Navbar */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
