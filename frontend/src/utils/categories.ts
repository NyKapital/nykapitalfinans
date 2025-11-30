import { TransactionCategory } from '../types';

export const categoryLabels: Record<TransactionCategory, string> = {
  salary: 'Løn',
  office: 'Kontor',
  marketing: 'Marketing',
  travel: 'Rejse',
  software: 'Software',
  equipment: 'Udstyr',
  rent: 'Husleje',
  utilities: 'Forsyning',
  insurance: 'Forsikring',
  tax: 'Skat',
  sales: 'Salg',
  services: 'Tjenester',
  consulting: 'Konsulentydelser',
  other: 'Andet',
};

export const categoryColors: Record<TransactionCategory, string> = {
  salary: '#ef4444',
  office: '#f97316',
  marketing: '#f59e0b',
  travel: '#84cc16',
  software: '#10b981',
  equipment: '#14b8a6',
  rent: '#06b6d4',
  utilities: '#0ea5e9',
  insurance: '#3b82f6',
  tax: '#6366f1',
  sales: '#8b5cf6',
  services: '#a855f7',
  consulting: '#d946ef',
  other: '#64748b',
};

export function getCategoryLabel(category: TransactionCategory | undefined): string {
  if (!category) return '-';
  return categoryLabels[category] || category;
}

export function getCategoryColor(category: TransactionCategory | undefined): string {
  if (!category) return '#64748b';
  return categoryColors[category] || '#64748b';
}
