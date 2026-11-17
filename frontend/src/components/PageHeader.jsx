import { Stack, Typography } from '@mui/material';

function PageHeader({ title, actions, actionsBelow = false, children }) {
  if (actionsBelow) {
    return (
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4">{title}</Typography>
        {actions ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {actions}
          </Stack>
        ) : null}
        {children}
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Typography variant="h4">{title}</Typography>
      {actions ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {actions}
        </Stack>
      ) : null}
      {children}
    </Stack>
  );
}

export default PageHeader;
