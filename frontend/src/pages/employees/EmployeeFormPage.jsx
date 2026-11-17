import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getDepartments } from '../../api/departments';
import { createEmployee, getEmployee, updateEmployee } from '../../api/employees';

const initialValues = {
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  date_of_joining: '',
  last_working_day: '',
  job_title: '',
  department_id: '',
};

function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [deptResult, employeeResult] = await Promise.all([
          getDepartments({ page: 1, size: 100 }),
          isEdit ? getEmployee(id) : Promise.resolve(null),
        ]);
        if (!active) return;
        setDepartments(deptResult?.departments || []);

        if (isEdit && employeeResult?.employee) {
          const emp = employeeResult.employee;
          setValues({
            employee_code: emp.employee_code || '',
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            date_of_birth: emp.date_of_birth || '',
            date_of_joining: emp.date_of_joining || '',
            last_working_day: emp.last_working_day ?? '',
            job_title: emp.job_title || '',
            department_id: emp.department_id ?? '',
          });
        }
      } catch (err) {
        if (!active) return;
        setError(err.data?.error || err.message || 'Failed to load form data');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...values,
        department_id: values.department_id === '' ? null : Number(values.department_id),
        last_working_day: values.last_working_day || null,
      };

      if (isEdit) {
        await updateEmployee(id, payload);
        navigate(`/employees/${id}`);
      } else {
        const result = await createEmployee(payload);
        const newId = result?.employee?.id;
        navigate(newId ? `/employees/${newId}` : '/employees');
      }
    } catch (err) {
      const details = err.data?.errors;
      setError(Array.isArray(details) ? details.join(', ') : (err.data?.error || err.message || 'Failed to save employee'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Employee' : 'New Employee'}
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 900 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Employee Code" name="employee_code" value={values.employee_code} onChange={handleChange} fullWidth required />
              <TextField label="Job Title" name="job_title" value={values.job_title} onChange={handleChange} fullWidth required />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="First Name" name="first_name" value={values.first_name} onChange={handleChange} fullWidth required />
              <TextField label="Last Name" name="last_name" value={values.last_name} onChange={handleChange} fullWidth required />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Email" name="email" type="email" value={values.email} onChange={handleChange} fullWidth required />
              <TextField label="Phone" name="phone" value={values.phone} onChange={handleChange} fullWidth required />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={values.date_of_birth}
                onChange={handleChange}
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Date of Joining"
                name="date_of_joining"
                type="date"
                value={values.date_of_joining}
                onChange={handleChange}
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Last Working Day"
                name="last_working_day"
                type="date"
                value={values.last_working_day}
                onChange={handleChange}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Leave blank if currently working"
              />
            </Stack>
            <FormControl fullWidth required>
              <InputLabel id="employee-department-label">Department</InputLabel>
              <Select
                labelId="employee-department-label"
                label="Department"
                name="department_id"
                value={values.department_id}
                onChange={handleChange}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}{dept.location ? ` (${[dept.location.city, dept.location.state_code, dept.location.country_code].filter(Boolean).join(', ')})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outlined" onClick={() => navigate(isEdit ? `/employees/${id}` : '/employees')}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default EmployeeFormPage;
