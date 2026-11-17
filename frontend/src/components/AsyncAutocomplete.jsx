import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';

function AsyncAutocomplete({
  label,
  value,
  onChange,
  fetchOptions,
  getOptionLabel,
  isOptionEqualToValue,
  placeholder = '',
  disabled = false,
  helperText = '',
  clearable = true,
}) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const query = inputValue.trim();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchOptions(query);
        if (!active) return;
        setOptions(Array.isArray(result) ? result : []);
      } catch (_err) {
        if (!active) return;
        setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, query ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inputValue, fetchOptions]);

  const mergedOptions = useMemo(() => {
    if (!value) return options;
    const exists = options.some((opt) => (isOptionEqualToValue ? isOptionEqualToValue(opt, value) : opt?.id === value?.id));
    return exists ? options : [value, ...options];
  }, [options, value, isOptionEqualToValue]);

  return (
    <Autocomplete
      value={value || null}
      onChange={(_e, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_e, newInputValue, reason) => {
        if (reason === 'reset') return;
        setInputValue(newInputValue);
      }}
      options={mergedOptions}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue || ((opt, val) => opt?.id === val?.id)}
      loading={loading}
      disabled={disabled}
      clearOnBlur={false}
      disableClearable={!clearable}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

export default AsyncAutocomplete;
