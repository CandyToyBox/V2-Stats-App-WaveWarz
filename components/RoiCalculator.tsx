import React, { useState, useEffect } from 'react';
import { BattleState, TraderSimulation } from '../types';
import { calculateTraderRoi, formatPct, formatSol } from '../utils';
import { Calculator, ArrowRight, Coins } from 'lucide-react';

interface Props {
  battleState: BattleState;
}

export const RoiCalculator: React.FC<Props> = ({ battleState }) => {
  const [side, setSide] = useState<'A' | 'B'>('A');
  const [investment, setInvestment] = useState<number>(10); // SOL
  
  // Mock price derivation for estimation
  const supply = side === 'A' ? battleState.artistASupply : battleState.artistBSupply;
  const pool = side === 'A' ? battleState.artistASolBalance : battleState.artistBSolBalance;
  // Simple assumed price = pool / supply for simulation
  const assumedPrice = pool / supply; 
  const tokensHeld = investment / assumedPrice;

  const sim: TraderSimulation = {
    side,
    investmentSol: investment,
    tokensHeld,
  };

  const result = calculateTraderRoi(battleState, sim);
  const isProfit = result.profit >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <Calculator className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-white">Settlement Simulator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-uppercase text-slate-500 mb-1">Select Side</label>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSide('A')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                  side === 'A' 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Artist A
              </button>
              <button
                onClick={() => setSide('B')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                  side === 'B' 
                    ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Artist B
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-uppercase text-slate-500 mb-1">Investment Amount (SOL)</label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={investment}
                onChange={(e) => setInvestment(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 pl-10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Coins className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Est. Tokens:</span>
              <span className="font-mono text-slate-300">{tokensHeld.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Share of Pool:</span>
              <span className="font-mono text-slate-300">{((tokensHeld / supply) * 100).toFixed(4)}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className={`p-4 rounded-xl border-2 ${isProfit ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="text-center mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Projected Return</span>
            </div>
            <div className={`text-3xl font-bold text-center mb-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {formatPct(result.roi)}
            </div>
            <div className="text-center text-slate-300 font-mono text-sm mb-4">
              {formatSol(result.payout)}
            </div>
            
            <div className="space-y-2 border-t border-slate-700/50 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Initial:</span>
                <span className="text-slate-200">{formatSol(investment)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Net PnL:</span>
                <span className={isProfit ? 'text-green-400' : 'text-red-400'}>
                  {isProfit ? '+' : ''}{formatSol(result.profit)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded-full border border-slate-800">
              {result.note}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};