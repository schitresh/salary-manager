import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';
import { getDepartments } from '../../api/departments';
import { getEmployees } from '../../api/employees';
import { getLocations } from '../../api/locations';

const EMPTY_FILTERS = {
  employee_code: '',
  job_title: '',
  email: '',
  department_id: '',
  location_id: '',
};

function formatLocation(location) {
  if (!location) return '-';
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    Promise.all([
      getDepartments({ page: 1, size: 100 }).catch(() => ({ departments: [] })),
      getLocations({ page: 1, size: 100 }).catch(() => ({ locations: [] })),
    ]).then(([deptResult, locResult]) => {
      if (!active) return;
      setDepartments(deptResult?.departments || []);
      setLocations(locResult?.locations || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const loadEmployees = async (nextPage = page, activeFilters = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const result = await getEmployees({ page: nextPage, filters: activeFilters });
      setEmployees(result?.employees || []);
      setMeta(result?.meta || null);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees(page, appliedFilters);
  }, [page, appliedFilters]);

  const filterFields = useMemo(() => ([
    { name: 'employee_code', label: 'Employee Code' },
    { name: 'job_title', label: 'Job Title' },
    { name: 'email', label: 'Email' },
    {
      name: 'department_id',
      label: 'Department',
      allLabel: 'All departments',
      options: departments.map((dept) => ({ value: String(dept.id), label: dept.name })),
    },
    {
      name: 'location_id',
      label: 'Location',
      allLabel: 'All locations',
      options: locations.map((loc) => ({ value: String(loc.id), label: formatLocation(loc) })),
    },
  ]), [departments, locations]);

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
      <PageHeader
        title="Employees"
        actions={<Button variant="contained" onClick={() => navigate('/employees/new')}>Add Employee</Button>}
      />

      <Paper sx={{ p: 2 }}>
        <FilterBar
          fields={filterFields}
          values={filters}
          onChange={handleFilterChange}
          onApply={handleApply}
          onClear={handleClear}
        />
        <DataTable
          columns={[
            { field: 'employee_code', header: 'Code' },
            { field: 'name', header: 'Name', render: (_, row) => `${row.first_name} ${row.last_name}` },
            { field: 'email', header: 'Email' },
            { field: 'job_title', header: 'Job Title' },
            { field: 'department', header: 'Department', render: (_, row) => row.department?.name || '-' },
            { field: 'location', header: 'Location', render: (_, row) => formatLocation(row.department?.location) },
            {
              field: 'actions',
              header: 'Actions',
              render: (_, row) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => navigate(`/employees/${row.id}`)}>View</Button>
                  <Button size="small" onClick={() => navigate(`/employees/${row.id}/edit`)}>Edit</Button>
                </Stack>
              ),
            },
          ]}
          rows={employees}
          loading={loading}
          error={error}
          emptyMessage="No employees found."
          meta={meta}
          onPageChange={setPage}
        />
      </Paper>
    </Box>
  );
}

export default EmployeesPage;
