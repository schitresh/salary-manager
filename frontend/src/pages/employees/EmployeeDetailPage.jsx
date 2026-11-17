import { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployee } from '../../api/employees';
import DetailFields from '../../components/DetailFields';
import PageHeader from '../../components/PageHeader';
import ResourceState from '../../components/ResourceState';

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

  return (
    <Box>
      <PageHeader
        title="Employee Details"
        actionsBelow
        actions={[
          <Button key="back" variant="outlined" size="small" onClick={() => navigate('/employees')}>Back</Button>,
          <Button key="history" variant="outlined" size="small" onClick={() => navigate(`/salaries?employee_id=${id}`)}>Salary History</Button>,
          <Button key="add-salary" variant="outlined" size="small" onClick={() => navigate(`/salaries/new?employee_id=${id}`)}>Add Salary</Button>,
          <Button key="edit" variant="contained" size="small" onClick={() => navigate(`/employees/${id}/edit`)}>Edit</Button>,
        ]}
      />

      <ResourceState loading={loading} error={error} isEmpty={!loading && !error && !employee} emptyMessage="Employee not found.">
        {employee && (
          <Paper sx={{ p: 3, maxWidth: 800 }}>
            <DetailFields
              fields={[
                { label: 'Employee Code', value: employee.employee_code },
                { label: 'Name', value: `${employee.first_name} ${employee.last_name}` },
                { label: 'Email', value: employee.email },
                { label: 'Phone', value: employee.phone },
                { label: 'Job Title', value: employee.job_title },
                { label: 'Date of Birth', value: employee.date_of_birth || '-' },
                { label: 'Date of Joining', value: employee.date_of_joining || '-' },
                { label: 'Last Working Day', value: employee.last_working_day || '-' },
                { label: 'Department', value: employee.department?.name || '-', sx: { mt: 2 } },
                { label: 'Location', value: formatLocation(employee.department?.location) },
              ]}
            />
            <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
              Created: {employee.created_at ? new Date(employee.created_at).toLocaleString() : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated: {employee.updated_at ? new Date(employee.updated_at).toLocaleString() : '-'}
            </Typography>
          </Paper>
        )}
      </ResourceState>
    </Box>
  );
}

export default EmployeeDetailPage;
