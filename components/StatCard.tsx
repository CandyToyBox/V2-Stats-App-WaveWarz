import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  colorClass?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, colorClass = "text-slate-100", trend }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        {icon && <div className={`${colorClass} opacity-80`}>{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      {subValue && <div className="text-slate-500 text-xs mt-1">{subValue}</div>}
    </div>
  );
};