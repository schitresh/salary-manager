import { useEffect, useState } from 'react';
import { Box, Button, Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getSalary } from '../../api/salaries';
import DetailFields from '../../components/DetailFields';
import PageHeader from '../../components/PageHeader';
import ResourceState from '../../components/ResourceState';

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

  return (
    <Box>
      <PageHeader
        title="Salary Details"
        actionsBelow
        actions={[
          <Button key="back" variant="outlined" size="small" onClick={() => navigate('/salaries')}>Back</Button>,
          <Button key="edit" variant="contained" size="small" onClick={() => navigate(`/salaries/${id}/edit`)}>Edit</Button>,
        ]}
      />

      <ResourceState loading={loading} error={error} isEmpty={!loading && !error && !salary} emptyMessage="Salary record not found.">
        {salary && (
          <Paper sx={{ p: 3, maxWidth: 800 }}>
            <DetailFields
              fields={[
                { label: 'Employee', value: formatEmployee(salary.employee) },
                { label: 'Department', value: salary.department?.name || '-' },
                { label: 'Job Title', value: salary.job_title },
                { label: 'Currency', value: salary.currency },
                { label: 'Frequency', value: salary.frequency },
                { label: 'Base Amount', value: salary.base_amount, sx: { mt: 2 } },
                { label: 'HRA Amount', value: salary.hra_amount },
                { label: 'Bonus Amount', value: salary.bonus_amount },
                { label: 'Deduction Amount', value: salary.deduction_amount },
                { label: 'Total Amount', value: salary.total_amount },
                { label: 'Applicable From', value: salary.applicable_from, sx: { mt: 2 } },
                { label: 'Applicable Till', value: salary.applicable_till || 'Current (open-ended)' },
              ]}
            />
          </Paper>
        )}
      </ResourceState>
    </Box>
  );
}

export default SalaryDetailPage;
