import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getDepartment } from '../api/departments';

function formatLocation(location) {
  if (!location) return '-';
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getDepartment(id)
      .then((result) => {
        if (!active) return;
        setDepartment(result?.department || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.data?.error || err.message || 'Failed to load department');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!department) return <Alert severity="warning">Department not found.</Alert>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Department Details</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/departments')}>Back</Button>
          <Button variant="contained" onClick={() => navigate(`/departments/${id}/edit`)}>Edit</Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, maxWidth: 700 }}>
        <Typography><strong>Name:</strong> {department.name}</Typography>
        <Typography><strong>Location:</strong> {formatLocation(department.location)}</Typography>
        <Typography><strong>Location ID:</strong> {department.location_id}</Typography>
        <Typography><strong>Head Employee ID:</strong> {department.head_employee_id ?? '-'}</Typography>
        <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
          Created: {department.created_at ? new Date(department.created_at).toLocaleString() : '-'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Updated: {department.updated_at ? new Date(department.updated_at).toLocaleString() : '-'}
        </Typography>
      </Paper>
    </Box>
  );
}

export default DepartmentDetailPage;
