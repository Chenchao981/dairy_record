import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import EmotionRecord from "@/pages/EmotionRecord";
import EmotionHistory from "@/pages/EmotionHistory";
import EmotionAnalysis from "@/pages/EmotionAnalysis";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { UserGuard, AdminGuard } from "@/components/RouteGuard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 用户端路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/record" element={
          <UserGuard>
            <EmotionRecord />
          </UserGuard>
        } />
        <Route path="/history" element={
          <UserGuard>
            <EmotionHistory />
          </UserGuard>
        } />
        <Route path="/analysis" element={
          <UserGuard>
            <EmotionAnalysis />
          </UserGuard>
        } />
        
        {/* 管理员登录页面 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* 受保护的管理员路由 */}
        <Route path="/admin" element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}
