
import React, { useState, useEffect, useRef } from 'react';
import { BattleSummary, TraderLeaderboardEntry } from '../types';
import { fetchBatchTraderStats } from '../services/solanaService';
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, Wallet, Trophy, PlayCircle, StopCircle } from 'lucide-react';
import { formatSol, formatPct } from '../utils';

interface Props {
  battles: BattleSummary[];
  onSelectTrader: (wallet: string) => void;
}

type SortKey = 'totalInvested' | 'netPnL' | 'roi' | 'battlesParticipated';

export const TraderLeaderboard: React.FC<Props> = ({ battles, onSelectTrader }) => {
  const [traders, setTraders] = useState<TraderLeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  
  // Internal Accumulator (Ref to avoid re-rendering loop issues)
  const rawStatsRef = useRef<Map<string, { invested: number, payout: number, battles: Set<string> }>>(new Map());

  const [sortKey, setSortKey] = useState<SortKey>('netPnL');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const startScan = () => {
    // Reset
    setTraders([]);
    rawStatsRef.current.clear();
    setIsScanning(true);
    setProgressCount(0);
  };

  useEffect(() => {
    let active = true;

    const runBatchScan = async () => {
      // Chunk size for batching
      const BATCH_SIZE = 5; 
      
      for (let i = 0; i < battles.length; i += BATCH_SIZE) {
        if (!active || !isScanning) break;
        
        const batch = battles.slice(i, i + BATCH_SIZE);
        
        // 1. Fetch batch
        try {
            const batchResults = await fetchBatchTraderStats(batch);
            
            // 2. Merge into accumulator
            for (const [wallet, stats] of batchResults) {
                if (!rawStatsRef.current.has(wallet)) {
                    rawStatsRef.current.set(wallet, { invested: 0, payout: 0, battles: new Set() });
                }
                const entry = rawStatsRef.current.get(wallet)!;
                entry.invested += stats.invested;
                entry.payout += stats.payout;
                stats.battles.forEach(b => entry.battles.add(b));
            }
            
            // 3. Update State (Transform Map to Array)
            const newTraderList: TraderLeaderboardEntry[] = Array.from(rawStatsRef.current.entries()).map(([address, data]) => {
                const netPnL = data.payout - data.invested;
                let roi = 0;
                if (data.invested > 0) roi = (netPnL / data.invested) * 100;
                
                return {
                    walletAddress: address,
                    totalInvested: data.invested,
                    totalPayout: data.payout,
                    netPnL,
                    roi,
                    battlesParticipated: data.battles.size,
                    wins: netPnL > 0 ? 1 : 0, // Approximate based on global PnL
                    losses: netPnL < 0 ? 1 : 0,
                    winRate: netPnL > 0 ? 100 : 0
                };
            });
            
            setTraders(newTraderList);
            setProgressCount(Math.min(i + BATCH_SIZE, battles.length));

            // Optional delay to be nice to RPC
            await new Promise(r => setTimeout(r, 500));
            
        } catch (e) {
            console.error("Batch scan failed", e);
        }
      }
      if (active) setIsScanning(false);
    };

    if (isScanning && battles.length > 0) {
        runBatchScan();
    }

    return () => { active = false; };
  }, [isScanning, battles]);

  // Auto-start on mount if empty
  useEffect(() => {
    if (traders.length === 0 && !isScanning) {
        startScan();
    }
  }, []); // Only once

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredTraders = traders
    .filter(t => t.walletAddress.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-indigo-400" /> : <ArrowDown size={12} className="text-indigo-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filter by Wallet Address..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
             {/* Progress Status */}
             <div className="flex-1 md:flex-none text-right">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                    {isScanning ? 'Scanning Blockchain...' : 'Scan Complete'}
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${isScanning ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`} 
                            style={{ width: `${(progressCount / Math.max(battles.length, 1)) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs font-mono text-slate-400">{progressCount}/{battles.length}</span>
                </div>
             </div>

            <button 
              onClick={isScanning ? () => setIsScanning(false) : startScan}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  isScanning 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
              }`}
            >
              {isScanning ? <><StopCircle size={14} /> Stop</> : <><PlayCircle size={14} /> Refresh</>}
            </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm relative min-h-[400px]">
        
        {/* Empty State / Initial Load */}
        {traders.length === 0 && isScanning && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 backdrop-blur-sm">
             <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
             <p className="text-slate-400 font-mono text-sm">Aggregating trader data across all battles...</p>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 pl-6 w-16">Rank</th>
                <th className="p-4">Trader Wallet</th>
                <th 
                  className="p-4 text-right cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
                  onClick={() => handleSort('battlesParticipated')}
                >
                  <div className="flex items-center justify-end gap-1">Battles <SortIcon colKey="battlesParticipated" /></div>
                </th>
                <th 
                  className="p-4 text-right cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
                  onClick={() => handleSort('totalInvested')}
                >
                  <div className="flex items-center justify-end gap-1">Total Vol <SortIcon colKey="totalInvested" /></div>
                </th>
                <th 
                  className="p-4 text-right cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
                  onClick={() => handleSort('netPnL')}
                >
                  <div className="flex items-center justify-end gap-1">Net PnL <SortIcon colKey="netPnL" /></div>
                </th>
                <th 
                  className="p-4 text-right pr-6 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
                  onClick={() => handleSort('roi')}
                >
                  <div className="flex items-center justify-end gap-1">ROI % <SortIcon colKey="roi" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm bg-slate-900 divide-y divide-slate-800">
              {filteredTraders.map((trader, index) => (
                <tr key={trader.walletAddress} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 pl-6">
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
                      <div className="p-2 bg-slate-800 rounded-lg">
                        <Wallet size={16} className="text-slate-400" />
                      </div>
                      <button 
                        onClick={() => onSelectTrader(trader.walletAddress)}
                        className="font-mono text-slate-300 hover:text-indigo-400 hover:underline text-xs sm:text-sm transition-colors text-left"
                      >
                        {trader.walletAddress}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-400">
                    {trader.battlesParticipated}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-200">
                    {formatSol(trader.totalInvested)}
                  </td>
                  <td className={`p-4 text-right font-mono font-bold ${trader.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trader.netPnL > 0 ? '+' : ''}{formatSol(trader.netPnL)}
                  </td>
                  <td className={`p-4 text-right pr-6 font-mono ${trader.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPct(trader.roi)}
                  </td>
                </tr>
              ))}
              
              {!isScanning && filteredTraders.length === 0 && (
                 <tr>
                   <td colSpan={6} className="p-12 text-center text-slate-500">
                     <div className="flex flex-col items-center gap-2">
                       <Trophy size={32} className="opacity-20" />
                       <p>No active traders found.</p>
                     </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
           <span>* Scanning {battles.length} battles for active wallets. Metrics based on realized PnL.</span>
           <span className={isScanning ? 'text-indigo-400 animate-pulse' : ''}>
               {isScanning ? 'Live Updating...' : 'Updated'}
           </span>
        </div>
      </div>
    </div>
  );
};
