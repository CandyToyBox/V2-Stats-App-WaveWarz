
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  History,
  ArrowLeft,
  Loader2,
  Music,
  Twitter,
  ExternalLink,
  LayoutGrid,
  ListOrdered,
  ShieldCheck,
  BarChart3,
  CalendarDays,
  Search,
  Wallet
} from 'lucide-react';
import { BattleState, BattleSummary, BattleEvent, TraderProfileStats } from './types';
import { calculateSettlement, formatSol, formatPct, calculateTVLWinner, calculateLeaderboard, groupBattlesIntoEvents } from './utils';
import { StatCard } from './components/StatCard';
import { DistributionChart } from './components/DistributionChart';
import { RoiCalculator } from './components/RoiCalculator';
import { BattleReplay } from './components/BattleReplay';
import { BattleGrid } from './components/BattleGrid';
import { EventGrid } from './components/EventGrid';
import { Leaderboard } from './components/Leaderboard';
import { WhaleTicker } from './components/WhaleTicker';
import { MomentumGauge } from './components/MomentumGauge';
import { ShareButton } from './components/ShareButton';
import { TraderProfile } from './components/TraderProfile';
import { getBattleLibrary } from './data';
import { fetchBattleOnChain, fetchTraderProfile } from './services/solanaService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'grid' | 'events' | 'dashboard' | 'replay' | 'leaderboard' | 'trader'>('grid');
  const [selectedBattle, setSelectedBattle] = useState<BattleState | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BattleEvent | null>(null);
  const [traderStats, setTraderStats] = useState<TraderProfileStats | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Data
  const [library, setLibrary] = useState<BattleSummary[]>([]);

  useEffect(() => {
    setLibrary(getBattleLibrary());
  }, []);

  const artistStats = useMemo(() => calculateLeaderboard(library), [library]);
  const events = useMemo(() => groupBattlesIntoEvents(library), [library]);

  // --- POLLING LOGIC ---
  useEffect(() => {
    // Clear existing poll on change
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (currentView === 'dashboard' && selectedBattle && !selectedBattle.isEnded) {
       pollingRef.current = setInterval(async () => {
         try {
           // Silent refresh
           const freshData = await fetchBattleOnChain(selectedBattle, true);
           setSelectedBattle(freshData);
         } catch (e) {
           console.warn("Silent refresh failed", e);
         }
       }, 15000); // 15 seconds
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentView, selectedBattle?.id, selectedBattle?.isEnded]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsLoading(true);
    
    try {
      // 1. Check if it's a wallet address (Length 32-44 chars usually)
      if (searchQuery.length >= 32 && searchQuery.length <= 44) {
         const stats = await fetchTraderProfile(searchQuery, library);
         setTraderStats(stats);
         setCurrentView('trader');
         setSelectedBattle(null);
         setSelectedEvent(null);
      } else {
        // 2. Filter battles by name (Simple client side filter)
        // Just alert for now or implement filter view. 
        // For "Well Oiled Machine", let's filter the grid view.
        setCurrentView('grid');
        // We will pass searchQuery to grid filtering
      }
    } catch (err) {
      console.error("Search failed", err);
      alert("Could not find wallet or data. Please check the address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBattle = async (summary: BattleSummary) => {
    setIsLoading(true);
    try {
      const fullData = await fetchBattleOnChain(summary);
      setSelectedBattle(fullData);
      setCurrentView('dashboard');
    } catch (e) {
      console.error("Failed to fetch battle data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = (event: BattleEvent) => {
    setSelectedEvent(event);
  };

  const handleBack = () => {
    if (currentView === 'dashboard' || currentView === 'replay') {
      if (selectedEvent) {
        setSelectedBattle(null);
        setCurrentView('events');
      } else {
        setCurrentView('grid');
        setSelectedBattle(null);
      }
    } else if (currentView === 'events' && selectedEvent) {
      setSelectedEvent(null);
    } else if (currentView === 'trader') {
      setCurrentView('grid');
      setTraderStats(null);
      setSearchQuery('');
    } else {
      setCurrentView('grid');
    }
  };

  // Render Logic helpers
  const battle = selectedBattle;
  const winner = battle ? calculateTVLWinner(battle) : 'A';
  const settlement = battle ? calculateSettlement(battle) : null;
  const totalVolume = battle ? battle.totalVolumeA + battle.totalVolumeB : 0;
  const totalTVL = battle ? battle.artistASolBalance + battle.artistBSolBalance : 0;

  const tvlData = battle ? [
    { name: battle.artistA.name, value: battle.artistASolBalance, color: battle.artistA.color },
    { name: battle.artistB.name, value: battle.artistBSolBalance, color: battle.artistB.color },
  ] : [];

  // Filter battles for Grid View based on Search
  const filteredBattles = useMemo(() => {
    if (!searchQuery || searchQuery.length > 30) return library; // Ignore wallet addresses
    return library.filter(b => 
      b.artistA.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.artistB.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [library, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header / Nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0" 
            onClick={() => { setCurrentView('grid'); setSelectedEvent(null); setSelectedBattle(null); setSearchQuery(''); }}
          >
            <Activity className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-xl tracking-tight text-white hidden sm:inline">WaveWarz<span className="text-indigo-500">Analytics</span></span>
            <span className="font-bold text-xl tracking-tight text-white sm:hidden">WW<span className="text-indigo-500">A</span></span>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-lg relative group">
             <form onSubmit={handleSearch} className="relative">
               <input 
                 type="text" 
                 placeholder="Search Artist or Paste Wallet Address..."
                 className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
             </form>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            {/* Main Nav Items */}
            <div className="hidden md:flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => { setCurrentView('grid'); setSelectedBattle(null); setSelectedEvent(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  currentView === 'grid'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={14} /> Battles
              </button>
              <button 
                onClick={() => { setCurrentView('events'); setSelectedBattle(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  currentView === 'events'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays size={14} /> Events
              </button>
              <button 
                onClick={() => { setCurrentView('leaderboard'); setSelectedBattle(null); setSelectedEvent(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  currentView === 'leaderboard'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered size={14} /> Leaderboard
              </button>
            </div>

            {/* Battle Specific Controls */}
            {(currentView === 'dashboard' || currentView === 'replay') && battle && (
              <>
                <ShareButton battle={battle} />
                <button 
                  onClick={() => setCurrentView(currentView === 'replay' ? 'dashboard' : 'replay')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    currentView === 'replay' 
                      ? 'bg-indigo-500 text-white border-indigo-500' 
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                  }`}
                >
                  <History size={14} />
                  <span className="hidden sm:inline">{currentView === 'replay' ? 'Exit' : 'Replay'}</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* WHALE TICKER - Visible only in Dashboard/Replay */}
        {currentView === 'dashboard' && battle && battle.recentTrades.length > 0 && (
          <WhaleTicker 
            trades={battle.recentTrades} 
            artistAName={battle.artistA.name}
            artistBName={battle.artistB.name}
            colorA={battle.artistA.color}
            colorB={battle.artistB.color}
          />
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <div className="text-slate-300 font-mono">Crunching Blockchain Data...</div>
          </div>
        )}

        {/* VIEW 0: TRADER PROFILE */}
        {currentView === 'trader' && traderStats && (
          <div>
            <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium mb-6">
              <ArrowLeft size={16} /> Back to Grid
            </button>
            <TraderProfile stats={traderStats} onClose={handleBack} />
          </div>
        )}

        {/* VIEW 1: BATTLE GRID (DEFAULT) */}
        {currentView === 'grid' && (
          <BattleGrid battles={filteredBattles} onSelect={handleSelectBattle} />
        )}

        {/* VIEW 2: EVENTS GRID */}
        {currentView === 'events' && !selectedEvent && (
          <EventGrid events={events} onSelect={handleSelectEvent} />
        )}

        {/* VIEW 2.5: EVENT DETAIL (Inside Events Tab) */}
        {currentView === 'events' && selectedEvent && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft size={20} className="text-slate-400" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {selectedEvent.artistA.name} <span className="text-slate-500 text-lg">vs</span> {selectedEvent.artistB.name}
                  </h2>
                  <div className="text-slate-400 text-sm">
                    {selectedEvent.rounds.length} Rounds • {new Date(selectedEvent.date).toLocaleDateString()}
                  </div>
                </div>
             </div>
             
             <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300 flex items-start gap-3">
                <Trophy size={18} className="mt-0.5 shrink-0" />
                <div>
                  <strong className="block mb-1">Winning Condition: Best 2 out of 3</strong>
                  The winner of the round is determined by winning 2 out of 3 categories: Charts, Judges Panel, and Audience Poll.
                </div>
             </div>

             <BattleGrid battles={selectedEvent.rounds} onSelect={handleSelectBattle} />
          </div>
        )}

        {/* VIEW 3: LEADERBOARD */}
        {currentView === 'leaderboard' && (
           <Leaderboard artists={artistStats} totalBattles={library.length} />
        )}

        {/* VIEW 4: REPLAY */}
        {currentView === 'replay' && battle && (
          <BattleReplay battle={battle} onExit={() => setCurrentView('dashboard')} />
        )}

        {/* VIEW 5: DASHBOARD */}
        {currentView === 'dashboard' && battle && settlement && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Back Button & Chain Status */}
            <div className="flex justify-between items-center">
              <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium">
                <ArrowLeft size={16} /> 
                {selectedEvent ? 'Back to Event' : 'Back to Archive'}
              </button>

              <div className="flex gap-2">
                 <a 
                   href={`https://solscan.io/account/${battle.battleAddress}`} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-full hover:bg-slate-800 hover:text-white transition-colors"
                 >
                   <ExternalLink size={12} />
                   <span>View Contract</span>
                 </a>
                 <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full">
                   <ShieldCheck size={12} />
                   <span>Verified On-Chain</span>
                 </div>
              </div>
            </div>

            {/* Battle Hero Section */}
            <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-8 md:p-12">
               {/* Background Image & Overlay */}
               <div className="absolute inset-0 z-0">
                 <img src={battle.imageUrl} alt="Battle Background" className="w-full h-full object-cover opacity-20 blur-sm" />
                 <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-900"></div>
               </div>

               {/* Background Glow */}
               <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none z-0"></div>
               <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none z-0"></div>

               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                  {/* Artist A */}
                  <div className={`flex flex-col items-center text-center transition-all duration-500 ${winner === 'A' && battle.isEnded ? 'scale-110 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'opacity-80'}`}>
                    <div className="w-24 h-24 rounded-full p-1 border-2 border-cyan-500 mb-4 overflow-hidden shadow-lg shadow-cyan-900/20 bg-slate-950">
                      {battle.artistA.avatar ? (
                        <img src={battle.artistA.avatar} alt="A" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-cyan-900/20 flex items-center justify-center text-cyan-500 font-bold text-2xl">A</div>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{battle.artistA.name}</h2>
                    <div className="mt-2 text-3xl font-mono font-bold text-cyan-400">{formatSol(battle.artistASolBalance)}</div>
                    <div className="text-xs text-cyan-500/70 uppercase tracking-widest mt-1">Total Value Locked</div>
                    <div className="flex gap-2 mt-3">
                      {battle.artistA.twitter && (
                        <a href={`https://twitter.com/${battle.artistA.twitter}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-sky-500 hover:text-white transition-colors text-slate-400">
                          <Twitter size={14} />
                        </a>
                      )}
                      {battle.artistA.musicLink && (
                        <a href={battle.artistA.musicLink} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-cyan-500 hover:text-white transition-colors text-slate-400">
                          <Music size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* VS / Result */}
                  <div className="flex flex-col items-center">
                    {battle.isEnded ? (
                      <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <Trophy className="w-12 h-12 text-yellow-400 mb-2 drop-shadow-lg" />
                        <span className="text-yellow-400 font-bold tracking-widest uppercase">Chart Winner</span>
                        <span className="text-white font-bold text-lg mt-1 text-center max-w-[200px]">{winner === 'A' ? battle.artistA.name : battle.artistB.name}</span>
                        <span className="text-slate-500 text-sm mt-2">Margin: {formatSol(settlement.winMargin)}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full max-w-xs">
                        <div className="text-slate-500 font-mono text-sm mb-2">{formatPct(battle.artistASolBalance / (totalTVL || 1) * 100)} vs {formatPct(battle.artistBSolBalance / (totalTVL || 1) * 100)}</div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${(battle.artistASolBalance / (totalTVL || 1)) * 100}%` }}></div>
                          <div className="h-full bg-fuchsia-500 transition-all duration-500" style={{ width: `${(battle.artistBSolBalance / (totalTVL || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Artist B */}
                  <div className={`flex flex-col items-center text-center transition-all duration-500 ${winner === 'B' && battle.isEnded ? 'scale-110 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]' : 'opacity-80'}`}>
                    <div className="w-24 h-24 rounded-full p-1 border-2 border-fuchsia-500 mb-4 overflow-hidden shadow-lg shadow-fuchsia-900/20 bg-slate-950">
                       {battle.artistB.avatar ? (
                        <img src={battle.artistB.avatar} alt="B" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-fuchsia-900/20 flex items-center justify-center text-fuchsia-500 font-bold text-2xl">B</div>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{battle.artistB.name}</h2>
                    <div className="mt-2 text-3xl font-mono font-bold text-fuchsia-400">{formatSol(battle.artistBSolBalance)}</div>
                    <div className="text-xs text-fuchsia-500/70 uppercase tracking-widest mt-1">Total Value Locked</div>
                    <div className="flex gap-2 mt-3">
                      {battle.artistB.twitter && (
                        <a href={`https://twitter.com/${battle.artistB.twitter}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-sky-500 hover:text-white transition-colors text-slate-400">
                          <Twitter size={14} />
                        </a>
                      )}
                      {battle.artistB.musicLink && (
                        <a href={battle.artistB.musicLink} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-fuchsia-500 hover:text-white transition-colors text-slate-400">
                          <Music size={14} />
                        </a>
                      )}
                    </div>
                  </div>
               </div>
            </section>

            {/* Core Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                label="Total Volume" 
                value={formatSol(totalVolume)} 
                subValue="Lifetime traded" 
                icon={<BarChart3 size={20} />} 
                colorClass="text-indigo-400"
              />
              <StatCard 
                label="Total Trades" 
                value={battle.tradeCount.toString()} 
                subValue={`${battle.uniqueTraders} Unique Wallets`} 
                icon={<TrendingUp size={20} />} 
                colorClass="text-emerald-400"
              />
               <StatCard 
                label="Artist A Volume" 
                value={formatSol(battle.totalVolumeA)} 
                subValue="Estimated" 
                icon={<Activity size={20} />} 
                colorClass="text-cyan-400"
              />
               <StatCard 
                label="Artist B Volume" 
                value={formatSol(battle.totalVolumeB)} 
                subValue="Estimated" 
                icon={<Activity size={20} />} 
                colorClass="text-fuchsia-400"
              />
            </section>

            {/* Detailed Analysis & Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Settlement & Distribution */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Prize Pool Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Loser's Pool Distribution
                    </h3>
                    <span className="text-sm text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                      Total: {formatSol(settlement.loserPoolTotal)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DistributionChart settlement={settlement} />
                    
                    <div className="space-y-4 flex flex-col justify-center">
                      <div className="p-4 bg-slate-950/50 rounded-xl border-l-4 border-green-500">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Winning Traders (40%)</span>
                          <span className="text-green-400 font-bold font-mono">{formatSol(settlement.toWinningTraders)}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-950/50 rounded-xl border-l-4 border-red-500">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Losing Traders (50% Retained)</span>
                          <span className="text-red-400 font-bold font-mono">{formatSol(settlement.toLosingTraders)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-950/50 rounded-xl border-l-4 border-fuchsia-500">
                          <div className="text-slate-500 text-xs mb-1">Win Artist (5%)</div>
                          <div className="text-fuchsia-300 font-mono text-sm">{formatSol(settlement.toWinningArtist)}</div>
                        </div>
                        <div className="p-3 bg-slate-950/50 rounded-xl border-l-4 border-blue-500">
                          <div className="text-slate-500 text-xs mb-1">Platform (3%)</div>
                          <div className="text-blue-300 font-mono text-sm">{formatSol(settlement.toPlatform)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trading Volume Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 flex flex-col min-w-0">
                    <h3 className="text-lg font-bold text-white mb-6">Current TVL Comparison</h3>
                    <div className="flex-1 w-full min-h-0 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tvlData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={100} stroke="#94a3b8" fontSize={12} />
                          <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                            formatter={(value: number) => formatSol(value)}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {tvlData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Momentum Gauge */}
                  <MomentumGauge 
                    volA={battle.totalVolumeA} 
                    volB={battle.totalVolumeB} 
                    nameA={battle.artistA.name} 
                    nameB={battle.artistB.name} 
                    colorA={battle.artistA.color} 
                    colorB={battle.artistB.color} 
                  />
                </div>
              </div>

              {/* Right Column: Calculator & Fees */}
              <div className="space-y-8">
                <RoiCalculator battleState={battle} />

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                   <h3 className="text-lg font-bold text-white mb-4">Total Fee Revenue</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-slate-400 text-sm">Artist A Earned</span>
                        <span className="text-cyan-400 font-mono">{formatSol(settlement.artistAEarnings)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-slate-400 text-sm">Artist B Earned</span>
                        <span className="text-fuchsia-400 font-mono">{formatSol(settlement.artistBEarnings)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-400 text-sm">Platform Revenue</span>
                        <span className="text-indigo-400 font-mono">{formatSol(settlement.platformEarnings)}</span>
                      </div>
                   </div>
                   <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg text-xs text-indigo-300 leading-relaxed">
                     Fees are calculated from 1% volume + settlement bonuses.
                   </div>
                </div>

                {/* ON CHAIN DATA FOOTER */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-500 break-all space-y-2">
                    <div className="font-bold text-slate-400 mb-1">PROGRAM ADDRESSES</div>
                    <div>PDA: <span className="text-slate-300">{battle.battleAddress}</span></div>
                    {battle.treasuryWallet && <div>Treasury: <span className="text-slate-300">{battle.treasuryWallet}</span></div>}
                    {battle.onChainWalletA && <div>Wallet A: <span className="text-slate-300">{battle.onChainWalletA}</span></div>}
                    {battle.onChainWalletB && <div>Wallet B: <span className="text-slate-300">{battle.onChainWalletB}</span></div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
