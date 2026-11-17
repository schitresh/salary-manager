import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';

function FilterBar({ fields, values, onChange, onApply, onClear }) {
  return (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); onApply?.(); }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        {fields.map((field) => {
          if (field.options) {
            return (
              <FormControl key={field.name} size="small" sx={{ minWidth: 220 }}>
                <InputLabel id={`filter-${field.name}-label`}>{field.label}</InputLabel>
                <Select
                  labelId={`filter-${field.name}-label`}
                  label={field.label}
                  name={field.name}
                  value={values[field.name] ?? ''}
                  onChange={(e) => onChange(field.name, e.target.value)}
                >
                  <MenuItem value="">{field.allLabel || 'All'}</MenuItem>
                  {field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          return (
            <TextField
              key={field.name}
              name={field.name}
              label={field.label}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              size="small"
              placeholder={field.placeholder || ''}
            />
          );
        })}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" size="small">Apply</Button>
          <Button type="button" variant="outlined" size="small" onClick={onClear}>Clear</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default FilterBar;
