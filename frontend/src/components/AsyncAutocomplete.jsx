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
  freeSolo = false,
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
      value={value ?? null}
      onChange={(_e, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_e, newInputValue, reason) => {
        if (reason === 'reset') return;
        setInputValue(newInputValue);
        if (freeSolo && reason === 'input') onChange(newInputValue || '');
      }}
      options={mergedOptions}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue || ((opt, val) => opt?.id === val?.id)}
      loading={loading}
      disabled={disabled}
      freeSolo={freeSolo}
      clearOnBlur={false}
      disableClearable={!clearable}
      filterOptions={(x) => x}
      renderInput={(params) => {
        const { InputProps, inputProps, InputLabelProps, slotProps, ...rest } = params;
        const endAdornment = (
          <>
            {loading ? <CircularProgress color="inherit" size={18} /> : null}
            {InputProps?.endAdornment || slotProps?.input?.endAdornment}
          </>
        );

        return (
          <TextField
            {...rest}
            inputProps={inputProps}
            label={label}
            placeholder={placeholder}
            helperText={helperText}
            slotProps={{
              ...slotProps,
              input: {
                ...(InputProps || {}),
                ...(slotProps?.input || {}),
                endAdornment,
              },
              inputLabel: {
                ...(InputLabelProps || {}),
                ...(slotProps?.inputLabel || {}),
              },
            }}
          />
        );
      }}
    />
  );
}

export default AsyncAutocomplete;
