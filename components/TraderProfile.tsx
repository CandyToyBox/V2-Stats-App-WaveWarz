
import React, { useState } from 'react';
import { TraderProfileStats } from '../types';
import { formatSol, formatPct } from '../utils';
import { Wallet, Trophy, TrendingUp, TrendingDown, Activity, ExternalLink, Calendar, Copy, Check } from 'lucide-react';

interface Props {
  stats: TraderProfileStats;
  onClose: () => void;
}

export const TraderProfile: React.FC<Props> = ({ stats, onClose }) => {
  const isProfitable = stats.netPnL >= 0;
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(stats.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-900/20 shrink-0">
              <Wallet className="text-white w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Trader Analytics
                <a 
                  href={`https://solscan.io/account/${stats.walletAddress}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </h2>
              <button 
                onClick={copyAddress}
                className="flex items-center gap-2 text-slate-400 font-mono text-sm hover:text-white transition-colors group"
              >
                {stats.walletAddress.slice(0, 6)}...{stats.walletAddress.slice(-6)}
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto justify-between md:justify-end">
             <div className="text-right">
               <div className="text-slate-500 text-xs uppercase tracking-wider">Net PnL</div>
               <div className={`text-3xl font-mono font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                 {isProfitable ? '+' : ''}{formatSol(stats.netPnL)}
               </div>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
            <div className="text-slate-500 text-xs mb-1">Win Rate</div>
            <div className="text-xl font-bold text-white">{formatPct(stats.winRate)}</div>
            <div className="text-slate-600 text-xs">{stats.wins}W - {stats.losses}L</div>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
            <div className="text-slate-500 text-xs mb-1">Total Volume</div>
            <div className="text-xl font-bold text-indigo-400">{formatSol(stats.totalInvested)}</div>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
            <div className="text-slate-500 text-xs mb-1">Battles</div>
            <div className="text-xl font-bold text-white">{stats.battlesParticipated}</div>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
            <div className="text-slate-500 text-xs mb-1">Total Payouts</div>
            <div className="text-xl font-bold text-green-400">{formatSol(stats.totalPayout)}</div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <Activity className="text-indigo-500" size={20} /> Battle History
           </h3>
           <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-full">Recent Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-4">Battle</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Invested</th>
                <th className="p-4 text-right">Payout</th>
                <th className="p-4 text-right">PnL</th>
                <th className="p-4 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800">
              {stats.history.map((item, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded overflow-hidden bg-slate-800 shrink-0">
                         <img 
                           src={item.imageUrl} 
                           className="w-full h-full object-cover" 
                           alt="" 
                           onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=?'}
                         />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{item.artistAName} vs {item.artistBName}</span>
                        {item.artistAName === 'Unlisted Battle' && (
                          <span className="text-[10px] text-orange-400">Unlisted / New Battle</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">
                     <div className="flex items-center gap-1">
                       <Calendar size={12} />
                       {new Date(item.date).toLocaleDateString()}
                     </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">{formatSol(item.invested)}</td>
                  <td className="p-4 text-right font-mono text-green-400">{item.payout > 0 ? formatSol(item.payout) : '-'}</td>
                  <td className={`p-4 text-right font-mono font-bold ${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.pnl > 0 ? '+' : ''}{formatSol(item.pnl)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${
                      item.outcome === 'WIN' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                      item.outcome === 'LOSS' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      'bg-slate-700/30 text-slate-400 border-slate-600'
                    }`}>
                      {item.outcome}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.history.length === 0 && (
                 <tr>
                   <td colSpan={6} className="p-8 text-center text-slate-500">
                     No WaveWarz battle history found for this wallet.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
