
import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { BattleState } from '../types';
import { formatSol } from '../utils';

interface Props {
  battle: BattleState;
}

export const ShareButton: React.FC<Props> = ({ battle }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const winner = battle.artistASolBalance > battle.artistBSolBalance ? battle.artistA.name : battle.artistB.name;
    const text = `🌊 WaveWarz Analytics Update!\n\n⚔️ ${battle.artistA.name} vs ${battle.artistB.name}\n\n🏆 Leader: ${winner}\n💰 TVL A: ${formatSol(battle.artistASolBalance)}\n💰 TVL B: ${formatSol(battle.artistBSolBalance)}\n📊 Vol: ${formatSol(battle.totalVolumeA + battle.totalVolumeB)}\n\nCheck the analytics live! #WaveWarz #Solana`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
      {copied ? 'Copied!' : 'Share Stats'}
    </button>
  );
};
