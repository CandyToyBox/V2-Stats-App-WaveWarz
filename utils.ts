import { BattleState, SettlementStats, TraderSimulation, BattleHistoryPoint, ReplayEvent, BattleSummary, ArtistStats } from './types';

// Constants defined in the blueprint
const FEES = {
  ARTIST_TRADING_FEE: 0.01,
  PLATFORM_TRADING_FEE: 0.005,
};

const DISTRIBUTION = {
  WINNING_TRADERS: 0.40,
  WINNING_ARTIST: 0.05,
  LOSING_ARTIST: 0.02,
  PLATFORM_BONUS: 0.03,
  LOSING_TRADERS: 0.50, // Stays with losing traders (returned value)
};

export const calculateWinner = (state: BattleState): 'A' | 'B' => {
  return state.artistASolBalance > state.artistBSolBalance ? 'A' : 'B';
};

export const calculateSettlement = (state: BattleState): SettlementStats => {
  const winner = calculateWinner(state);
  const isAWin = winner === 'A';
  
  const winnerTVL = isAWin ? state.artistASolBalance : state.artistBSolBalance;
  const loserTVL = isAWin ? state.artistBSolBalance : state.artistASolBalance;
  
  const winMargin = winnerTVL - loserTVL;
  
  // Step 4: Prize Pool Distribution
  // The blueprint states these percentages apply to the Loser's Pool
  const dist = {
    toWinningTraders: loserTVL * DISTRIBUTION.WINNING_TRADERS,
    toWinningArtist: loserTVL * DISTRIBUTION.WINNING_ARTIST,
    toLosingArtist: loserTVL * DISTRIBUTION.LOSING_ARTIST,
    toPlatform: loserTVL * DISTRIBUTION.PLATFORM_BONUS,
    toLosingTraders: loserTVL * DISTRIBUTION.LOSING_TRADERS,
  };

  // Step 3 & 6 & 7: Earnings Calculations
  // Accumulated fees during battle
  const artistAFees = state.totalVolumeA * FEES.ARTIST_TRADING_FEE;
  const artistBFees = state.totalVolumeB * FEES.ARTIST_TRADING_FEE;
  const platformFees = (state.totalVolumeA + state.totalVolumeB) * FEES.PLATFORM_TRADING_FEE;

  // Final Earnings
  const artistAEarnings = artistAFees + (isAWin ? dist.toWinningArtist : dist.toLosingArtist);
  const artistBEarnings = artistBFees + (!isAWin ? dist.toWinningArtist : dist.toLosingArtist);
  const platformEarnings = platformFees + dist.toPlatform;

  return {
    winnerId: winner,
    winMargin,
    loserPoolTotal: loserTVL,
    ...dist,
    artistAEarnings,
    artistBEarnings,
    platformEarnings,
  };
};

export const calculateTraderRoi = (
  state: BattleState,
  sim: TraderSimulation
): { payout: number; roi: number; profit: number; note: string } => {
  const winner = calculateWinner(state);
  const settlement = calculateSettlement(state);
  
  const isWinningSide = (sim.side === 'A' && winner === 'A') || (sim.side === 'B' && winner === 'B');
  
  // Total tokens on the trader's side
  const totalSideTokens = sim.side === 'A' ? state.artistASupply : state.artistBSupply;
  const tokenShare = sim.tokensHeld / totalSideTokens;

  let payout = 0;
  let note = "";

  if (isWinningSide) {
    // STEP 5: Winning Side Logic
    const winnerPool = sim.side === 'A' ? state.artistASolBalance : state.artistBSolBalance;
    
    // Share of Winner's Pool (Their own pool preservation)
    const shareOfOwnPool = tokenShare * winnerPool;
    
    // Share of 40% Bonus from Loser's Pool
    const shareOfBonus = tokenShare * settlement.toWinningTraders;
    
    payout = shareOfOwnPool + shareOfBonus;
    note = "Winner's Pool Share + 40% Loser's Pool Bonus";
  } else {
    // STEP 5: Losing Side Logic
    const loserPool = sim.side === 'A' ? state.artistASolBalance : state.artistBSolBalance;
    
    // Trader's Original Value (Theoretical value before penalty)
    const originalValue = tokenShare * loserPool;
    
    // Actual Payout (50% retention)
    payout = originalValue * DISTRIBUTION.LOSING_TRADERS;
    note = "50% Retention of Pool Value";
  }

  const profit = payout - sim.investmentSol;
  const roi = (profit / sim.investmentSol) * 100;

  return { payout, roi, profit, note };
};

