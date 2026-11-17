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
import { createDepartment, getDepartment, updateDepartment } from '../api/departments';
import { getLocations } from '../api/locations';

const initialValues = { name: '', location_id: '', head_employee_id: '' };

function formatLocationOption(location) {
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

function DepartmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
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
            head_employee_id: dept.head_employee_id ?? '',
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
        name: values.name,
        location_id: values.location_id === '' ? null : Number(values.location_id),
        head_employee_id: values.head_employee_id === '' ? null : Number(values.head_employee_id),
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
          <TextField
            label="Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal" required>
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
          <TextField
            label="Head Employee ID (optional)"
            name="head_employee_id"
            type="number"
            value={values.head_employee_id}
            onChange={handleChange}
            fullWidth
            margin="normal"
            helperText="Leave blank for now; employee selection will be available after the Employee module."
          />
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outlined" onClick={() => navigate(isEdit ? `/departments/${id}` : '/departments')}>
              Cancel
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default DepartmentFormPage;
