
import React from 'react';
import { BattleEvent } from '../types';
import { Calendar, Users, Layers } from 'lucide-react';

interface Props {
  event: BattleEvent;
  onClick: () => void;
}

export const EventCard: React.FC<Props> = ({ event, onClick }) => {
  const roundCount = event.rounds.length;
  const isMultiRound = roundCount > 1;

  return (
    <div 
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/20 transition-all cursor-pointer flex flex-col h-full"
    >
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={`${event.artistA.name} vs ${event.artistB.name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=WaveWarz+Event';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
        
        {/* Badge */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
           {isMultiRound && (
             <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide bg-indigo-600/90 text-white border border-indigo-400/30 flex items-center gap-1 shadow-sm">
                <Layers size={10} /> {roundCount} Rounds
             </span>
           )}
           {event.isCommunityEvent && (
             <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide bg-orange-500/90 text-white border border-orange-400/30 flex items-center gap-1 shadow-sm">
                <Users size={10} /> Community
             </span>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col -mt-12 relative z-10">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-1 rounded-full backdrop-blur-sm border border-slate-800">
            <Calendar size={12} />
            {new Date(event.date).toLocaleDateString()}
          </div>
        </div>

        <h3 className="font-bold text-slate-100 text-lg mb-4 flex-1 drop-shadow-md">
          <span className="text-cyan-400">{event.artistA.name}</span>
          <span className="text-slate-500 mx-2 text-sm italic">vs</span>
          <span className="text-fuchsia-400">{event.artistB.name}</span>
        </h3>

        <div className="mt-auto">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-500/50" style={{ width: '100%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                <span>{isMultiRound ? 'Full Event' : 'Single Battle'}</span>
                <span>View Stats &rarr;</span>
            </div>
        </div>
      </div>
    </div>
  );
};
