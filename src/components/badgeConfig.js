import {
  Users, Swords, Zap, Medal, Gem, Flame, Shield, Crown, Target,
  Award, TrendingUp, Gift, Star, Sparkles, Check
} from 'lucide-react';

// Achievement badges (badge:* prefix)
export const achievementBadges = {
  first_recruit: { icon: Users, label: 'First Recruit', color: '#CD7F32', stars: 1 },
  squad_leader: { icon: Swords, label: 'Squad Leader', color: '#137DFE', stars: 1 },
  daily_duty: { icon: Zap, label: 'Daily Duty', color: '#F6AF01', stars: 1 },
  platoon_leader: { icon: Medal, label: 'Platoon Leader', color: '#C0C0C0', stars: 2 },
  whale_spotter: { icon: Gem, label: 'Whale Spotter', color: '#137DFE', stars: 1 },
  dedicated: { icon: Flame, label: 'Dedicated', color: '#F6AF01', stars: 2 },
  battalion_leader: { icon: Medal, label: 'Battalion Leader', color: '#F6AF01', stars: 2 },
  chain_of_command: { icon: Target, label: 'Chain of Command', color: '#650CD4', stars: 2 },
  iron_will: { icon: Shield, label: 'Iron Will', color: '#08AA09', stars: 2 },
  whale_hunter: { icon: Gem, label: 'Whale Hunter', color: '#650CD4', stars: 3 },
  army_commander: { icon: Crown, label: 'Army Commander', color: '#650CD4', stars: 3 },
  war_hero: { icon: Swords, label: 'War Hero', color: '#F6AF01', stars: 3 },
  supreme: { icon: Crown, label: 'Supreme', color: '#F6AF01', stars: 3 },
  early_adopter: { icon: Zap, label: 'Early Adopter', color: '#08AA09', stars: 1 },
  top_trader: { icon: TrendingUp, label: 'Top Trader', color: '#137DFE', stars: 2 },
  whale: { icon: Gem, label: 'Whale', color: '#650CD4', stars: 3 },
  og: { icon: Medal, label: 'OG', color: '#F6AF01', stars: 2 },
  contributor: { icon: Gift, label: 'Contributor', color: '#08AA09', stars: 1 },
  army_general: { icon: Crown, label: 'Army General', color: '#650CD4', stars: 3 },
};

// Tier config (for profile display)
export const tierConfig = {
  admin: { icon: Shield, bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  moderator: { icon: Shield, bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  verified: { icon: Check, bg: 'bg-gradient-to-r from-[#FFD700]/10 via-[#FF6B9D]/10 to-[#00FFFF]/10', text: 'text-white', border: 'border-[#FFD700]/30', gradient: true },
  diamond: { icon: Gem, bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  nova: { icon: Star, bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  vip: { icon: Sparkles, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'private': { icon: Crown, bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

// Rank styles
export const rankStyles = {
  recruit: { bg: 'bg-white/5', text: 'text-white/50', border: 'border-white/10' },
  'private': { bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/15' },
  corporal: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  sergeant: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  captain: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  colonel: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  general: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  supreme: { bg: 'bg-gradient-to-r from-[#FFD700]/10 via-[#FF6B9D]/10 to-[#00FFFF]/10', text: 'text-white', border: 'border-[#FFD700]/30', gradient: true },
};

// Known roles (admin-granted)
export const knownRoles = ['admin', 'moderator'];

// Known tiers (purchased)
export const knownTiers = ['vip', 'nova', 'diamond', 'verified'];

export const defaultBadge = { icon: Award, label: 'Badge', color: '#888', stars: 0 };
