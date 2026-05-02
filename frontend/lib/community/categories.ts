import type { LookCategory } from '@/lib/api/types';

export const lookCategoryFilters: Array<{ label: string; value: LookCategory | '' }> = [
  { label: 'All', value: '' },
  { label: 'Street', value: 'STREET' },
  { label: 'Casual', value: 'CASUAL' },
  { label: 'Minimal', value: 'MINIMAL' },
  { label: 'Formal', value: 'FORMAL' },
  { label: 'Daily', value: 'DAILY' }
];

export const lookCategoryLabels: Record<LookCategory, string> = {
  DAILY: 'Daily',
  CASUAL: 'Casual',
  STREET: 'Street',
  MINIMAL: 'Minimal',
  FORMAL: 'Formal',
  WORK: 'Work',
  DATE: 'Date',
  TRAVEL: 'Travel',
  SPORTY: 'Sporty',
  ETC: 'Etc'
};
