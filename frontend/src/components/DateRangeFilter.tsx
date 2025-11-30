import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { DateRangePreset, DateRange, getDateRangeFromPreset } from '../utils/dateUtils';

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange | null) => void;
  defaultPreset?: DateRangePreset;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onRangeChange, defaultPreset = 'this_month' }) => {
  const [preset, setPreset] = useState<DateRangePreset>(defaultPreset);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (preset === 'custom') {
      if (customStart && customEnd) {
        onRangeChange({ startDate: customStart, endDate: customEnd });
      }
    } else {
      const range = getDateRangeFromPreset(preset);
      onRangeChange(range);
    }
  }, [preset, customStart, customEnd, onRangeChange]);

  const presetOptions: { value: DateRangePreset; label: string }[] = [
    { value: 'this_month', label: 'Denne måned' },
    { value: 'last_month', label: 'Sidste måned' },
    { value: 'last_3_months', label: 'Sidste 3 måneder' },
    { value: 'last_6_months', label: 'Sidste 6 måneder' },
    { value: 'this_year', label: 'Dette år' },
    { value: 'custom', label: 'Vælg periode' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Calendar className="w-4 h-4" />
        <span>Periode</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setPreset(option.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              preset === option.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fra dato</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Til dato</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
