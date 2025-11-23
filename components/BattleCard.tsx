import React from 'react';
import { BattleSummary } from '../types';
import { Calendar, PlayCircle, Trophy, ExternalLink, Music, Twitter, Users } from 'lucide-react';

interface Props {
  battle: BattleSummary;
  onClick: () => void;
}

export const BattleCard: React.FC<Props> = ({ battle, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/20 transition-all cursor-pointer flex flex-col h-full"
    >
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={battle.imageUrl} 
          alt={`${battle.artistA.name} vs ${battle.artistB.name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=WaveWarz+Battle';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border shadow-sm ${
            battle.status === 'Active' 
              ? 'bg-green-500/80 text-white border-green-500/30'
              : 'bg-slate-800/90 text-slate-300 border-slate-700'
          }`}>
            {battle.status}
          </span>
        </div>

        {/* Community Battle Badge */}
        {battle.isCommunityBattle && (
          <div className="absolute top-3 left-3 z-10">
             <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-500/90 text-white border border-orange-400/50 flex items-center gap-1 shadow-sm">
                <Users size={10} /> Community
             </span>
          </div>
        )}

        {/* Stream Link */}
        {battle.streamLink && (
           <a 
            href={battle.streamLink} 
            target="_blank" 
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 p-2 bg-red-600/90 hover:bg-red-500 rounded-full text-white transition-colors backdrop-blur-sm shadow-lg flex items-center gap-2 group/stream z-10"
          >
            <PlayCircle size={16} className="animate-pulse" />
            <span className="text-xs font-bold w-0 overflow-hidden group-hover/stream:w-auto transition-all duration-300 whitespace-nowrap">Watch Live</span>
           </a>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col -mt-12 relative z-10">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-1 rounded-full backdrop-blur-sm border border-slate-800">
            <Calendar size={12} />
            {new Date(battle.createdAt).toLocaleDateString()}
          </div>
          <div className="font-mono text-[10px] opacity-60">
            ID: {battle.battleId.slice(-6)}
          </div>
        </div>

        <h3 className="font-bold text-slate-100 text-lg mb-4 flex-1 drop-shadow-md">
          <span className="text-cyan-400">{battle.artistA.name}</span>
          <span className="text-slate-500 mx-2 text-sm italic">vs</span>
          <span className="text-fuchsia-400">{battle.artistB.name}</span>
        </h3>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {/* Artist A Actions */}
          <div className="flex gap-1 justify-center">
             {battle.artistA.musicLink && (
               <a href={battle.artistA.musicLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center justify-center py-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors">
                 <Music size={14} />
               </a>
             )}
             {battle.artistA.twitter && (
               <a href={`https://twitter.com/${battle.artistA.twitter}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center justify-center py-2 rounded bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 border border-slate-700 transition-colors">
                 <Twitter size={14} />
               </a>
             )}
          </div>

          {/* Artist B Actions */}
           <div className="flex gap-1 justify-center">
             {battle.artistB.musicLink && (
               <a href={battle.artistB.musicLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center justify-center py-2 rounded bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 transition-colors">
                 <Music size={14} />
               </a>
             )}
              {battle.artistB.twitter && (
               <a href={`https://twitter.com/${battle.artistB.twitter}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center justify-center py-2 rounded bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 border border-slate-700 transition-colors">
                 <Twitter size={14} />
               </a>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
