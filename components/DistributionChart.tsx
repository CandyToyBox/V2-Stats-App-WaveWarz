import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SettlementStats } from '../types';
import { formatSol } from '../utils';

interface Props {
  settlement: SettlementStats;
}

export const DistributionChart: React.FC<Props> = ({ settlement }) => {
  const data = [
    { name: 'Winning Traders', value: settlement.toWinningTraders, color: '#22c55e' }, // Green
    { name: 'Losing Traders', value: settlement.toLosingTraders, color: '#ef4444' }, // Red
    { name: 'Winning Artist', value: settlement.toWinningArtist, color: '#e879f9' }, // Fuchsia
    { name: 'Platform', value: settlement.toPlatform, color: '#3b82f6' }, // Blue
    { name: 'Losing Artist', value: settlement.toLosingArtist, color: '#f59e0b' }, // Amber
  ];

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatSol(value)}
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};