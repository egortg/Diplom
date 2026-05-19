import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import CreditCardPage from "./Pages/CreditCardPage";
import CreditPage from "./Pages/CreditPage";
import DebitCardPage from "./Pages/DebitCardPage";
import HomePage from "./Pages/HomePage";

import AdminDashboard from "./Pages/Admin/AdminDashboard";
import AdminLogin from "./Pages/Admin/AdminLogin";
import UsersManager from "./Pages/Admin/UsersManager";
import HomePageManager from "./Pages/Admin/HomePageManager";
import DebitCardPageManager from "./Pages/Admin/DebitCardPageManager";
import CreditCardPageManager from "./Pages/Admin/CreditCardPageManager";
import CreditPageManager from "./Pages/Admin/CreditPageManager";
import Couldbeint from "./components/Couldbeint/Couldbeint";


function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        
        <Route path="/" element={<HomePage />} />
        <Route path="/debit-card" element={<DebitCardPage />} />
        <Route path="/credit-card" element={<CreditCardPage />} />
        <Route path="/credit" element={<CreditPage />} />
        
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/homepage" element={<HomePageManager />} />
        <Route path="/admin/debit-card-page" element={<DebitCardPageManager />} />
        <Route path="/admin/credit-card-page" element={<CreditCardPageManager />} />
        <Route path="/admin/credit-page" element={<CreditPageManager />} />
        <Route path="/admin/users" element={<UsersManager />} />

      </Routes>
      <Couldbeint/>
    </BrowserRouter>
  );
}

export default App;