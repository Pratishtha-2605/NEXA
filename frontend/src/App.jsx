import Experiment from "./pages/Experiment.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EditExperiment from "./pages/EditExperiment.jsx";

import './App.css'

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateExperiment from "./pages/CreateExperiment.jsx";
import Results from "./pages/Results.jsx";

import DashboardLayout from "./layouts/DashboardLayout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard Page */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        {/* Create Experiment Page */}
        <Route
          path="/create-experiment"
          element={
            <DashboardLayout>
              <CreateExperiment />
            </DashboardLayout>
          }
        />
        <Route
  path="/experiment/:id"
  element={
    <DashboardLayout>
      <Experiment />
    </DashboardLayout>
  }
/>
<Route
  path="/edit-experiment/:id"
  element={
    <DashboardLayout>
      <EditExperiment />
    </DashboardLayout>
  }
/>
        {/* Results Page */}
        <Route
          path="/results"
          element={
            <DashboardLayout>
              <Results />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;