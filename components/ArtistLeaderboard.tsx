
import React, { useState, useEffect, useRef } from 'react';
import { BattleSummary, ArtistLeaderboardStats, BattleState, ArtistBattleRecord } from '../types';
import { fetchBattleOnChain } from '../services/solanaService';
import { fetchSolPrice, aggregateArtistStats } from '../services/artistLeaderboardService';
import { Trophy, Music, Loader2, PlayCircle, StopCircle, Twitter, ExternalLink, ChevronDown, ChevronUp, Mic2, DollarSign } from 'lucide-react';
import { formatSol, formatPct } from '../utils';

interface Props {
  battles: BattleSummary[];
}

const Podium: React.FC<{ artist: ArtistLeaderboardStats; rank: number; solPrice: number }> = ({ artist, rank, solPrice }) => {
  let height = "h-40";
  let color = "bg-slate-800";
  let iconColor = "text-slate-400";
  let scale = "scale-100";
  let glow = "";
  
  if (rank === 1) {
    height = "h-56";
    color = "bg-gradient-to-t from-yellow-500/20 to-slate-900 border-yellow-500/50";
    iconColor = "text-yellow-400";
    scale = "scale-110 z-10";
    glow = "shadow-[0_0_30px_rgba(234,179,8,0.3)]";
  } else if (rank === 2) {
    height = "h-48";
    color = "bg-gradient-to-t from-slate-300/20 to-slate-900 border-slate-300/50";
    iconColor = "text-slate-300";
    scale = "scale-100 mt-8";
  } else if (rank === 3) {
    height = "h-44";
    color = "bg-gradient-to-t from-orange-700/20 to-slate-900 border-orange-700/50";
    iconColor = "text-orange-500";
    scale = "scale-100 mt-12";
  }

  return (
    <div className={`flex flex-col items-center transition-all duration-500 ${scale}`}>
       {/* Crown/Rank */}
       <div className={`mb-3 flex flex-col items-center ${rank === 1 ? 'animate-bounce-slow' : ''}`}>
          {rank === 1 && <Trophy size={32} className="text-yellow-400 mb-1 drop-shadow-md" />}
          <div className={`text-xl font-bold font-mono ${iconColor}`}>#{rank}</div>
       </div>

       {/* Avatar */}
       <div className={`w-20 h-20 rounded-full border-2 p-1 bg-slate-950 mb-[-2rem] relative z-20 overflow-hidden ${rank === 1 ? 'border-yellow-500' : 'border-slate-700'}`}>
          <img 
            src={artist.avatar || 'https://via.placeholder.com/100'} 
            alt={artist.artistName} 
            className="w-full h-full object-cover rounded-full"
          />
       </div>

       {/* Card Body */}
       <div className={`w-full sm:w-64 rounded-xl border ${color} ${glow} flex flex-col justify-end items-center pt-10 pb-6 px-4 relative overflow-hidden backdrop-blur-sm`}>
          <div className="text-white font-bold text-lg text-center truncate w-full mb-1">{artist.artistName}</div>
          
          <div className="flex flex-col items-center gap-1 mb-4">
            <div className="text-green-400 font-bold text-2xl flex items-center gap-1">
               <Music size={20} className="mt-1" />
               {(artist.spotifyStreamEquivalents / 1_000).toFixed(1)}k
            </div>
            <div className="text-[10px] uppercase text-green-500/70 tracking-widest font-bold">Stream Equivalents</div>
          </div>

          <div className="w-full bg-slate-950/50 rounded-lg p-2 text-center border border-slate-800">
             <div className="text-indigo-400 font-mono font-bold">{formatSol(artist.totalEarningsSol)}</div>
             <div className="text-slate-500 text-xs">${artist.totalEarningsUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</div>
          </div>
       </div>
    </div>
  );
};

const ArtistRow: React.FC<{ artist: ArtistLeaderboardStats; rank: number }> = ({ artist, rank }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr 
        className={`hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/50 ${expanded ? 'bg-slate-800/20' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="p-4 pl-6">
           <span className="font-mono text-slate-500">#{rank}</span>
        </td>
        <td className="p-4">
           <div className="flex items-center gap-3">
              <img src={artist.avatar} className="w-8 h-8 rounded-full object-cover bg-slate-800" alt="" />
              <div className="font-bold text-white">{artist.artistName}</div>
           </div>
        </td>
        <td className="p-4 text-right">
           <div className="font-bold text-green-400 font-mono">{(artist.spotifyStreamEquivalents).toLocaleString()}</div>
        </td>
        <td className="p-4 text-right">
           <div className="font-bold text-indigo-400 font-mono">{formatSol(artist.totalEarningsSol)}</div>
           <div className="text-xs text-slate-500">${artist.totalEarningsUsd.toLocaleString()}</div>
        </td>
        <td className="p-4 text-center hidden sm:table-cell">
           <span className="text-slate-300 font-mono">{artist.wins}W - {artist.losses}L</span>
           <span className="text-xs text-slate-500 ml-2">({formatPct(artist.winRate)})</span>
        </td>
        <td className="p-4 text-center">
            {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </td>
      </tr>

      {/* Detail Breakdown */}
      {expanded && (
        <tr className="bg-slate-900/50">
          <td colSpan={6} className="p-0">
             <div className="p-6 border-b border-slate-800 animate-in slide-in-from-top-2">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                   <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Earnings Logic</h4>
                      <p className="text-sm text-slate-300 leading-relaxed bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
                         <strong>{artist.artistName}</strong> has earned <span className="text-indigo-400">{formatSol(artist.totalEarningsSol)}</span> total. 
                         <br/>
                         That's equivalent to <span className="text-green-400 font-bold">{artist.spotifyStreamEquivalents.toLocaleString()} Spotify Streams</span> (at $0.003/stream).
                         <br/><br/>
                         With WaveWarz, they earned this in just <strong className="text-white">{artist.battlesParticipated} battles</strong>.
                      </p>
                   </div>
                   
                   <div className="flex gap-2">
                      {artist.twitter && (
                        <a href={`https://twitter.com/${artist.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-sky-500 hover:text-white transition-colors h-fit">
                          <Twitter size={16} /> Twitter
                        </a>
                      )}
                      {artist.musicLink && (
                        <a href={artist.musicLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-fuchsia-500 hover:text-white transition-colors h-fit">
                          <ExternalLink size={16} /> Music
                        </a>
                      )}
                   </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-slate-500 text-xs uppercase">
                        <tr>
                           <th className="p-3">Battle Date</th>
                           <th className="p-3">Opponent</th>
                           <th className="p-3 text-right">Volume</th>
                           <th className="p-3 text-right">Trading Fee (1%)</th>
                           <th className="p-3 text-right">Settlement</th>
                           <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900">
                         {artist.history.map((rec) => (
                           <tr key={rec.battleId}>
                              <td className="p-3 text-slate-400">{new Date(rec.date).toLocaleDateString()}</td>
                              <td className="p-3 text-white">vs {rec.opponentName} <span className={`text-[10px] ml-1 px-1.5 py-0.5 rounded ${rec.result === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{rec.result}</span></td>
                              <td className="p-3 text-right text-slate-500 font-mono">{formatSol(rec.volumeGenerated)}</td>
                              <td className="p-3 text-right text-indigo-300 font-mono">{formatSol(rec.tradingFees)}</td>
                              <td className="p-3 text-right text-fuchsia-300 font-mono">{formatSol(rec.settlementFees)}</td>
                              <td className="p-3 text-right text-white font-bold font-mono">{formatSol(rec.totalEarnings)}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const ArtistLeaderboard: React.FC<Props> = ({ battles }) => {
  const [stats, setStats] = useState<ArtistLeaderboardStats[]>([]);
  const [solPrice, setSolPrice] = useState<number>(0);
  
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hydratedBattles, setHydratedBattles] = useState<BattleState[]>([]);

  // 1. Initial Load: Fetch Price & Start Scan
  useEffect(() => {
    const init = async () => {
      const price = await fetchSolPrice();
      setSolPrice(price);
      startScan();
    };
    init();
  }, []);

  // 2. Scan Logic (Progressively hydrate battles to get Real Volume)
  const startScan = async () => {
    setIsScanning(true);
    setProgress(0);
    const results: BattleState[] = [];
    const BATCH_SIZE = 2; // Reduced from 5 to 2 to prevent rate limits

    // Process in batches
    for (let i = 0; i < battles.length; i += BATCH_SIZE) {
       const batch = battles.slice(i, i + BATCH_SIZE);
       
       // Parallel fetch for the batch
       try {
           const promises = batch.map(b => fetchBattleOnChain(b)); // This uses the cache in solanaService
           const batchData = await Promise.all(promises);
           
           results.push(...batchData);
           setHydratedBattles([...results]); // Update incrementally
           setProgress(Math.min(i + BATCH_SIZE, battles.length));
           
           // Update stats visualization incrementally
           const calculatedStats = aggregateArtistStats(results, solPrice);
           setStats(calculatedStats);

           // Larger delay to respect RPC rate limits (1000ms)
           await new Promise(r => setTimeout(r, 1000));
       } catch (e) {
           console.warn("Batch failed, skipping...", e);
       }
    }
    setIsScanning(false);
  };

  // Re-calc when solPrice changes (if scanning finished)
  useEffect(() => {
     if (solPrice > 0 && hydratedBattles.length > 0) {
        const calculatedStats = aggregateArtistStats(hydratedBattles, solPrice);
        setStats(calculatedStats);
     }
  }, [solPrice]);

  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  const totalPaidSol = stats.reduce((acc, curr) => acc + curr.totalEarningsSol, 0);
  const totalStreams = stats.reduce((acc, curr) => acc + curr.spotifyStreamEquivalents, 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* 1. Hero Stats Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-10 text-center">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500"></div>
         <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>
         <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
         
         <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Total Platform Payouts</h2>
            <div className="text-5xl md:text-6xl font-black text-white mb-2 flex items-baseline justify-center gap-2">
               <span className="text-indigo-400">◎</span>
               {totalPaidSol.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-slate-500 font-mono mb-8">
               ≈ ${(totalPaidSol * (solPrice || 180)).toLocaleString()} USD
            </div>

            <div className="bg-slate-950/80 border border-slate-800 backdrop-blur-md rounded-2xl p-6 md:px-12 flex flex-col items-center animate-pulse-slow">
               <div className="text-green-500 font-black text-3xl md:text-5xl mb-2 flex items-center gap-3">
                  <Music className="w-8 h-8 md:w-12 md:h-12" />
                  {totalStreams.toLocaleString()}
               </div>
               <div className="text-white font-bold text-lg">Spotify Stream Equivalents</div>
               <p className="text-slate-500 text-sm mt-2 max-w-md">
                  Artists on WaveWarz have earned the equivalent of <strong>{(totalStreams / 1_000_000).toFixed(1)} Million</strong> streams on Spotify.
               </p>
            </div>
         </div>
      </div>

      {/* 2. Controls & Progress */}
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <Mic2 className="text-fuchsia-500" /> Artist Rankings
            </h3>
         </div>
         
         <div className="flex items-center gap-4">
            {isScanning && (
               <div className="flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                  <span>Scanning On-Chain: {progress}/{battles.length}</span>
               </div>
            )}
            <button 
               onClick={isScanning ? () => setIsScanning(false) : startScan}
               className="p-2 text-slate-400 hover:text-white transition-colors"
               title="Refresh On-Chain Data"
            >
               {isScanning ? <StopCircle size={20} /> : <PlayCircle size={20} />}
            </button>
         </div>
      </div>

      {/* 3. The Podium */}
      {top3.length > 0 && (
         <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 pb-8 border-b border-slate-800/50">
            {/* Silver */}
            {top3[1] && <div className="order-2 md:order-1"><Podium artist={top3[1]} rank={2} solPrice={solPrice} /></div>}
            {/* Gold */}
            {top3[0] && <div className="order-1 md:order-2"><Podium artist={top3[0]} rank={1} solPrice={solPrice} /></div>}
            {/* Bronze */}
            {top3[2] && <div className="order-3 md:order-3"><Podium artist={top3[2]} rank={3} solPrice={solPrice} /></div>}
         </div>
      )}

      {/* 4. The List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                     <th className="p-4 pl-6">Rank</th>
                     <th className="p-4">Artist</th>
                     <th className="p-4 text-right text-green-500">Spotify Equiv.</th>
                     <th className="p-4 text-right">Total Earnings</th>
                     <th className="p-4 text-center hidden sm:table-cell">Record</th>
                     <th className="p-4"></th>
                  </tr>
               </thead>
               <tbody className="bg-slate-900 text-sm divide-y divide-slate-800">
                  {rest.map((artist, i) => (
                     <ArtistRow key={artist.artistName} artist={artist} rank={i + 4} />
                  ))}
               </tbody>
            </table>
         </div>
         {rest.length === 0 && top3.length === 0 && (
            <div className="p-12 text-center text-slate-500">
               <Loader2 size={32} className="animate-spin mx-auto mb-4 opacity-50" />
               <p>Calculating artist earnings...</p>
            </div>
         )}
      </div>
    </div>
  );
};
