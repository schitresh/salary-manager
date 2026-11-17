import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AcceptInvitationPage from './pages/auth/AcceptInvitationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginPage from './pages/auth/LoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DepartmentDetailPage from './pages/departments/DepartmentDetailPage';
import DepartmentFormPage from './pages/departments/DepartmentFormPage';
import DepartmentsPage from './pages/departments/DepartmentsPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import EmployeeFormPage from './pages/employees/EmployeeFormPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import HomePage from './pages/home/HomePage';
import LocationDetailPage from './pages/locations/LocationDetailPage';
import LocationFormPage from './pages/locations/LocationFormPage';
import LocationsPage from './pages/locations/LocationsPage';
import SalaryDetailPage from './pages/salaries/SalaryDetailPage';
import SalaryFormPage from './pages/salaries/SalaryFormPage';
import SalariesPage from './pages/salaries/SalariesPage';
import UsersPage from './pages/users/UsersPage';

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
              <Route path="/salaries" element={<SalariesPage />} />
              <Route path="/salaries/new" element={<SalaryFormPage />} />
              <Route path="/salaries/:id" element={<SalaryDetailPage />} />
              <Route path="/salaries/:id/edit" element={<SalaryFormPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
