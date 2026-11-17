import { useCallback, useEffect, useState } from 'react';
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
import AsyncAutocomplete from '../../components/AsyncAutocomplete';
import { createDepartment, getDepartment, updateDepartment } from '../../api/departments';
import { getEmployees } from '../../api/employees';
import { getLocations } from '../../api/locations';

const initialValues = { name: '', location_id: '' };

function formatLocationOption(location) {
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

function formatEmployeeOption(emp) {
  if (!emp) return '';
  return `${emp.employee_code} - ${emp.first_name} ${emp.last_name}`.trim();
}

function DepartmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [headEmployee, setHeadEmployee] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [locationsResult, departmentResult] = await Promise.all([
          getLocations({ page: 1, size: 100 }),
          isEdit ? getDepartment(id) : Promise.resolve(null),
        ]);
        if (!active) return;
        setLocations(locationsResult?.locations || []);

        if (isEdit && departmentResult?.department) {
          const dept = departmentResult.department;
          setValues({
            name: dept.name || '',
            location_id: dept.location_id ?? '',
          });
          setHeadEmployee(dept.head_employee || null);
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

  const fetchHeadEmployeeOptions = useCallback(async (query) => {
    if (!query) {
      const result = await getEmployees({ page: 1, size: 20 });
      return result?.employees || [];
    }

    const searches = [
      { first_name: query },
      { last_name: query },
      { employee_code: query },
      { email: query },
    ];

    const results = await Promise.all(
      searches.map((filters) => getEmployees({ page: 1, size: 10, filters }).catch(() => ({ employees: [] })))
    );

    const seen = new Set();
    const merged = [];
    results.forEach((res) => {
      (res?.employees || []).forEach((emp) => {
        if (!seen.has(emp.id)) {
          seen.add(emp.id);
          merged.push(emp);
        }
      });
    });
    return merged;
  }, []);

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
        name: values.name,
        location_id: values.location_id === '' ? null : Number(values.location_id),
        head_employee_id: headEmployee ? headEmployee.id : null,
      };

      if (isEdit) {
        await updateDepartment(id, payload);
        navigate(`/departments/${id}`);
      } else {
        const result = await createDepartment(payload);
        const newId = result?.department?.id;
        navigate(newId ? `/departments/${newId}` : '/departments');
      }
    } catch (err) {
      const details = err.data?.errors;
      setError(Array.isArray(details) ? details.join(', ') : (err.data?.error || err.message || 'Failed to save department'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Department' : 'New Department'}
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 700 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel id="department-location-label">Location</InputLabel>
              <Select
                labelId="department-location-label"
                label="Location"
                name="location_id"
                value={values.location_id}
                onChange={handleChange}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {formatLocationOption(loc)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <AsyncAutocomplete
              label="Head Employee (optional)"
              value={headEmployee}
              onChange={setHeadEmployee}
              fetchOptions={fetchHeadEmployeeOptions}
              getOptionLabel={formatEmployeeOption}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              placeholder="Search by name, code, or email"
              helperText="Type to search employees; leave empty to clear"
              clearable
            />
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outlined" onClick={() => navigate(isEdit ? `/departments/${id}` : '/departments')}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default DepartmentFormPage;
