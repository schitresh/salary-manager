import { Box, Button, Stack, TextField } from '@mui/material';

function FilterBar({ fields, values, onChange, onApply, onClear }) {
  return (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); onApply?.(); }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        {fields.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            value={values[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            size="small"
            placeholder={field.placeholder || ''}
          />
        ))}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" size="small">Apply</Button>
          <Button type="button" variant="outlined" size="small" onClick={onClear}>Clear</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default FilterBar;
