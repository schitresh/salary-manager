import { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getDepartment } from '../../api/departments';
import DetailFields from '../../components/DetailFields';
import PageHeader from '../../components/PageHeader';
import ResourceState from '../../components/ResourceState';

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

  return (
    <Box>
      <PageHeader
        title="Department Details"
        actionsBelow
        actions={[
          <Button key="back" variant="outlined" size="small" onClick={() => navigate('/departments')}>Back</Button>,
          <Button key="edit" variant="contained" size="small" onClick={() => navigate(`/departments/${id}/edit`)}>Edit</Button>,
        ]}
      />

      <ResourceState loading={loading} error={error} isEmpty={!loading && !error && !department} emptyMessage="Department not found.">
        {department && (
          <Paper sx={{ p: 3, maxWidth: 700 }}>
            <DetailFields
              fields={[
                { label: 'Name', value: department.name },
                { label: 'Location', value: formatLocation(department.location) },
                { label: 'Location ID', value: department.location_id },
                {
                  label: 'Head Employee',
                  value: department.head_employee
                    ? `${department.head_employee.employee_code} - ${department.head_employee.first_name} ${department.head_employee.last_name}`
                    : '-',
                },
              ]}
            />
            <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
              Created: {department.created_at ? new Date(department.created_at).toLocaleString() : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated: {department.updated_at ? new Date(department.updated_at).toLocaleString() : '-'}
            </Typography>
          </Paper>
        )}
      </ResourceState>
    </Box>
  );
}

export default DepartmentDetailPage;
