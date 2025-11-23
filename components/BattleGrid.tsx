
import React from 'react';
import { BattleSummary } from '../types';
import { BattleCard } from './BattleCard';

interface Props {
  battles: BattleSummary[];
  onSelect: (battle: BattleSummary) => void;
}

export const BattleGrid: React.FC<Props> = ({ battles, onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Battle Archive</h2>
        <span className="text-slate-400 text-sm">{battles.length} Battles Recorded</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {battles.map((battle) => (
          <BattleCard 
            key={battle.id} 
            battle={battle} 
            onClick={() => onSelect(battle)} 
          />
        ))}
      </div>
    </div>
  );
};
