
import React from 'react';
import { RecentTrade } from '../types';
import { formatSol } from '../utils';
import { CircleDollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Props {
  trades: RecentTrade[];
  artistAName: string;
  artistBName: string;
  colorA: string;
  colorB: string;
}

export const WhaleTicker: React.FC<Props> = ({ trades, artistAName, artistBName, colorA, colorB }) => {
  // Filter for whales (> 0.5 SOL for demo purposes)
  const whales = trades.filter(t => t.amount > 0.5);

  if (whales.length === 0) return null;

  return (
    <div className="w-full bg-slate-900 border-y border-slate-800 overflow-hidden py-2 relative">
      <div className="flex animate-marquee gap-8 whitespace-nowrap px-4">
        {whales.map((trade, i) => (
          <div key={trade.signature + i} className="flex items-center gap-2 text-sm font-mono">
             <CircleDollarSign className="w-4 h-4 text-yellow-400" />
             <span className="text-white font-bold">{formatSol(trade.amount)}</span>
             <span className={`flex items-center text-xs px-2 py-0.5 rounded-full ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {trade.type} 
                {trade.type === 'BUY' ? <ArrowUpRight size={12} className="ml-1" /> : <ArrowDownLeft size={12} className="ml-1" />}
             </span>
             <span className="text-slate-500 text-xs">
               by {trade.trader.slice(0, 4)}...{trade.trader.slice(-4)}
             </span>
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {whales.map((trade, i) => (
          <div key={trade.signature + i + '_dup'} className="flex items-center gap-2 text-sm font-mono">
             <CircleDollarSign className="w-4 h-4 text-yellow-400" />
             <span className="text-white font-bold">{formatSol(trade.amount)}</span>
             <span className={`flex items-center text-xs px-2 py-0.5 rounded-full ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {trade.type}
                {trade.type === 'BUY' ? <ArrowUpRight size={12} className="ml-1" /> : <ArrowDownLeft size={12} className="ml-1" />}
             </span>
             <span className="text-slate-500 text-xs">
               by {trade.trader.slice(0, 4)}...{trade.trader.slice(-4)}
             </span>
          </div>
        ))}
      </div>
      <style>{`
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
