import {
  Alert,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function DataTable({
  columns,
  rows = [],
  loading = false,
  error = '',
  emptyMessage = 'No records found.',
  rowKey = 'id',
  meta,
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key || column.field}>{column.header || column.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>{emptyMessage}</TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey];
              return (
                <TableRow key={key}>
                  {columns.map((column) => {
                    const field = column.key || column.field;
                    const value = row[field];
                    const content = column.render ? column.render(value, row) : value ?? '-';
                    return <TableCell key={field}>{content}</TableCell>;
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {meta && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Total: {meta.total ?? 0}
          {meta.page ? ` (Page ${meta.page.number}, Size ${meta.page.size})` : ''}
        </Typography>
      )}
    </Box>
  );
}

export default DataTable;
