import { StylesConfig } from 'react-select';

/** react-select con el aspecto de .form-select de la suite (borde, radio y foco naranja de suite.css). */
export const selectStyles = (invalido = false): StylesConfig<any, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    background: 'var(--card)',
    borderRadius: 'var(--radius)',
    borderColor: invalido ? 'var(--bs-form-invalid-border-color)' : state.isFocused ? 'var(--ring)' : 'var(--border)',
    boxShadow: state.isFocused ? '0 0 0 .2rem oklch(73.5% 0.175 55 / .25)' : 'none',
    '&:hover': { borderColor: state.isFocused ? 'var(--ring)' : 'var(--border)' },
  }),
  placeholder: (base) => ({ ...base, color: 'var(--muted-foreground)' }),
  singleValue: (base) => ({ ...base, color: 'var(--foreground)' }),
  menu: (base) => ({ ...base, zIndex: 5, borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)' }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected ? 'var(--primary)' : state.isFocused ? 'var(--navy-soft)' : 'var(--card)',
    color: state.isSelected ? 'var(--primary-foreground)' : 'var(--foreground)',
  }),
});
