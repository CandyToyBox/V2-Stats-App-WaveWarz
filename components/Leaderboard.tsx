import React from 'react';
import { ArtistStats, BattleSummary } from '../types';
import { Trophy, Flame, Users, Calendar } from 'lucide-react';

interface Props {
  artists: ArtistStats[];
  totalBattles: number;
}

export const Leaderboard: React.FC<Props> = ({ artists, totalBattles }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Platform Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalBattles}</div>
            <div className="text-sm text-slate-500">Total Battles</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{artists.length}</div>
            <div className="text-sm text-slate-500">Active Artists</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Active</div>
            <div className="text-sm text-slate-500">Season Status</div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Most Active Artists
          </h3>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Ranked by Battle Count</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Rank</th>
                <th className="p-4 font-medium">Artist</th>
                <th className="p-4 font-medium text-center">Battles</th>
                <th className="p-4 font-medium text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800">
              {artists.map((artist, index) => (
                <tr key={artist.name} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      index === 1 ? 'bg-slate-300/20 text-slate-300' :
                      index === 2 ? 'bg-orange-700/20 text-orange-500' :
                      'text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                        <img 
                          src={artist.avatar} 
                          alt={artist.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=A';
                          }}
                        />
                      </div>
                      <span className="font-medium text-slate-200">{artist.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-300">{artist.totalBattles}</td>
                  <td className="p-4 text-right text-slate-500">
                    {new Date(artist.lastActive).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};