import { BattleState, ArtistLeaderboardStats, ArtistBattleRecord, BattleSummary } from '../types';
import { calculateTVLWinner } from '../utils';

// Constants
const SPOTIFY_PER_STREAM = 0.003; // $0.003 per stream
const TRADING_FEE_PCT = 0.01; // 1%
const WINNER_SETTLEMENT_PCT = 0.05; // 5% of Loser Pool
const LOSER_SETTLEMENT_PCT = 0.02; // 2% of Loser Pool

export async function fetchSolPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    const data = await response.json();
    return data.solana.usd || 180; // Fallback
  } catch (error) {
    console.warn('Failed to fetch SOL price, using fallback', error);
    return 180; // Conservative fallback
  }
}

function calculateBattleEarnings(
  battle: BattleState,
  artistSide: 'A' | 'B'
): { tradingFees: number; settlementFees: number; volume: number; result: 'WIN' | 'LOSS' } {
  // 1. Determine Volume on their side
  const volume = artistSide === 'A' ? battle.totalVolumeA : battle.totalVolumeB;
  
  // 2. Trading Fees (1% of volume)
  const tradingFees = volume * TRADING_FEE_PCT;

  // 3. Settlement Fees
  // Logic: 
  // If A wins, A gets 5% of B's Pool. B gets 2% of B's Pool.
  // If B wins, B gets 5% of A's Pool. A gets 2% of A's Pool.
  
  const winnerSide = calculateTVLWinner(battle);
  const isWinner = winnerSide === artistSide;
  const result = isWinner ? 'WIN' : 'LOSS';

  let settlementFees = 0;
  
  // Settlement comes from the LOSER'S POOL
  const loserPool = winnerSide === 'A' ? battle.artistBSolBalance : battle.artistASolBalance;

  if (isWinner) {
    settlementFees = loserPool * WINNER_SETTLEMENT_PCT;
  } else {
    settlementFees = loserPool * LOSER_SETTLEMENT_PCT;
  }

  return {
    tradingFees,
    settlementFees,
    volume,
    result
  };
}

export function aggregateArtistStats(
  battles: BattleState[], 
  solPrice: number
): ArtistLeaderboardStats[] {
  const map = new Map<string, ArtistLeaderboardStats>();

  const getOrInit = (artist: any): ArtistLeaderboardStats => {
    // Normalize name to handle potential minor discrepancies in CSV
    const key = artist.name.trim(); 
    if (!map.has(key)) {
      map.set(key, {
        artistName: artist.name,
        walletAddress: artist.wallet,
        avatar: artist.avatar,
        twitter: artist.twitter,
        musicLink: artist.musicLink,
        totalEarningsSol: 0,
        totalEarningsUsd: 0,
        spotifyStreamEquivalents: 0,
        battlesParticipated: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalVolumeGenerated: 0,
        bestBattleEarnings: 0,
        bestBattleOpponent: '',
        history: []
      });
    }
    return map.get(key)!;
  };

  battles.forEach(battle => {
    // Process Artist A
    const statsA = getOrInit(battle.artistA);
    const earningsA = calculateBattleEarnings(battle, 'A');
    const totalA = earningsA.tradingFees + earningsA.settlementFees;
    
    statsA.battlesParticipated++;
    if (earningsA.result === 'WIN') statsA.wins++; else statsA.losses++;
    statsA.totalVolumeGenerated += earningsA.volume;
    statsA.totalEarningsSol += totalA;
    statsA.history.push({
      battleId: battle.battleId,
      opponentName: battle.artistB.name,
      date: battle.createdAt,
      result: earningsA.result,
      volumeGenerated: earningsA.volume,
      tradingFees: earningsA.tradingFees,
      settlementFees: earningsA.settlementFees,
      totalEarnings: totalA
    });
    
    if (totalA > statsA.bestBattleEarnings) {
        statsA.bestBattleEarnings = totalA;
        statsA.bestBattleOpponent = battle.artistB.name;
    }

    // Process Artist B
    const statsB = getOrInit(battle.artistB);
    const earningsB = calculateBattleEarnings(battle, 'B');
    const totalB = earningsB.tradingFees + earningsB.settlementFees;
    
    statsB.battlesParticipated++;
    if (earningsB.result === 'WIN') statsB.wins++; else statsB.losses++;
    statsB.totalVolumeGenerated += earningsB.volume;
    statsB.totalEarningsSol += totalB;
    statsB.history.push({
      battleId: battle.battleId,
      opponentName: battle.artistA.name,
      date: battle.createdAt,
      result: earningsB.result,
      volumeGenerated: earningsB.volume,
      tradingFees: earningsB.tradingFees,
      settlementFees: earningsB.settlementFees,
      totalEarnings: totalB
    });

    if (totalB > statsB.bestBattleEarnings) {
        statsB.bestBattleEarnings = totalB;
        statsB.bestBattleOpponent = battle.artistA.name;
    }
  });

  // Final Calculations (USD, Spotify, Win Rate)
  const results = Array.from(map.values()).map(stats => {
     stats.winRate = (stats.wins / stats.battlesParticipated) * 100;
     stats.totalEarningsUsd = stats.totalEarningsSol * solPrice;
     stats.spotifyStreamEquivalents = Math.floor(stats.totalEarningsUsd / SPOTIFY_PER_STREAM);
     
     // Sort history by date descending
     stats.history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     
     return stats;
  });

  // Sort by Total Earnings Descending
  return results.sort((a, b) => b.totalEarningsSol - a.totalEarningsSol);
}