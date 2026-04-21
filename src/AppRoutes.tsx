import ResetPasswordPage from "@/pages/ResetPasswordPage";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
  </Routes>
);

export default AppRoutes;