import { Box, Paper, Typography } from '@mui/material';

function HomePage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Typography variant="h6" gutterBottom>
          Welcome to Salary Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Use the sidebar to manage HR users and, as modules are added, employees, departments, locations, salaries, and analytics.
        </Typography>
      </Paper>
    </Box>
  );
}

export default HomePage;
