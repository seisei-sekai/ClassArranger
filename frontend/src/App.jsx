import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import XdfLayout from "./XdfClassArranger/XdfLayout.jsx";
import XdfDashboard from "./XdfClassArranger/Dashboard/Dashboard.jsx";
import XdfFunction from "./XdfClassArranger/Function/Function.jsx";
import XdfMyPage from "./XdfClassArranger/MyPage/MyPage.jsx";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        <Routes>
          {/* XdfClassArranger Routes */}
          <Route path="/" element={<XdfLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<XdfDashboard />} />
            <Route path="function" element={<XdfFunction />} />
            <Route path="mypage" element={<XdfMyPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
