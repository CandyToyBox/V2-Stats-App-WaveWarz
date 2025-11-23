
import React from 'react';
import { BattleEvent } from '../types';
import { EventCard } from './EventCard';

interface Props {
  events: BattleEvent[];
  onSelect: (event: BattleEvent) => void;
}

export const EventGrid: React.FC<Props> = ({ events, onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Events & Tournaments</h2>
        <span className="text-slate-400 text-sm">{events.length} Events</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onClick={() => onSelect(event)} 
          />
        ))}
      </div>
    </div>
  );
};
