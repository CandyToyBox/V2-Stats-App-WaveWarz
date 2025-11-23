
import { BattleState, BattleSummary, RecentTrade } from '../types';
import { PublicKey, Connection } from '@solana/web3.js';

// --- CONFIGURATION ---
const HELIUS_API_KEY = "8b84d8d3-59ad-4778-829b-47db8a9149fa";
const PROGRAM_ID = new PublicKey("9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo");
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const BATTLE_SEED = 'battle';
const VAULT_SEED = 'battle_vault';

// --- CACHING SYSTEM ---
interface CacheEntry {
  data: BattleState;
  timestamp: number;
}
const battleCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30_000; // 30 seconds cache

// --- HELPERS ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rate Limited Fetch Wrapper
async function fetchWithRetry(url: string, options?: RequestInit, retries = 2, backoff = 500): Promise<any> {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      if (retries <= 0) throw new Error("Rate limit exceeded");
      console.warn(`Rate limited. Retrying in ${backoff}ms...`);
      await sleep(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    if (retries <= 0) throw err;
    await sleep(backoff);
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

// --- 1. PDA DERIVATION ---

export const deriveBattlePDA = (battleId: string | number): PublicKey => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(battleId), true); 
  
  const [pda] = PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode(BATTLE_SEED),
      new Uint8Array(buffer)
    ],
    PROGRAM_ID
  );
  return pda;
};

export const deriveBattleVaultPDA = (battleId: string | number): PublicKey => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(battleId), true); 
  
  const [pda] = PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode(VAULT_SEED),
      new Uint8Array(buffer)
    ],
    PROGRAM_ID
  );
  return pda;
};

// --- 2. ACCOUNT DECODING ---

function decodeBattleAccount(data: Uint8Array, summary: BattleSummary): Partial<BattleState> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 8; // Skip Discriminator

  const onChainBattleId = view.getBigUint64(offset, true); offset += 8;
  offset += 4; // bumps

  const startTime = Number(view.getBigInt64(offset, true)); offset += 8;
  const endTime = Number(view.getBigInt64(offset, true)); offset += 8;

  offset += 32 * 5; // Wallets and mints

  const artistASupply = Number(view.getBigUint64(offset, true)) / 1_000_000; offset += 8;
  const artistBSupply = Number(view.getBigUint64(offset, true)) / 1_000_000; offset += 8;

  const artistASolBalance = Number(view.getBigUint64(offset, true)) / 1_000_000_000; offset += 8;
  const artistBSolBalance = Number(view.getBigUint64(offset, true)) / 1_000_000_000; offset += 8;

  offset += 16; // Internal pools

  const winnerArtistA = view.getUint8(offset) === 1; offset += 1;
  const winnerDecided = view.getUint8(offset) === 1; offset += 1;

  offset += 1; // transaction_state
  offset += 1; // is_initialized

  const isActive = view.getUint8(offset) === 1; offset += 1;

  const totalDistribution = Number(view.getBigUint64(offset, true)) / 1_000_000_000; offset += 8;

  return {
    startTime: startTime * 1000,
    endTime: endTime * 1000,
    isEnded: !isActive || (Date.now() > endTime * 1000),
    artistASolBalance,
    artistBSolBalance,
    artistASupply,
    artistBSupply,
    winnerDecided,
  };
}

// --- 3. HELIUS FETCHING ---

