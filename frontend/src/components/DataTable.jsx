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
  onPageChange,
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
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Total: {meta.total ?? 0}
            {meta.page ? ` (Page ${meta.page.number}, Size ${meta.page.size})` : ''}
          </Typography>
          {onPageChange && meta.page && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography
                component="button"
                type="button"
                onClick={() => onPageChange(meta.page.number - 1)}
                disabled={meta.page.number <= 1}
                style={{ cursor: meta.page.number <= 1 ? 'default' : 'pointer' }}
              >
                Prev
              </Typography>
              <Typography
                component="button"
                type="button"
                onClick={() => onPageChange(meta.page.number + 1)}
                disabled={meta.page.number * meta.page.size >= (meta.total ?? 0)}
                style={{ cursor: meta.page.number * meta.page.size >= (meta.total ?? 0) ? 'default' : 'pointer' }}
              >
                Next
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default DataTable;
