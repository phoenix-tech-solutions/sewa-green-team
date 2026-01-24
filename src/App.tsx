import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Home from "~/pages/Home";
import About from "~/pages/About";
import Initiatives from "~/pages/Initiatives";
import GetInvolved from "~/pages/GetInvolved";
import Contact from "~/pages/Contact";
import Gallery from "~/pages/Gallery";
import Dashboard from "~/pages/Dashboard";
import NotApproved from "~/pages/NotApproved";
import AdminPanel from "~/pages/AdminPanel";
import NotAllowed from "~/pages/NotAllowed";
import { NavbarProvider } from "~/context/navbar/NavbarProvider";
import { AuthProvider } from "~/context/auth/AuthProvider";
import { Analytics } from "@vercel/analytics/next";

function App() {
  return (
    <Router>
      <AuthProvider>
        <NavbarProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/initiatives" element={<Initiatives />} />
                <Route path="/get-involved" element={<GetInvolved />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/not-approved" element={<NotApproved />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/not-allowed" element={<NotAllowed />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </NavbarProvider>
      </AuthProvider>
      <Analytics />
    </Router>
  );
}

export default App;
