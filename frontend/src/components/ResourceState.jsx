import { Alert, CircularProgress } from '@mui/material';

function ResourceState({ loading, error, isEmpty = false, emptyMessage = 'Not found.', children }) {
  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (isEmpty) return <Alert severity="warning">{emptyMessage}</Alert>;
  return children;
}

export default ResourceState;
