
export interface Artist {
  id: string;
  name: string;
  color: string;
  avatar: string; // From image_url or generated
  wallet: string;
  mint?: string;
  twitter?: string;
  musicLink?: string;
}

export interface BattleSummary {
  id: string; // The UUID
  battleId: string; // The numeric ID (174...)
  createdAt: string;
  status: string;
  artistA: Artist;
  artistB: Artist;
  battleDuration: number;
  winnerDecided: boolean;
  imageUrl: string;
  streamLink?: string;
  
  // New fields from updated CSV
  creatorWallet?: string;
  isCommunityBattle?: boolean;
  communityRoundId?: string;
}

export interface RecentTrade {
  signature: string;
  amount: number;
  artistId: 'A' | 'B' | 'Unknown';
  type: 'BUY' | 'SELL';
  timestamp: number;
  trader: string;
}

export interface BattleState extends BattleSummary {
  startTime: number;
  endTime: number;
  isEnded: boolean;
  
  // Dynamic Chain Data (Fetched from Blockchain)
  artistASolBalance: number; // TVL A
  artistBSolBalance: number; // TVL B
  artistASupply: number;
  artistBSupply: number;
  
  // Real On-Chain Addresses (Decoded from PDA)
  battleAddress: string;     // The PDA of the battle
  onChainMintA?: string;
  onChainMintB?: string;
  onChainWalletA?: string;
  onChainWalletB?: string;
  treasuryWallet?: string;

  // Transaction Accumulators
  totalVolumeA: number;
  totalVolumeB: number;
  tradeCount: number;
  uniqueTraders: number;
  
  // New: List of actual trades for the ticker
  recentTrades: RecentTrade[];
}

export interface BattleHistoryPoint {
  timestamp: number;
  tvlA: number;
  tvlB: number;
  volumeA: number;
  volumeB: number;
  priceA: number;
  priceB: number;
}

export interface ReplayEvent {
  timestamp: number;
  type: 'LEAD_CHANGE' | 'WHALE_BUY' | 'WHALE_SELL' | 'START' | 'END';
  description: string;
  artistId?: 'A' | 'B';
}

export interface SettlementStats {
  winnerId: string;
  winMargin: number;
  loserPoolTotal: number;
  
  // Distribution (Absolute SOL values)
  toWinningTraders: number;
  toWinningArtist: number;
  toLosingArtist: number;
  toPlatform: number;
  toLosingTraders: number;
  
  // Artist Earnings
  artistAEarnings: number;
  artistBEarnings: number;
  platformEarnings: number;
}

export interface TraderSimulation {
  side: 'A' | 'B';
  investmentSol: number;
  tokensHeld: number;
}

export interface ArtistStats {
  name: string;
  wins: number;
  losses: number;
  totalBattles: number;
  winRate: number;
  avatar: string;
  lastActive: string;
  
  // New Advanced Stats
  totalVolume: number; // Total SOL volume generated in their battles
  totalTVL: number;    // Peak TVL across all battles
  biggestWin: number;  // Largest single battle TVL
}
