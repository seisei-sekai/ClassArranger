import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./XdfClassArranger/Auth/AuthContext.jsx";
import ProtectedRoute from "./XdfClassArranger/Auth/ProtectedRoute.jsx";
import AdminRoute from "./XdfClassArranger/Auth/AdminRoute.jsx";
import Login from "./XdfClassArranger/Auth/Login.jsx";
import RegisterOtherAccount from "./XdfClassArranger/Auth/RegisterOtherAccount.jsx";
import UserManagement from "./XdfClassArranger/Admin/UserManagement.jsx";
import XdfLayout from "./XdfClassArranger/XdfLayout.jsx";
import XdfDashboard from "./XdfClassArranger/Dashboard/Dashboard.jsx";
import XdfFunction from "./XdfClassArranger/Function/Function.jsx";
import XdfFinalSchedule from "./XdfClassArranger/FinalSchedule/FinalSchedule.jsx";
import XdfMyPage from "./XdfClassArranger/MyPage/MyPage.jsx";
import Experiment from "./XdfClassArranger/Experiment/Experiment.jsx";
import Experiment2 from "./XdfClassArranger/Experiment2/Experiment2.jsx";
import Experiment3 from "./XdfClassArranger/Experiment3/Experiment3.jsx";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Toaster position="top-right" />
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <XdfLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<XdfDashboard />} />
              <Route path="function" element={<XdfFunction />} />
              <Route path="finalschedule" element={<XdfFinalSchedule />} />
              <Route path="experiment" element={<Experiment />} />
              <Route path="experiment2" element={<Experiment2 />} />
              <Route path="experiment3" element={<Experiment3 />} />
              <Route path="mypage" element={<XdfMyPage />} />
              
              {/* Admin-only routes */}
              <Route
                path="register_other_account"
                element={
                  <AdminRoute>
                    <RegisterOtherAccount />
                  </AdminRoute>
                }
              />
              <Route
                path="user_management"
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
