import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import DepartmentDetailPage from './pages/DepartmentDetailPage';
import DepartmentFormPage from './pages/DepartmentFormPage';
import DepartmentsPage from './pages/DepartmentsPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import EmployeesPage from './pages/EmployeesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LocationDetailPage from './pages/LocationDetailPage';
import LocationFormPage from './pages/LocationFormPage';
import LocationsPage from './pages/LocationsPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/password/forgot" element={<ForgotPasswordPage />} />
          <Route path="/password/reset" element={<ResetPasswordPage />} />
          <Route path="/invitation/accept" element={<AcceptInvitationPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/locations/new" element={<LocationFormPage />} />
              <Route path="/locations/:id" element={<LocationDetailPage />} />
              <Route path="/locations/:id/edit" element={<LocationFormPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/departments/new" element={<DepartmentFormPage />} />
              <Route path="/departments/:id" element={<DepartmentDetailPage />} />
              <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/new" element={<EmployeeFormPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