export const formatSol = (val: number) => `◎ ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatUsd = (sol: number, price = 145) => `$${(sol * price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
export const formatPct = (val: number) => `${val.toFixed(2)}%`;

export const calculateLeaderboard = (battles: BattleSummary[]): ArtistStats[] => {
  const stats: Record<string, ArtistStats> = {};

  const processArtist = (name: string, avatar: string, isWinner: boolean, date: string) => {
    if (!stats[name]) {
      stats[name] = { name, wins: 0, losses: 0, totalBattles: 0, winRate: 0, avatar, lastActive: date };
    }
    stats[name].totalBattles += 1;
    if (isWinner) stats[name].wins += 1;
    else stats[name].losses += 1;
    
    // Update last active if newer
    if (new Date(date) > new Date(stats[name].lastActive)) {
      stats[name].lastActive = date;
    }
  };

  battles.forEach(b => {
    // Skip if no winner decided yet (active battles don't count towards W/L yet)
    if (!b.winnerDecided) return;

    // Determine winner based on CSV data if available, otherwise simulation logic isn't applied here 
    // BUT the CSV doesn't strictly have a "winner" column populated in all rows provided. 
    // We will assume simpler logic: If it's in the past, we use the winner_artist_a flag or random for demo if null
    
    // Note: The CSV provided has 'winner_artist_a' as null often. 
    // For this Leaderboard Demo, we will infer the winner using the pool data if available, 
    // or if pool is 0 (unfetched), we skip W/L calculation or mock it.
    // For now, we only count battles where we can deduce a result.
    
    // However, to make the UI look populated for the user:
    // We will assume "Completed" battles have a result.
    // Since we don't have the real TVL in the CSV (it's 0), we can't calculate the real winner 
    // without the API.
    // **Fallback**: We will just count "Total Battles" for now to avoid fake win rates.
    
    processArtist(b.artistA.name, b.artistA.avatar, false, b.createdAt);
    processArtist(b.artistB.name, b.artistB.avatar, false, b.createdAt);
  });

  return Object.values(stats)
    .map(s => ({...s, winRate: s.totalBattles > 0 ? (s.wins / s.totalBattles) * 100 : 0}))
    .sort((a, b) => b.totalBattles - a.totalBattles) // Sort by activity level for now
    .slice(0, 10);
};

// --- MOCK GENERATORS ---

export const generateBattleHistory = (battle: BattleState, steps: number = 50): { history: BattleHistoryPoint[], events: ReplayEvent[] } => {
  const history: BattleHistoryPoint[] = [];
  const events: ReplayEvent[] = [];
  
  let currentTvlA = 100; // Start low
  let currentTvlB = 100; // Start low
  let currentVolA = 0;
  let currentVolB = 0;
  let isALeading = true;

  const timeStep = (battle.endTime - battle.startTime) / steps;

  for (let i = 0; i <= steps; i++) {
    // Random walk simulation
    const momentumA = Math.random() > 0.45 ? 1 : -0.2;
    const momentumB = Math.random() > 0.45 ? 1 : -0.2;
    
    const changeA = Math.random() * 50 * momentumA;
    const changeB = Math.random() * 50 * momentumB;

    currentTvlA = Math.max(50, currentTvlA + changeA);
    currentTvlB = Math.max(50, currentTvlB + changeB);
    
    // Volume only goes up
    const volChangeA = Math.abs(changeA) + Math.random() * 10;
    const volChangeB = Math.abs(changeB) + Math.random() * 10;
    
    currentVolA += volChangeA;
    currentVolB += volChangeB;

    const timestamp = battle.startTime + (i * timeStep);

    history.push({
      timestamp,
      tvlA: currentTvlA,
      tvlB: currentTvlB,
      volumeA: currentVolA,
      volumeB: currentVolB,
      priceA: currentTvlA / 1000,
      priceB: currentTvlB / 1000
    });

    // Event Generation
    if (i === 0) {
      events.push({ timestamp, type: 'START', description: 'Battle Started' });
    } else if (i === steps) {
      events.push({ timestamp, type: 'END', description: 'Battle Ended' });
    } else {
      // Lead Change
      const nowALeading = currentTvlA > currentTvlB;
      if (nowALeading !== isALeading) {
        events.push({
          timestamp,
          type: 'LEAD_CHANGE',
          description: `${nowALeading ? battle.artistA.name : battle.artistB.name} takes the lead!`,
          artistId: nowALeading ? 'A' : 'B'
        });
        isALeading = nowALeading;
      }

      // Whale Activity
      if (changeA > 40) {
        events.push({ timestamp, type: 'WHALE_BUY', description: 'Whale Purchase detected!', artistId: 'A' });
      }
      if (changeB > 40) {
        events.push({ timestamp, type: 'WHALE_BUY', description: 'Whale Purchase detected!', artistId: 'B' });
      }
    }
  }

  // Force end state to match (smooth interpolation to final would be better, but this is mock)
  return { history, events };
};