import type { ValueTransformer } from 'typeorm';

// MySQL returns DECIMAL columns as strings; the API works with numbers.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};
