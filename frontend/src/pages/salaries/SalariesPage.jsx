import { useCallback, useEffect, useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AsyncAutocomplete from '../../components/AsyncAutocomplete';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { getDepartments } from '../../api/departments';
import { getEmployee, getEmployees } from '../../api/employees';
import { getSalaries } from '../../api/salaries';
import { formatDepartmentOption } from '../../utils/formatters';

const EMPTY_TEXT_FILTERS = { job_title: '', currency: '' };

function formatEmployee(emp) {
  if (!emp) return '';
  return `${emp.employee_code} - ${emp.first_name} ${emp.last_name}`.trim();
}

function SalariesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmployeeId = searchParams.get('employee_id') || '';

  const [salaries, setSalaries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [employeeFilter, setEmployeeFilter] = useState(null);
  const [departmentId, setDepartmentId] = useState('');
  const [textFilters, setTextFilters] = useState(EMPTY_TEXT_FILTERS);
  const [applied, setApplied] = useState({
    employee_id: initialEmployeeId,
    department_id: '',
    job_title: '',
    currency: '',
  });

  useEffect(() => {
    let active = true;
    getDepartments({ page: 1, size: 100 }).then((res) => {
      if (active) setDepartments(res?.departments || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadInitialEmployee() {
      if (!initialEmployeeId) return;
      try {
        const res = await getEmployee(initialEmployeeId);
        if (!active) return;
        setEmployeeFilter(res?.employee || null);
      } catch (_e) {
        // keep filter applied by id even if employee details fail to load
      } finally {
        if (active) {
          setApplied((prev) => ({ ...prev, employee_id: String(initialEmployeeId) }));
        }
      }
    }
    loadInitialEmployee();
    return () => { active = false; };
  }, [initialEmployeeId]);

  const loadSalaries = async (nextPage = page, activeFilters = applied) => {
    setLoading(true);
    setError('');
    try {
      const result = await getSalaries({ page: nextPage, filters: activeFilters });
      setSalaries(result?.salaries || []);
      setMeta(result?.meta || null);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load salaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaries(page, applied);
  }, [page, applied]);

  const fetchEmployeeOptions = useCallback(async (query) => {
    if (!query) {
      const res = await getEmployees({ page: 1, size: 20 });
      return res?.employees || [];
    }
    const searches = [{ first_name: query }, { last_name: query }, { employee_code: query }, { email: query }];
    const results = await Promise.all(searches.map((filters) => getEmployees({ page: 1, size: 10, filters }).catch(() => ({ employees: [] }))));
    const seen = new Set();
    const merged = [];
    results.forEach((res) => (res?.employees || []).forEach((emp) => {
      if (!seen.has(emp.id)) { seen.add(emp.id); merged.push(emp); }
    }));
    return merged;
  }, []);

  const handleApply = () => {
    setPage(1);
    setApplied({
      employee_id: employeeFilter?.id ? String(employeeFilter.id) : '',
      department_id: departmentId,
      job_title: textFilters.job_title,
      currency: textFilters.currency,
    });
  };

  const handleClear = () => {
    setEmployeeFilter(null);
    setDepartmentId('');
    setTextFilters(EMPTY_TEXT_FILTERS);
    setPage(1);
    setApplied({ employee_id: '', department_id: '', job_title: '', currency: '' });
  };

  return (
    <Box>
      <PageHeader
        title="Salaries"
        actions={<Button variant="contained" onClick={() => navigate('/salaries/new')}>Add Salary</Button>}
      />

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
            <Box sx={{ minWidth: 320, flex: 1 }}>
              <AsyncAutocomplete
                label="Employee"
                value={employeeFilter}
                onChange={setEmployeeFilter}
                fetchOptions={fetchEmployeeOptions}
                getOptionLabel={formatEmployee}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                placeholder="Search employee by name, code, or email"
                clearable
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="salary-filter-dept-label">Department</InputLabel>
              <Select
                labelId="salary-filter-dept-label"
                label="Department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <MenuItem value="">All departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>
                    {formatDepartmentOption(d)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Job Title" size="small" value={textFilters.job_title} onChange={(e) => setTextFilters((p) => ({ ...p, job_title: e.target.value }))} />
            <TextField label="Currency" size="small" value={textFilters.currency} onChange={(e) => setTextFilters((p) => ({ ...p, currency: e.target.value }))} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="small" onClick={handleApply}>Apply</Button>
            <Button variant="outlined" size="small" onClick={handleClear}>Clear</Button>
          </Stack>
        </Stack>

        <DataTable
          columns={[
            { field: 'employee', header: 'Employee', render: (_, row) => formatEmployee(row.employee) || '-' },
            { field: 'department', header: 'Department', render: (_, row) => row.department?.name || '-' },
            { field: 'job_title', header: 'Job Title' },
            { field: 'currency', header: 'Currency' },
            { field: 'total_amount', header: 'Total' },
            { field: 'applicable_from', header: 'From' },
            { field: 'applicable_till', header: 'Till', render: (v) => v || 'Current' },
            {
              field: 'actions',
              header: 'Actions',
              render: (_, row) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => navigate(`/salaries/${row.id}`)}>View</Button>
                  <Button size="small" onClick={() => navigate(`/salaries/${row.id}/edit`)}>Edit</Button>
                </Stack>
              ),
            },
          ]}
          rows={salaries}
          loading={loading}
          error={error}
          emptyMessage="No salary records found."
          meta={meta}
          onPageChange={setPage}
        />
      </Paper>
    </Box>
  );
}

export default SalariesPage;