export async function fetchBattleOnChain(summary: BattleSummary, forceRefresh = false): Promise<BattleState> {
  // A. Check Cache
  const cached = battleCache.get(summary.battleId);
  if (!forceRefresh && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  const connection = new Connection(RPC_URL);
  const battlePda = deriveBattlePDA(summary.battleId);
  const vaultPda = deriveBattleVaultPDA(summary.battleId);

  // B. Fetch Account Info (RPC)
  const accountInfo = await connection.getAccountInfo(battlePda);
  
  if (!accountInfo) {
    console.warn("Battle Account not found on-chain.");
    return {
      ...summary,
      startTime: Date.now(),
      endTime: Date.now() + summary.battleDuration * 1000,
      isEnded: false,
      artistASolBalance: 0,
      artistBSolBalance: 0,
      artistASupply: 0,
      artistBSupply: 0,
      totalVolumeA: 0,
      totalVolumeB: 0,
      tradeCount: 0,
      uniqueTraders: 0,
      recentTrades: []
    };
  }

  const chainData = decodeBattleAccount(accountInfo.data, summary);

  // C. Fetch Transaction History (Graceful Fallback)
  let historyStats = { volumeA: 0, volumeB: 0, tradeCount: 0, uniqueTraders: 0, recentTrades: [] as RecentTrade[] };
  try {
    historyStats = await fetchTransactionStats(battlePda.toBase58(), vaultPda.toBase58(), chainData.artistASolBalance || 0, chainData.artistBSolBalance || 0);
  } catch (e) {
    console.error("History fetch failed, returning partial data", e);
    // Return what we have from account data, zeroing out volume to prevent UI errors
  }

  const result: BattleState = {
    ...summary,
    ...chainData,
    artistASolBalance: chainData.artistASolBalance ?? 0,
    artistBSolBalance: chainData.artistBSolBalance ?? 0,
    startTime: chainData.startTime ?? Date.now(),
    endTime: chainData.endTime ?? Date.now(),
    isEnded: chainData.isEnded ?? false,
    artistASupply: chainData.artistASupply ?? 0,
    artistBSupply: chainData.artistBSupply ?? 0,
    totalVolumeA: historyStats.volumeA,
    totalVolumeB: historyStats.volumeB,
    tradeCount: historyStats.tradeCount,
    uniqueTraders: historyStats.uniqueTraders,
    recentTrades: historyStats.recentTrades
  };

  // Update Cache
  battleCache.set(summary.battleId, { data: result, timestamp: Date.now() });

  return result;
}

// --- 4. TRANSACTION PARSING ---

async function fetchTransactionStats(battleAddress: string, vaultAddress: string, tvlA: number, tvlB: number) {
  let volumeA = 0;
  let volumeB = 0;
  let tradeCount = 0;
  const traders = new Set<string>();
  const recentTrades: RecentTrade[] = [];
  
  let beforeSignature = "";
  let hasMore = true;
  const LIMIT = 100; // Limit fetch for performance in demo
  let fetchedCount = 0;

  // Calculate domination ratio for heuristic volume split
  const totalTvl = tvlA + tvlB || 1;
  const ratioA = tvlA / totalTvl;

  while (hasMore && fetchedCount < LIMIT) {
    const query = `&limit=50${beforeSignature ? `&before=${beforeSignature}` : ''}`;
    const url = `https://api-mainnet.helius-rpc.com/v0/addresses/${battleAddress}/transactions/?api-key=${HELIUS_API_KEY}${query}`;
    
    const txs = await fetchWithRetry(url);
    
    if (!txs || txs.length === 0) {
      hasMore = false;
      break;
    }

    for (const tx of txs) {
      if (tx.nativeTransfers) {
        let txVal = 0;
        let isBuy = false;
        let trader = '';

        for (const transfer of tx.nativeTransfers) {
           if (transfer.toUserAccount === vaultAddress || transfer.toUserAccount === battleAddress) {
             // BUY
             txVal += transfer.amount / 1_000_000_000;
             trader = transfer.fromUserAccount;
             traders.add(transfer.fromUserAccount);
             isBuy = true;
           } else if (transfer.fromUserAccount === vaultAddress || transfer.fromUserAccount === battleAddress) {
             // SELL
             txVal += transfer.amount / 1_000_000_000;
             trader = transfer.toUserAccount;
             traders.add(transfer.toUserAccount);
             isBuy = false;
           }
        }

        if (txVal > 0 && trader) {
          tradeCount++;
          // Heuristic accumulation
          volumeA += txVal; 

          // Add to recent trades list
          if (recentTrades.length < 20) {
            recentTrades.push({
              signature: tx.signature,
              amount: txVal,
              artistId: 'Unknown', // We refine this in UI based on lead
              type: isBuy ? 'BUY' : 'SELL',
              timestamp: tx.timestamp * 1000,
              trader
            });
          }
        }
      }
      beforeSignature = tx.signature;
    }
    
    fetchedCount += txs.length;
    if (txs.length < 50) hasMore = false;
  }

  // Split accumulated volume based on TVL ratio
  return {
    volumeA: volumeA * ratioA, 
    volumeB: volumeA * (1 - ratioA),
    tradeCount,
    uniqueTraders: traders.size,
    recentTrades
  };
}
