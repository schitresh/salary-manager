import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import { getDepartments } from '../api/departments';

const FILTER_FIELDS = [
  { name: 'name', label: 'Name' },
  { name: 'location_id', label: 'Location ID' },
];

const EMPTY_FILTERS = { name: '', location_id: '' };

function formatLocation(location) {
  if (!location) return '-';
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const loadDepartments = async (nextPage = page, activeFilters = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const result = await getDepartments({ page: nextPage, filters: activeFilters });
      setDepartments(result?.departments || []);
      setMeta(result?.meta || null);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments(page, appliedFilters);
  }, [page, appliedFilters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setAppliedFilters(EMPTY_FILTERS);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Departments</Typography>
        <Button variant="contained" onClick={() => navigate('/departments/new')}>
          Add Department
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <FilterBar
          fields={FILTER_FIELDS}
          values={filters}
          onChange={handleFilterChange}
          onApply={handleApply}
          onClear={handleClear}
        />
        <DataTable
          columns={[
            { field: 'name', header: 'Name' },
            {
              field: 'location',
              header: 'Location',
              render: (_, row) => formatLocation(row.location),
            },
            { field: 'head_employee_id', header: 'Head Employee ID', render: (v) => v ?? '-' },
            {
              field: 'actions',
              header: 'Actions',
              render: (_, row) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => navigate(`/departments/${row.id}`)}>View</Button>
                  <Button size="small" onClick={() => navigate(`/departments/${row.id}/edit`)}>Edit</Button>
                </Stack>
              ),
            },
          ]}
          rows={departments}
          loading={loading}
          error={error}
          emptyMessage="No departments found."
          meta={meta}
          onPageChange={setPage}
        />
      </Paper>
    </Box>
  );
}

export default DepartmentsPage;
