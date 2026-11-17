import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployee } from '../api/employees';

function formatLocation(location) {
  if (!location) return '-';
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getEmployee(id)
      .then((result) => {
        if (!active) return;
        setEmployee(result?.employee || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.data?.error || err.message || 'Failed to load employee');
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
  if (!employee) return <Alert severity="warning">Employee not found.</Alert>;

  const dept = employee.department;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Employee Details</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/employees')}>Back</Button>
          <Button variant="contained" onClick={() => navigate(`/employees/${id}/edit`)}>Edit</Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <Typography><strong>Employee Code:</strong> {employee.employee_code}</Typography>
        <Typography><strong>Name:</strong> {employee.first_name} {employee.last_name}</Typography>
        <Typography><strong>Email:</strong> {employee.email}</Typography>
        <Typography><strong>Phone:</strong> {employee.phone}</Typography>
        <Typography><strong>Job Title:</strong> {employee.job_title}</Typography>
        <Typography><strong>Date of Birth:</strong> {employee.date_of_birth || '-'}</Typography>
        <Typography><strong>Date of Joining:</strong> {employee.date_of_joining || '-'}</Typography>
        <Typography><strong>Last Working Day:</strong> {employee.last_working_day || '-'}</Typography>
        <Typography sx={{ mt: 2 }}><strong>Department:</strong> {dept?.name || '-'}</Typography>
        <Typography><strong>Location:</strong> {formatLocation(dept?.location)}</Typography>
        <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
          Created: {employee.created_at ? new Date(employee.created_at).toLocaleString() : '-'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Updated: {employee.updated_at ? new Date(employee.updated_at).toLocaleString() : '-'}
        </Typography>
      </Paper>
    </Box>
  );
}

export default EmployeeDetailPage;
