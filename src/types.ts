/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Card {
  id: string; // Unique ID (e.g. card_001_id)
  templateId: string; // ID of the template in the database (e.g. card_001)
  name: string;
  cost: number;
  type: 'minion' | 'spell' | 'weapon';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  atk?: number; // minion, weapon
  hp?: number; // minion initial hp
  maxHp?: number; // minion current upper bound
  durability?: number; // weapon durability
  keywords?: string[]; // 'Taunt' (도발), 'Charge' (돌진), 'Battlecry' (전투의 함성), 'Deathrattle' (죽음의 메아리), 'Divine Shield' (천상의 보호막)
  description: string;
  effectId?: string;
  effectValue?: number;
}

export interface BoardMinion {
  id: string; // Runs unique id
  templateId: string;
  name: string;
  cost: number;
  maxHp: number;
  currentHp: number;
  atk: number;
  keywords: string[];
  hasDivineShield: boolean;
  canAttack: boolean; // false on first turn unless has Charge
  isAsleep: boolean; // true on turn played (unless Charge)
  hasAttackedThisTurn: boolean;
  deathrattleValue?: number;
  deathrattleEffect?: string;
}

export interface WeaponState {
  name: string;
  templateId: string;
  atk: number;
  durability: number;
}

export interface QuestState {
  id: string;
  templateId: string;
  name: string;
  progress: number;
  target: number;
  description: string;
  rewardName: string;
  rewardTemplateId: string;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  armor: number; // 방어도
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: BoardMinion[];
  weapon: WeaponState | null;
  hasAttackedThisTurn: boolean;
  usedHeroPower: boolean; // 이번 턴에 영웅 무기/능력 사용 여부
  fatigueCount: number;
  cardDrawnCount: number;
  heroClass: 'Mage' | 'Priest' | 'Paladin' | 'Hunter' | 'Warrior';
  activeQuest?: QuestState | null;
}

export interface GameLog {
  id: string;
  timestamp: string;
  turn: number;
  speaker: 'SYSTEM' | 'PLAYER' | 'AI' | 'GM';
  text: string;
}

export type GamePhase = 'START_SCREEN' | 'DRAFT_MODE_SELECT' | 'DRAFT_PACHAGE_PHASE' | 'DRAFT_ARENA_PHASE' | 'DECK_BUILDER_PHASE' | 'MULLIGAN_PHASE' | 'PLAY_PHASE' | 'GAME_OVER';

export interface DraftChoice {
  cards: Card[];
}

export interface AppState {
  phase: GamePhase;
  player: PlayerState;
  ai: PlayerState;
  turn: number; // Current turn overall
  whosTurn: 'player' | 'ai'; // Whos turn is it active right now
  logs: GameLog[];
  roundSelected: number; // For drafting, 1 to 10 for package, or 1 to 30 for Arena
  draftChoices: Card[][]; // Current three choices available elements
  playerChosenDeck: string; // Name of deck Chosen
  winner: 'player' | 'ai' | null;
  selectedActionCardIndex: number | null; // Selected hand card index for casting/playing
  selectedAttackerId: string | null; // BoardMinion.id or 'player_hero'
  targetingMode: 'none' | 'spell' | 'battlecry' | 'attack' | 'weapon' | 'hero_power';
  targetingSourceIndex?: number; // hand index for play targets
  targetingAttackerId?: string; // attacker minion id or hero
  isPlayerFirst?: boolean;
  gameMode?: 'prebuilt' | 'package' | 'arena' | 'tavern_brawl' | 'boss_fight';
}
