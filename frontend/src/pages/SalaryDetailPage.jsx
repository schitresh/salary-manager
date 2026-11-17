import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getSalary } from '../api/salaries';

function formatEmployee(emp) {
  if (!emp) return '-';
  return `${emp.employee_code} - ${emp.first_name} ${emp.last_name}`;
}

function SalaryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSalary(id)
      .then((result) => {
        if (!active) return;
        setSalary(result?.salary || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.data?.error || err.message || 'Failed to load salary');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!salary) return <Alert severity="warning">Salary record not found.</Alert>;

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4">Salary Details</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" size="small" onClick={() => navigate('/salaries')}>Back</Button>
          <Button variant="contained" size="small" onClick={() => navigate(`/salaries/${id}/edit`)}>Edit</Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <Typography><strong>Employee:</strong> {formatEmployee(salary.employee)}</Typography>
        <Typography><strong>Department:</strong> {salary.department?.name || '-'}</Typography>
        <Typography><strong>Job Title:</strong> {salary.job_title}</Typography>
        <Typography><strong>Currency:</strong> {salary.currency}</Typography>
        <Typography><strong>Frequency:</strong> {salary.frequency}</Typography>
        <Typography sx={{ mt: 2 }}><strong>Base Amount:</strong> {salary.base_amount}</Typography>
        <Typography><strong>HRA Amount:</strong> {salary.hra_amount}</Typography>
        <Typography><strong>Bonus Amount:</strong> {salary.bonus_amount}</Typography>
        <Typography><strong>Deduction Amount:</strong> {salary.deduction_amount}</Typography>
        <Typography><strong>Total Amount:</strong> {salary.total_amount}</Typography>
        <Typography sx={{ mt: 2 }}><strong>Applicable From:</strong> {salary.applicable_from}</Typography>
        <Typography><strong>Applicable Till:</strong> {salary.applicable_till || 'Current (open-ended)'}</Typography>
      </Paper>
    </Box>
  );
}

export default SalaryDetailPage;
