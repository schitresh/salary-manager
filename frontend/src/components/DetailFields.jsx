import { Stack, Typography } from '@mui/material';

function DetailFields({ fields = [] }) {
  return (
    <Stack spacing={0.5}>
      {fields
        .filter((field) => field && field.hidden !== true)
        .map((field, index) => (
          <Typography key={field.key || field.label || index} sx={field.sx}>
            <strong>{field.label}:</strong>{' '}
            {typeof field.render === 'function' ? field.render(field.value, field) : (field.value ?? '-')}
          </Typography>
        ))}
    </Stack>
  );
}

export default DetailFields;
