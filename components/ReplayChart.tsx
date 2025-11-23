import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { BattleHistoryPoint } from '../types';
import { formatSol } from '../utils';

interface Props {
  history: BattleHistoryPoint[];
  currentTimestamp: number;
  colorA: string;
  colorB: string;
  nameA: string;
  nameB: string;
}

export const ReplayChart: React.FC<Props> = ({ history, currentTimestamp, colorA, colorB, nameA, nameB }) => {
  const data = history.map(h => ({
    ...h,
    timeLabel: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorA} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colorA} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorB} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colorB} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timeLabel" 
            stroke="#64748b" 
            fontSize={10} 
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            tickFormatter={(val) => `◎${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ fontSize: 12 }}
            labelStyle={{ fontSize: 10, color: '#94a3b8', marginBottom: 5 }}
          />
          <Area 
            type="monotone" 
            dataKey="tvlA" 
            name={nameA}
            stroke={colorA} 
            fillOpacity={1} 
            fill="url(#colorA)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="tvlB" 
            name={nameB}
            stroke={colorB} 
            fillOpacity={1} 
            fill="url(#colorB)" 
            strokeWidth={2}
          />
          {/* The Playhead Line */}
          <ReferenceLine x={new Date(currentTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#fff" strokeDasharray="3 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};