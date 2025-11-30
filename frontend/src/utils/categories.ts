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
  salary: '#c5a065',      // Gold - income/salary
  office: '#354b5e',      // Chart 2 - operational
  marketing: '#657a8c',   // Chart 3 - growth
  travel: '#9ba9b5',      // Chart 4 - variable
  software: '#051c2c',    // Chart 1 - technology
  equipment: '#0a2540',   // Navy - capital
  rent: '#1b4030',        // Racing Green - fixed cost
  utilities: '#678fb7',   // Primary 400 - utilities
  insurance: '#163326',   // Green 600 - protection
  tax: '#666666',         // Slate Grey - mandatory
  sales: '#c5a065',       // Gold - revenue
  services: '#8dabc9',    // Primary 300 - services
  consulting: '#b3c7db',  // Primary 200 - consulting
  other: '#c0c9d1',       // Chart 5 - miscellaneous
};

export function getCategoryLabel(category: TransactionCategory | undefined): string {
  if (!category) return '-';
  return categoryLabels[category] || category;
}

export function getCategoryColor(category: TransactionCategory | undefined): string {
  if (!category) return '#666666'; // Slate Grey
  return categoryColors[category] || '#666666';
}
