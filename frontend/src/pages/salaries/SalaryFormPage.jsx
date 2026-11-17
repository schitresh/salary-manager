import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AsyncAutocomplete from '../../components/AsyncAutocomplete';
import { getDepartments } from '../../api/departments';
import { getEmployee, getEmployees } from '../../api/employees';
import { createSalary, getSalary, updateSalary } from '../../api/salaries';
import { formatDepartmentOption } from '../../utils/formatters';

const initialValues = {
  employee_id: '',
  department_id: '',
  job_title: '',
  currency: '',
  base_amount: '',
  hra_amount: '0',
  bonus_amount: '0',
  deduction_amount: '0',
  applicable_from: '',
  applicable_till: '',
  frequency: 'month',
};

function formatEmployeeOption(emp) {
  if (!emp) return '';
  return `${emp.employee_code} - ${emp.first_name} ${emp.last_name}`.trim();
}

function SalaryFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState(initialValues);
  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [deptResult, salaryResult] = await Promise.all([
          getDepartments({ page: 1, size: 100 }),
          isEdit ? getSalary(id) : Promise.resolve(null),
        ]);
        if (!active) return;
        setDepartments(deptResult?.departments || []);

        if (isEdit && salaryResult?.salary) {
          const s = salaryResult.salary;
          setValues({
            employee_id: s.employee_id ?? '',
            department_id: s.department_id ?? '',
            job_title: s.job_title || '',
            currency: s.currency || '',
            base_amount: s.base_amount ?? '',
            hra_amount: s.hra_amount ?? '0',
            bonus_amount: s.bonus_amount ?? '0',
            deduction_amount: s.deduction_amount ?? '0',
            applicable_from: s.applicable_from || '',
            applicable_till: s.applicable_till || '',
            frequency: s.frequency || 'month',
          });
          if (s.employee) {
            setEmployee(s.employee);
          } else if (s.employee_id) {
            try {
              const empRes = await getEmployee(s.employee_id);
              if (active) setEmployee(empRes?.employee || null);
            } catch (_e) {}
          }
        } else if (!isEdit) {
          const preEmployeeId = searchParams.get('employee_id');
          if (preEmployeeId) {
            try {
              const empRes = await getEmployee(preEmployeeId);
              if (!active) return;
              const emp = empRes?.employee;
              if (emp) {
                setEmployee(emp);
                setValues((prev) => ({
                  ...prev,
                  employee_id: emp.id,
                  department_id: emp.department_id ?? '',
                  job_title: emp.job_title || '',
                }));
              }
            } catch (_e) {}
          }
        }
      } catch (err) {
        if (!active) return;
        setError(err.data?.error || err.message || 'Failed to load form data');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [id, isEdit, searchParams]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (emp) => {
    setEmployee(emp);
    setValues((prev) => ({
      ...prev,
      employee_id: emp?.id ?? '',
      department_id: emp?.department_id ?? prev.department_id,
      job_title: prev.job_title || emp?.job_title || '',
    }));
  };

  const totalPreview = useMemo(() => {
    const base = parseFloat(values.base_amount || 0);
    const hra = parseFloat(values.hra_amount || 0);
    const bonus = parseFloat(values.bonus_amount || 0);
    const ded = parseFloat(values.deduction_amount || 0);
    const total = base + hra + bonus - ded;
    return Number.isFinite(total) ? total.toFixed(2) : '0.00';
  }, [values.base_amount, values.hra_amount, values.bonus_amount, values.deduction_amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        employee_id: values.employee_id === '' ? null : Number(values.employee_id),
        department_id: values.department_id === '' ? null : Number(values.department_id),
        job_title: values.job_title,
        currency: values.currency,
        base_amount: values.base_amount,
        hra_amount: values.hra_amount || 0,
        bonus_amount: values.bonus_amount || 0,
        deduction_amount: values.deduction_amount || 0,
        applicable_from: values.applicable_from,
        applicable_till: values.applicable_till || null,
        frequency: values.frequency || 'month',
      };

      if (isEdit) {
        await updateSalary(id, payload);
        navigate(`/salaries/${id}`);
      } else {
        const result = await createSalary(payload);
        const newId = result?.salary?.id;
        navigate(newId ? `/salaries/${newId}` : '/salaries');
      }
    } catch (err) {
      const details = err.data?.errors;
      setError(Array.isArray(details) ? details.join(', ') : (err.data?.error || err.message || 'Failed to save salary'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Salary' : 'New Salary'}
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 900 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!isEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating a new salary record will automatically close the employee&apos;s current open-ended salary (if any) by setting its applicable till date to one day before this salary&apos;s applicable from date.
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <AsyncAutocomplete
              label="Employee"
              value={employee}
              onChange={handleEmployeeChange}
              fetchOptions={fetchEmployeeOptions}
              getOptionLabel={formatEmployeeOption}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              placeholder="Search employee by name, code, or email"
              helperText="Select the employee for this salary record"
              clearable={false}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel id="salary-department-label">Department</InputLabel>
                <Select
                  labelId="salary-department-label"
                  label="Department"
                  name="department_id"
                  value={values.department_id}
                  onChange={handleChange}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {formatDepartmentOption(dept)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Job Title" name="job_title" value={values.job_title} onChange={handleChange} fullWidth required />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Currency" name="currency" value={values.currency} onChange={handleChange} fullWidth required helperText="e.g. INR, USD" />
              <TextField label="Frequency" name="frequency" value={values.frequency} fullWidth disabled helperText="Monthly (currently supported)" />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Base Amount" name="base_amount" type="number" value={values.base_amount} onChange={handleChange} fullWidth required inputProps={{ step: '0.01', min: '0' }} />
              <TextField label="HRA Amount" name="hra_amount" type="number" value={values.hra_amount} onChange={handleChange} fullWidth inputProps={{ step: '0.01', min: '0' }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Bonus Amount" name="bonus_amount" type="number" value={values.bonus_amount} onChange={handleChange} fullWidth inputProps={{ step: '0.01', min: '0' }} />
              <TextField label="Deduction Amount" name="deduction_amount" type="number" value={values.deduction_amount} onChange={handleChange} fullWidth inputProps={{ step: '0.01', min: '0' }} />
            </Stack>
            <Alert severity="success" variant="outlined">Total Amount (Preview): {values.currency ? `${values.currency.toUpperCase()} ` : ''}{totalPreview}</Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Applicable From" name="applicable_from" type="date" value={values.applicable_from} onChange={handleChange} fullWidth required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Applicable Till" name="applicable_till" type="date" value={values.applicable_till} onChange={handleChange} fullWidth slotProps={{ inputLabel: { shrink: true } }} helperText="Leave blank for current/open-ended" />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/salaries')}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default SalaryFormPage;
