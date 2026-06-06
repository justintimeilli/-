/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, BoardMinion, PlayerState, WeaponState, GameLog, GamePhase, AppState } from './types';
import { CARD_POOL, PREBUILT_AGGRO_DECK, PREBUILT_MIDRANGE_DECK, PREBUILT_CONTROL_DECK } from './cardsData';
import { createInitialState, generateId, drawCardFor, hasTauntMinion, computeRuleBasedAITurn } from './gameLogic';
import { playSound } from './utils/audio';
import { RulebookModal } from './components/RulebookModal';
import { 
  Shield, Heart, Zap, Sword, Terminal, RotateCw, Volume2, Play, Square, 
  Layers, ArrowRight, BookOpen, Crown, LogOut, Compass, Skull, User, Sparkles, Send,
  Search, Trash2, X
} from 'lucide-react';

export default function App() {
  // Main Game State representer
  const [state, setState] = useState<AppState>({
    phase: 'START_SCREEN',
    player: {
      hp: 30, maxHp: 30, armor: 0, mana: 1, maxMana: 1, deck: [], hand: [], board: [], weapon: null, hasAttackedThisTurn: false, usedHeroPower: false, fatigueCount: 0, cardDrawnCount: 0, heroClass: 'Mage'
    },
    ai: {
      hp: 30, maxHp: 30, armor: 0, mana: 1, maxMana: 1, deck: [], hand: [], board: [], weapon: null, hasAttackedThisTurn: false, usedHeroPower: false, fatigueCount: 0, cardDrawnCount: 0, heroClass: 'Hunter'
    },
    turn: 1,
    whosTurn: 'player',
    logs: [],
    roundSelected: 0,
    draftChoices: [],
    playerChosenDeck: '',
    winner: null,
    selectedActionCardIndex: null,
    selectedAttackerId: null,
    targetingMode: 'none'
  });

  // CLI Command input state
  const [cliInput, setCliInput] = useState('');
  // Class selection states for the current setup
  const [selectedPlayerClass, setSelectedPlayerClass] = useState<'Mage' | 'Priest' | 'Paladin' | 'Hunter' | 'Warrior'>('Mage');
  const [selectedAiClass, setSelectedAiClass] = useState<'Mage' | 'Priest' | 'Paladin' | 'Hunter' | 'Warrior'>('Hunter');
  // Custom draft selections assembly pool for player
  const [customDraftDeck, setCustomDraftDeck] = useState<Card[]>([]);
  // Custom deck builder state
  const [customBuilderDeck, setCustomBuilderDeck] = useState<Card[]>([]);
  const [builderSearch, setBuilderSearch] = useState('');
  const [builderCostFilter, setBuilderCostFilter] = useState<'all' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7+'>('all');
  const [builderTypeFilter, setBuilderTypeFilter] = useState<'all' | 'minion' | 'spell' | 'weapon'>('all');
  const [builderRarityFilter, setBuilderRarityFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  // loading indicator
  const [isAiLoading, setIsAiLoading] = useState(false);
  // coaching feedback state
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [coachLoading, setCoachLoading] = useState(false);

  // Mulligan replacement tracker
  const [mulliganReplaces, setMulliganReplaces] = useState<boolean[]>([false, false, false, false]);

  // Rulebook overlay toggle state
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);

  // References
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const isAiRunningRef = useRef(false);

  // Keep terminal scrolled
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs]);

  // Immediate Game Over check when HP <= 0 (상대 영웅 혹은 플레이어 영웅 피가 0 이하가 되는 즉시 게임 종료 검출)
  useEffect(() => {
    if (state.phase === 'PLAY_PHASE') {
      if (state.player.hp <= 0 || state.ai.hp <= 0) {
        let winner: 'player' | 'ai' = 'player';
        let winnerName: string | undefined = undefined;
        if (state.player.hp <= 0 && state.ai.hp <= 0) {
          winner = 'ai';
          winnerName = '적과의 처참한 무승부!';
          playSoundEffect('defeat');
        } else if (state.player.hp <= 0) {
          winner = 'ai';
          playSoundEffect('defeat');
        } else {
          winner = 'player';
          playSoundEffect('victory');
        }
        
        setState(prev => {
          if (prev.phase === 'GAME_OVER') return prev;
          
          const finalLogs = [...prev.logs];
          finalLogs.push({
            id: generateId('system_death'),
            timestamp: new Date().toLocaleTimeString(),
            turn: prev.turn,
            speaker: 'GM',
            text: `📢 생명력이 다한 영웅이 쓰러집니다! 마나 워즈 대전이 종결되었습니다. 최종 승리자: [${winner === 'player' ? '플레이어님' : '상대편 AI'}]!`
          });

          return {
            ...prev,
            phase: 'GAME_OVER',
            winner,
            winnerName,
            logs: finalLogs
          };
        });
      }
    }
  }, [state.player.hp, state.ai.hp, state.phase]);

  // Append SYSTEM message logs helper
  function addLog(text: string, speaker: 'SYSTEM' | 'PLAYER' | 'AI' | 'GM') {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: GameLog = {
      id: generateId('log'),
      timestamp,
      turn: state.turn,
      speaker,
      text
    };
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog]
    }));
  }

  // SOUND TRIGGER FUNCTION WRAPPER
  const playSoundEffect = (type: 'draw' | 'play_minion' | 'play_spell' | 'play_weapon' | 'combat' | 'error' | 'victory' | 'defeat' | 'turn_end') => {
    playSound(type);
  };

  // Helper to apply damage to a hero taking Armor into consideration
  const damageHero = (player: PlayerState, amount: number): { hpLost: number; armorLost: number } => {
    let armorLost = 0;
    let hpLost = 0;
    if (player.armor > 0) {
      if (player.armor >= amount) {
        player.armor -= amount;
        armorLost = amount;
      } else {
        armorLost = player.armor;
        const remainder = amount - player.armor;
        player.armor = 0;
        player.hp -= remainder;
        hpLost = remainder;
      }
    } else {
      player.hp -= amount;
      hpLost = amount;
    }
    return { hpLost, armorLost };
  };

  /**
   * Core Game Loop Actions & Rules
   */

  // Phase controller: select prebuilt deck
  const handleSelectPrebuilt = (deckType: 'aggro' | 'midrange' | 'control') => {
    let deck: Card[] = [];
    let name = '';
    
    if (deckType === 'aggro') {
      deck = [...PREBUILT_AGGRO_DECK];
      name = '위니 어그로 (Aggro)';
    } else if (deckType === 'midrange') {
      deck = [...PREBUILT_MIDRANGE_DECK];
      name = '미드레인지 (Midrange)';
    } else {
      deck = [...PREBUILT_CONTROL_DECK];
      name = '장막 컨트롤 (Control)';
    }

    // AI deck generation (random balanced mix)
    const aiDeck = generateRandomDeck();
    const initialState = createInitialState(deck, aiDeck, name, 'prebuilt', selectedPlayerClass, selectedAiClass);
    setState(initialState);
    playSoundEffect('victory');
  };

  function generateRandomDeck(): Card[] {
    const deck: Card[] = [];
    // select 40 random cards
    for (let i = 0; i < 40; i++) {
      const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      deck.push(card);
    }
    return deck;
  }

  // Handle Tavern Brawl Mode [마나 폭풍] - Start immediately with 10 max mana and a random 40-card deck
  const handleStartTavernBrawl = () => {
    const playerDeck = generateRandomDeck();
    const aiDeck = generateRandomDeck();
    const initialState = createInitialState(playerDeck, aiDeck, '선술집 난투 [마나 풍풍]', 'tavern_brawl', selectedPlayerClass, selectedAiClass);
    setState(initialState);
    playSoundEffect('victory');
  };

  // Handle Solo Boss Fight Mode [리치 왕 보스전] - Prebuilt mid vs Boss (45 HP + frostmourne)
  const handleStartBossFight = () => {
    const playerDeck = [...PREBUILT_MIDRANGE_DECK];
    const aiDeck = [...PREBUILT_CONTROL_DECK];
    
    // Supplement several Frostmourne and Tirion Fordring cards for Lich King
    const frostmourne = CARD_POOL.find(c => c.id === 'w_frostmourne') || CARD_POOL[0];
    const tirion = CARD_POOL.find(c => c.id === 'm_tirion_fordring') || CARD_POOL[0];
    
    // Inject at random positions
    aiDeck.splice(3, 1, frostmourne);
    aiDeck.splice(12, 1, tirion);
    aiDeck.splice(23, 1, frostmourne);

    const initialState = createInitialState(playerDeck, aiDeck, '1인 모험 모드 [보스: 리치 왕]', 'boss_fight', selectedPlayerClass, 'Warrior');
    setState(initialState);
    playSoundEffect('defeat'); // Intense start sound!
  };

  // --- 나만의 자유 40장 커스텀 덱 빌더 기능구현 (New Custom Deck Builder handlers) ---
  const handleAddCardToBuilder = (card: Card) => {
    const currentCount = customBuilderDeck.filter(c => c.id === card.id).length;
    let limit = 2;
    if (card.rarity === 'legendary') {
      limit = 1;
    }
    
    if (customBuilderDeck.length >= 40) {
      playSoundEffect('error');
      return;
    }
    
    if (currentCount >= limit) {
      playSoundEffect('error');
      return;
    }

    playSoundEffect('draw');
    setCustomBuilderDeck(prev => [...prev, card]);
  };

  const handleRemoveCardFromBuilder = (cardId: string) => {
    const index = customBuilderDeck.findIndex(c => c.id === cardId);
    if (index !== -1) {
      playSoundEffect('play_spell');
      const nextDeck = [...customBuilderDeck];
      nextDeck.splice(index, 1);
      setCustomBuilderDeck(nextDeck);
    }
  };

  const handleRandomFillBuilder = () => {
    playSoundEffect('draw');
    const remainingCount = 40 - customBuilderDeck.length;
    if (remainingCount <= 0) return;
    
    const additions: Card[] = [];
    for (let i = 0; i < remainingCount; i++) {
      const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      additions.push(card);
    }
    setCustomBuilderDeck(prev => [...prev, ...additions]);
  };

  const handleStartCustomBuilderBattle = () => {
    if (customBuilderDeck.length !== 40) {
      playSoundEffect('error');
      return;
    }
    
    const playerDeck = [...customBuilderDeck];
    const aiDeck = generateRandomDeck();
    
    const initialState = createInitialState(
      playerDeck, 
      aiDeck, 
      '나만의 자유 40장 커스텀 덱', 
      'prebuilt', 
      selectedPlayerClass, 
      selectedAiClass
    );
    
    setState(initialState);
    playSoundEffect('victory');
  };

  // Option 2: Choose Custom Draft (10 Rounds * 4 cards pack, or 40 Rounds Arena style)
  const startDraftPhase = (type: 'package' | 'arena') => {
    setCustomDraftDeck([]);
    let firstRoundChoices: Card[] = [];
    
    if (type === 'package') {
      firstRoundChoices = getRandomThreeThemes();
      setState(prev => ({
        ...prev,
        phase: 'DRAFT_PACHAGE_PHASE',
        roundSelected: 1,
        draftChoices: [firstRoundChoices],
        logs: [{
          id: generateId('init'),
          timestamp: new Date().toLocaleTimeString(),
          turn: 0,
          speaker: 'GM',
          text: '✨ 10라운드 테마 패키지 드래프트를 시작합니다! (라운드당 4장의 세트 카드 뭉치 선택, 총 40장)'
        }]
      }));
      triggerCoachAdvice(firstRoundChoices, [], 1);
    } else {
      firstRoundChoices = getRandomThreeCards();
      setState(prev => ({
        ...prev,
        phase: 'DRAFT_ARENA_PHASE',
        roundSelected: 1,
        draftChoices: [firstRoundChoices],
        logs: [{
          id: generateId('init'),
          timestamp: new Date().toLocaleTimeString(),
          turn: 0,
          speaker: 'GM',
          text: '🦁 40라운드 아레나 드래프트를 시작합니다! 매 라운드 3가지 제안 중 1장을 선별하여 총 40장의 덱을 꾸리십시오.'
        }]
      }));
      triggerCoachAdvice(firstRoundChoices, [], 1);
    }
  };

  // Get 3 random cards for Arena
  function getRandomThreeCards(): Card[] {
    const choices: Card[] = [];
    while (choices.length < 3) {
      const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      if (!choices.some(c => c.id === card.id)) {
        choices.push({ ...card, id: generateId('draft_opt') });
      }
    }
    return choices;
  }

  // Get 3 random theme packs (containing 3 cards each, but let's represent them as single bundles for picking)
  function getRandomThreeThemes(): Card[] {
    // Generate themed packages of 3 cards each (usually cheap, mid, heavy) and assign them
    const packs: Card[] = [];
    for (let p = 0; p < 3; p++) {
      const representative = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      packs.push({ ...representative, id: generateId('draft_pack') });
    }
    return packs;
  }

  // Query server draft suggestions
  const triggerCoachAdvice = async (choices: Card[], deck: Card[], round: number) => {
    setCoachLoading(true);
    setCoachAdvice('');
    try {
      const response = await fetch('/api/game/draft-suggest', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftedDeck: deck, choices, round })
      });
      const data = await response.json();
      if (data && data.reason) {
        setCoachAdvice(`💡 지혜의 조언: "${data.reason}" (인덱스 ${data.recommendedIndex + 1} 추천)`);
      } else {
        setCoachAdvice('💡 지혜의 조언: 이 라운드에서는 공체합 밸런스가 뛰어난 첫 번째 카드를 고르는 것이 가장 합리적입니다!');
      }
    } catch (e) {
      setCoachAdvice('💡 로컬 조언: 첫 번째 추천 카드는 마나 효율성과 유연성이 대단히 뛰어납니다.');
    } finally {
      setCoachLoading(false);
    }
  };

  // Click handler for drafting options
  const handlePickDraftCard = (cardIndex: number, type: 'package' | 'arena') => {
    playSoundEffect('draw');
    const selectedTemplate = state.draftChoices[0][cardIndex];
    let newDeck = [...customDraftDeck];

    if (type === 'package') {
      // Add representative card AND 3 other random synergetic cards of similar costs to constitute 4 cards bundle
      newDeck.push({ ...selectedTemplate, id: generateId('custom_draft') });
      const syn1 = CARD_POOL.find(c => Math.abs(c.cost - selectedTemplate.cost) <= 1 && c.id !== selectedTemplate.id) || selectedTemplate;
      const syn2 = CARD_POOL.find(c => Math.abs(c.cost - selectedTemplate.cost) <= 2 && c.id !== selectedTemplate.id && c.id !== syn1.id) || selectedTemplate;
      const syn3 = CARD_POOL.find(c => Math.abs(c.cost - selectedTemplate.cost) <= 3 && c.id !== selectedTemplate.id && c.id !== syn1.id && c.id !== syn2.id) || selectedTemplate;
      newDeck.push({ ...syn1, id: generateId('custom_draft') });
      newDeck.push({ ...syn2, id: generateId('custom_draft') });
      newDeck.push({ ...syn3, id: generateId('custom_draft') });

      const nextRound = state.roundSelected + 1;
      if (nextRound > 10) {
        // Complete draft
        const aiDeck = generateRandomDeck();
        const initialState = createInitialState(newDeck, aiDeck, '나의 커스텀 테마 덱', 'package', selectedPlayerClass, selectedAiClass);
        setState(initialState);
        playSoundEffect('victory');
      } else {
        const nextChoices = getRandomThreeThemes();
        setState(prev => ({
          ...prev,
          roundSelected: nextRound,
          draftChoices: [nextChoices],
          logs: [...prev.logs, {
            id: generateId('log'),
            timestamp: new Date().toLocaleTimeString(),
            turn: 0,
            speaker: 'SYSTEM',
            text: `🎯 [라운드 ${state.roundSelected}] 패키지 드래프트 완료! 현재 소지 덱 크기: ${newDeck.length}장`
          }]
        }));
        setCustomDraftDeck(newDeck);
        triggerCoachAdvice(nextChoices, newDeck, nextRound);
      }
    } else {
      // Classic Arena Style: add 1 card
      newDeck.push({ ...selectedTemplate, id: generateId('custom_draft') });
      const nextRound = state.roundSelected + 1;

      if (nextRound > 40) {
        // Complete draft
        const aiDeck = generateRandomDeck();
        const initialState = createInitialState(newDeck, aiDeck, '명예로운 투기장 덱', 'arena', selectedPlayerClass, selectedAiClass);
        setState(initialState);
        playSoundEffect('victory');
      } else {
        const nextChoices = getRandomThreeCards();
        setState(prev => ({
          ...prev,
          roundSelected: nextRound,
          draftChoices: [nextChoices],
          logs: [...prev.logs, {
            id: generateId('log'),
            timestamp: new Date().toLocaleTimeString(),
            turn: 0,
            speaker: 'SYSTEM',
            text: `🎯 [라운드 ${state.roundSelected}] 드래프트 완료! 카드의 이름: ${selectedTemplate.name} (현재 덱 크기: ${newDeck.length}/40장)`
          }]
        }));
        setCustomDraftDeck(newDeck);
        triggerCoachAdvice(nextChoices, newDeck, nextRound);
      }
    }
  };

  /**
   * Action Game State logic modifiers
   */

  // End active turn, trigger transition reset buffs and toggle
  const endTurn = (stateOverride?: AppState) => {
    // Prevent non-player initiated endTurn triggers when it is not the player's turn or AI is running
    if (!stateOverride) {
      if (state.whosTurn !== 'player') {
        console.warn("endTurn ignored: current turn is not player.");
        return;
      }
      if (isAiRunningRef.current) {
        console.warn("endTurn ignored: AI is still running.");
        return;
      }
    }

    playSoundEffect('turn_end');
    const baseState: AppState = JSON.parse(JSON.stringify(stateOverride || state));
    const prevWhosTurn = baseState.whosTurn;
    const isPlayerPlaying = prevWhosTurn === 'player';

    // 1. Clean buffers for current side and discard unused mana
    const cleanupState = (player: PlayerState, isCurrentTurnSide: boolean) => {
      const nextBoard = player.board.map(m => {
        // Remove temp adrenaline buffs like Bloodlust etc if any
        return {
          ...m,
          // restore standard attacks
          hasAttackedThisTurn: false
        };
      });
      return {
        ...player,
        mana: isCurrentTurnSide ? 0 : player.mana, // Empty unused mana at turn-end (no accumulation)
        hasAttackedThisTurn: false,
        board: nextBoard
      };
    };

    let nextPlayer = cleanupState(baseState.player, isPlayerPlaying);
    let nextAi = cleanupState(baseState.ai, !isPlayerPlaying);

    // Swap Turn active side
    const nextWhosTurn = isPlayerPlaying ? 'ai' : 'player';
    const nextTurn = baseState.turn + 1;

    // 2. Setup stats for new turn active side
    const setupNewTurnSide = (p: PlayerState, sideName: string) => {
      const nextMaxMana = baseState.gameMode === 'tavern_brawl' ? 10 : Math.min(10, p.maxMana + 1);
      const nextMana = nextMaxMana;
      
      // Wake up board minions that are ready
      const readyBoard = p.board.map(m => ({
        ...m,
        isAsleep: false,
        canAttack: m.atk > 0,
        hasAttackedThisTurn: false
      }));

      const newP = {
        ...p,
        maxMana: nextMaxMana,
        mana: nextMana,
        board: readyBoard,
        usedHeroPower: false
      };

      // Draw standard card
      const drawRes = drawCardFor(newP, [], sideName);
      return { player: drawRes.player, log: drawRes.logText };
    };

    let activeSideLog: string | null = null;
    if (nextWhosTurn === 'player') {
      const setup = setupNewTurnSide(nextPlayer, '플레이어');
      nextPlayer = setup.player;
      activeSideLog = setup.log;
    } else {
      const setup = setupNewTurnSide(nextAi, 'AI 상대방');
      nextAi = setup.player;
      activeSideLog = setup.log;
    }

    const currentLogs = [...baseState.logs];
    const unusedMana = isPlayerPlaying ? baseState.player.mana : baseState.ai.mana;
    if (unusedMana > 0) {
      currentLogs.push({
        id: generateId('system_mana_log'),
        timestamp: new Date().toLocaleTimeString(),
        turn: baseState.turn,
        speaker: 'SYSTEM',
        text: `✨ [마나 소멸] ${isPlayerPlaying ? '플레이어' : 'AI 상대방'}의 턴이 종료되어 사용하지 않고 남은 ${unusedMana} 마나는 누적되지 않고 모두 소멸하였습니다.`
      });
    }

    currentLogs.push({
      id: generateId('turn_log'),
      timestamp: new Date().toLocaleTimeString(),
      turn: nextTurn,
      speaker: 'GM',
      text: `⏳ ---------------- 턴 공방 종료 ---------------- ⏳`
    });
    currentLogs.push({
      id: generateId('turn_log'),
      timestamp: new Date().toLocaleTimeString(),
      turn: nextTurn,
      speaker: 'SYSTEM',
      text: `🌟 [${nextWhosTurn === 'player' ? '플레이어' : 'AI 상대방'}의 턴 시작] 마나가 충전되었습니다! (최대 마나: ${nextWhosTurn === 'player' ? nextPlayer.mana : nextAi.mana})`
    });

    if (activeSideLog) {
      currentLogs.push({
        id: generateId('system_log'),
        timestamp: new Date().toLocaleTimeString(),
        turn: nextTurn,
        speaker: 'SYSTEM',
        text: activeSideLog
      });
    }

    const nextAppState: AppState = {
      ...baseState,
      player: nextPlayer,
      ai: nextAi,
      whosTurn: nextWhosTurn,
      turn: nextTurn,
      logs: currentLogs,
      selectedActionCardIndex: null,
      selectedAttackerId: null,
      targetingMode: 'none'
    };

    setState(nextAppState);

    // Trigger AI opponent operations if next turn is AI's turn
    if (nextWhosTurn === 'ai') {
      runAIOpponentTurnWithDelay(nextAppState);
    }
  };

  // Run AI opponent's logic step-by-step
  const runAIOpponentTurnWithDelay = async (currentState: AppState) => {
    if (isAiRunningRef.current) {
      console.warn("runAIOpponentTurnWithDelay ignored: AI turn is currently calculating.");
      return;
    }
    isAiRunningRef.current = true;
    setIsAiLoading(true);
    let apiSuccess = false;
    let aiActions: any[] = [];
    let commentary = "";

    try {
      // Query server API
      const response = await fetch('/api/game/ai-play', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerState: currentState.player,
          aiState: currentState.ai,
          turnCount: currentState.turn
        })
      });
      const data = await response.json();
      if (data && !data.useLocalFallback) {
        aiActions = data.actions || [];
        commentary = data.commentary || "하하! 나의 완벽한 마나 워즈 두뇌의 턴이다!";
        apiSuccess = true;
      }
    } catch (err) {
      console.warn("AI Turn standard server request failed, reverting to offline controller:", err);
    }

    if (!apiSuccess) {
      // Revert to local rule computation
      const offlineRes = computeRuleBasedAITurn(currentState.player, currentState.ai);
      aiActions = offlineRes.actions;
      commentary = offlineRes.commentary;
    }

    // Sequential action executor with 1sec simulation delay
    let currentGameState = { ...currentState };

    // Print AI commentary log inside currentGameState directly
    currentGameState.logs = [...currentGameState.logs, {
      id: generateId('ai_speaks'),
      timestamp: new Date().toLocaleTimeString(),
      turn: currentGameState.turn,
      speaker: 'AI',
      text: `😈 [대결 상대 AI]: "${commentary}"`
    }];

    // Update state to render AI commentary
    setState({ ...currentGameState });
    
    try {
      for (let i = 0; i < aiActions.length; i++) {
        const act = aiActions[i];
        // Sleep to simulate pacing
        await new Promise(resolve => setTimeout(resolve, 1100));

        if (act.type === 'PLAY_CARD') {
          let actualIdx = -1;
          if (act.cardTemplateId) {
            actualIdx = findHandIndexByTemplate(currentGameState.ai.hand, act.cardTemplateId);
          }
          if (actualIdx === -1 && typeof act.cardHandIndex === 'number') {
            actualIdx = act.cardHandIndex;
          }
          if (actualIdx === -1 || actualIdx >= currentGameState.ai.hand.length) {
            actualIdx = 0;
          }
          currentGameState = executePlayCardLocally(currentGameState, 'ai', actualIdx, translateIdForPlayerSide(currentGameState, act.targetId));
        } else if (act.type === 'ATTACK') {
          const resolvedAttackerId = translateAttackerIdForSide(currentGameState, 'ai', act.attackerMinionId);
          const resolvedTargetId = translateIdForPlayerSide(currentGameState, act.targetId);
          currentGameState = executeAttackLocally(currentGameState, 'ai', resolvedAttackerId, resolvedTargetId);
        } else if (act.type === 'HERO_ATTACK') {
          const resolvedTargetId = translateIdForPlayerSide(currentGameState, act.targetId);
          currentGameState = executeHeroAttackLocally(currentGameState, 'ai', resolvedTargetId);
        } else if (act.type === 'HERO_POWER') {
          const resolvedTargetId = translateIdForPlayerSide(currentGameState, act.targetId);
          currentGameState = executeHeroPower(currentGameState, 'ai', resolvedTargetId);
        }

        // Render intermediate play moves
        setState({ ...currentGameState });

        // Check if player or AI died
        if (currentGameState.player.hp <= 0 || currentGameState.ai.hp <= 0) {
          break;
        }
      }
    } catch (loopError) {
      console.error("AI turn actions sequence execution failed:", loopError);
      currentGameState.logs.push({
        id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: currentGameState.turn, speaker: 'SYSTEM',
        text: `⚠️ 상대편 AI 동작 중 사소한 전술적 변수가 감지되었습니다. 게임 정합성을 유지하며 턴을 플레이어에게 강제 이양합니다.`
      });
    } finally {
      // Delayed end turn for AI
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsAiLoading(false);

      // Check Game Over Conditions first before yielding
      if (currentGameState.player.hp <= 0 || currentGameState.ai.hp <= 0) {
        isAiRunningRef.current = false;
        setState(prev => {
          const nextTurnState = {
            ...prev,
            player: currentGameState.player,
            ai: currentGameState.ai,
            logs: currentGameState.logs
          };
          
          if (currentGameState.player.hp <= 0 && currentGameState.ai.hp <= 0) {
            playSoundEffect('defeat');
            return { ...nextTurnState, phase: 'GAME_OVER', winner: 'ai', winnerName: '적과의 처참한 무승부!' };
          } else if (currentGameState.player.hp <= 0) {
            playSoundEffect('defeat');
            return { ...nextTurnState, phase: 'GAME_OVER', winner: 'ai' };
          } else {
            playSoundEffect('victory');
            return { ...nextTurnState, phase: 'GAME_OVER', winner: 'player' };
          }
        });
        return;
      }

      isAiRunningRef.current = false;
      // End turn safely - using currentGameState with absolute latest details, passing to endTurn
      endTurn(currentGameState);
    }
  };

  // Safe mapping helper to translate general target keywords to active opponent state
  function translateIdForPlayerSide(state: AppState, targetKeyword: string): string {
    if (!targetKeyword) return 'none';
    if (targetKeyword === 'player_hero') return 'player_hero';
    if (targetKeyword === 'ai_hero') return 'ai_hero';
    if (targetKeyword === 'none') return 'none';
    
    // Direct matching
    const plyMinionDirect = state.player.board.find(m => m.id === targetKeyword);
    if (plyMinionDirect) return plyMinionDirect.id;
    const aiMinionDirect = state.ai.board.find(m => m.id === targetKeyword);
    if (aiMinionDirect) return aiMinionDirect.id;

    // Direct name matching (case insensitive)
    const normalizedKeyword = targetKeyword.toLowerCase().trim();
    const plyMinionName = state.player.board.find(m => m.name.toLowerCase() === normalizedKeyword);
    if (plyMinionName) return plyMinionName.id;
    const aiMinionName = state.ai.board.find(m => m.name.toLowerCase() === normalizedKeyword);
    if (aiMinionName) return aiMinionName.id;

    // Substring name matching
    const plyMinionSub = state.player.board.find(m => 
      m.name.toLowerCase().includes(normalizedKeyword) || 
      normalizedKeyword.includes(m.name.toLowerCase())
    );
    if (plyMinionSub) return plyMinionSub.id;

    const aiMinionSub = state.ai.board.find(m => 
      m.name.toLowerCase().includes(normalizedKeyword) || 
      normalizedKeyword.includes(m.name.toLowerCase())
    );
    if (aiMinionSub) return aiMinionSub.id;
    
    return targetKeyword;
  }

  function translateAttackerIdForSide(state: AppState, side: 'player' | 'ai', attackerKeyword: string): string {
    if (!attackerKeyword) return '';
    const board = side === 'player' ? state.player.board : state.ai.board;

    // 1. Direct ID match
    const directMatch = board.find(m => m.id === attackerKeyword);
    if (directMatch) return directMatch.id;

    // 2. Direct name match (case-insensitive)
    const normalizedKeyword = attackerKeyword.toLowerCase().trim();
    const nameMatch = board.find(m => m.name.toLowerCase() === normalizedKeyword && !m.hasAttackedThisTurn && !m.isAsleep);
    if (nameMatch) return nameMatch.id;

    // 3. Substring name match
    const subMatch = board.find(m => 
      (m.name.toLowerCase().includes(normalizedKeyword) || normalizedKeyword.includes(m.name.toLowerCase())) &&
      !m.hasAttackedThisTurn && !m.isAsleep
    );
    if (subMatch) return subMatch.id;

    // 4. Any state match by name (even if asleep or already attacked, as last fallback)
    const anyMatch = board.find(m => m.name.toLowerCase() === normalizedKeyword);
    if (anyMatch) return anyMatch.id;

    return attackerKeyword;
  }

  function findHandIndexByTemplate(hand: Card[], templateId: string): number {
    return hand.findIndex(c => c.templateId === templateId);
  }

  /**
   * Action Game State Modifiers & Checks (Local Sync)
   */

  // checkQuestProgression: Checks and updates active quest progress
  const checkQuestProgression = (state: AppState, side: 'player' | 'ai', card: Card) => {
    const p = side === 'player' ? state.player : state.ai;
    if (!p.activeQuest) return;

    const quest = p.activeQuest;
    let shouldProgress = false;

    if (quest.templateId === 's_quest_mage' && card.type === 'spell' && card.effectId !== 'quest_mage') {
      shouldProgress = true;
    } else if (quest.templateId === 's_quest_priest' && card.type === 'minion' && card.keywords?.includes('Taunt')) {
      shouldProgress = true;
    } else if (quest.templateId === 's_quest_paladin' && card.type === 'minion' && card.keywords?.includes('Divine Shield')) {
      shouldProgress = true;
    } else if (quest.templateId === 's_quest_hunter' && card.cost === 1) {
      shouldProgress = true;
    } else if (quest.templateId === 's_quest_warrior' && card.type === 'minion' && (card.atk || 0) >= 5) {
      shouldProgress = true;
    }

    if (shouldProgress) {
      quest.progress += 1;
      state.logs.push({
        id: generateId('quest_prg'),
        timestamp: new Date().toLocaleTimeString(),
        turn: state.turn,
        speaker: 'SYSTEM',
        text: `✨ [퀘스트 진행] ${side === 'player' ? '나' : '상대'}의 [${quest.name}] 진척도: ${quest.progress} / ${quest.target}`
      });

      if (quest.progress >= quest.target) {
        state.logs.push({
          id: generateId('quest_comp'),
          timestamp: new Date().toLocaleTimeString(),
          turn: state.turn,
          speaker: 'SYSTEM',
          text: `🎉 [퀘스트 완수] ${side === 'player' ? '나' : '상대'}가 퀘스트 [${quest.name}]를 오롯이 성취하여 전설적 보상 카드 [${quest.rewardName}]를 손패에 얻었습니다!`
        });
        playSoundEffect('victory');

        // Add reward card
        const rewardTemplate = CARD_POOL.find(c => c.id === quest.rewardTemplateId);
        if (rewardTemplate) {
          const clonedReward = { ...rewardTemplate, id: generateId(side === 'player' ? 'ply_rew' : 'ai_rew') };
          if (p.hand.length < 10) {
            p.hand.push(clonedReward);
          } else {
            state.logs.push({
              id: generateId('quest_fail'),
              timestamp: new Date().toLocaleTimeString(),
              turn: state.turn,
              speaker: 'SYSTEM',
              text: `⚠️ [손패 공간 부족] ${side === 'player' ? '나' : '상대'}의 핸드가 가득 차 전설 보상 카드를 장전하지 못하고 불태웠습니다.`
            });
          }
        }
        p.activeQuest = null;
      }
    }
  };

  // 1. Play Card local action
  const executePlayCardLocally = (gameState: AppState, side: 'player' | 'ai', handIdx: number, userTargetId: string = 'none'): AppState => {
    const nextState: AppState = JSON.parse(JSON.stringify(gameState));
    const p = side === 'player' ? nextState.player : nextState.ai;
    const opp = side === 'player' ? nextState.ai : nextState.player;

    if (handIdx >= p.hand.length || handIdx < 0) return nextState;
    const card = p.hand[handIdx];

    // Mana validation
    if (p.mana < card.cost) {
      if (side === 'player') {
        playSoundEffect('error');
        nextState.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
          text: `❌ 마나가 부족합니다! 카드의 비용: ${card.cost} (현재 마나: ${p.mana})`
        });
      }
      return nextState;
    }

    // Play card trigger
    p.mana -= card.cost;
    p.hand.splice(handIdx, 1);

    if (card.type === 'minion') {
      playSoundEffect('play_minion');
      const boardMinion: BoardMinion = {
        id: generateId(`p_minion`),
        templateId: card.templateId,
        name: card.name,
        cost: card.cost,
        atk: card.atk || 1,
        maxHp: card.hp || 1,
        currentHp: card.hp || 1,
        keywords: card.keywords || [],
        hasDivineShield: card.keywords?.includes('Divine Shield') || false,
        canAttack: card.keywords?.includes('Charge') || false,
        isAsleep: !card.keywords?.includes('Charge'),
        hasAttackedThisTurn: false,
        deathrattleEffect: card.effectId,
        deathrattleValue: card.effectValue
      };

      p.board.push(boardMinion);
      nextState.logs.push({
        id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: side === 'player' ? 'PLAYER' : 'AI',
        text: `💎 [하수인 소환] ${side === 'player' ? '나' : '상대'}가 하수인 [${card.name}] (공/체: ${card.atk}/${card.hp}) 카드를 소환했습니다!`
      });

      // Handle Battlecries
      if (card.keywords?.includes('Battlecry')) {
        nextState.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
          text: `⚡ 전투의 함성 발동: [${card.name}]!`
        });
        executeCommandEffect(nextState, side, card.effectId || '', card.effectValue || 0, userTargetId, boardMinion.id);
      }
    } else if (card.type === 'weapon') {
      playSoundEffect('play_weapon');
      p.weapon = {
        name: card.name,
        templateId: card.templateId,
        atk: card.atk || 1,
        durability: card.durability || 1
      };
      nextState.logs.push({
        id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: side === 'player' ? 'PLAYER' : 'AI',
        text: `⚔️ [무기 장착] [${card.name}] 무기를 장착했습니다! (공격력: ${card.atk}, 내구도: ${card.durability})`
      });

      // Battlecry handle for weapons
      if (card.effectId) {
        executeCommandEffect(nextState, side, card.effectId, card.effectValue || 0, userTargetId);
      }
    } else if (card.type === 'spell') {
      playSoundEffect('play_spell');
      nextState.logs.push({
        id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: side === 'player' ? 'PLAYER' : 'AI',
        text: `🔮 [주문 사용] [${card.name}] 주문을 시전했습니다! (비용: ${card.cost})`
      });
      executeCommandEffect(nextState, side, card.effectId || '', card.effectValue || 0, userTargetId);
    }

    // Check quest progression for the side that played the card
    checkQuestProgression(nextState, side, card);

    // Resolve deaths after casting
    resolveDeadMinions(nextState);
    return nextState;
  };

  // Programmatic effect execution
  function executeCommandEffect(state: AppState, side: 'player' | 'ai', effectId: string, value: number, targetId: string, minionSourceId?: string) {
    const active = side === 'player' ? state.player : state.ai;
    const opponent = side === 'player' ? state.ai : state.player;

    const findMinionOnField = (id: string) => {
      const pMatch = state.player.board.find(m => m.id === id);
      if (pMatch) return { m: pMatch, side: 'player' };
      const aiMatch = state.ai.board.find(m => m.id === id);
      if (aiMatch) return { m: aiMatch, side: 'ai' };
      return null;
    };

    switch (effectId) {
      case 'gain_mana_one_turn': {
        active.mana = Math.min(10, active.mana + value);
        state.logs.push({
          id: generateId('log'),
          timestamp: new Date().toLocaleTimeString(),
          turn: state.turn,
          speaker: 'SYSTEM',
          text: side === 'player' ? `🪙 동전 한 닢 발동! 플레이어님이 임시 마나를 1 얻어 주 마나가 ${active.mana}가 되었습니다.` : `🪙 동전 한 닢 발동! AI 상대가 임시 마나를 1 얻어 마나가 ${active.mana}가 되었습니다.`
        });
        break;
      }
      case 'deal_damage': {
        const combatLogText = `💥 대미지 격발: 대상 ${targetId === 'player_hero' ? '플레이어 영웅' : targetId === 'ai_hero' ? 'AI 영웅' : targetId}에게 ${value} 피해!`;
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: combatLogText });

        if (targetId === 'player_hero') {
          const res = damageHero(state.player, value);
          if (res.armorLost > 0) {
            state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🛡️ 플레이어 영웅이 방어도로 ${res.armorLost} 피해를 흡수했습니다! (남은 방어도: ${state.player.armor})` });
          }
        } else if (targetId === 'ai_hero') {
          const res = damageHero(state.ai, value);
          if (res.armorLost > 0) {
            state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🛡️ AI 상대 영웅이 방어도로 ${res.armorLost} 피해를 흡수했습니다! (남은 방어도: ${state.ai.armor})` });
          }
        } else {
          const match = findMinionOnField(targetId);
          if (match) {
            if (match.m.hasDivineShield) {
              match.m.hasDivineShield = false;
              state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🛡️ [${match.m.name}]의 천상의 보호막이 피해를 완벽히 흡수하고 바스러졌습니다!` });
            } else {
              match.m.currentHp -= value;
            }
          }
        }
        break;
      }
      case 'deal_hero_damage': {
        if (side === 'player') {
          damageHero(state.ai, value);
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `💀 오염된 가스 유출! 상대 AI 영웅에게 ${value} 대미지! (HP: ${state.ai.hp}, 방어도: ${state.ai.armor})` });
        } else {
          damageHero(state.player, value);
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `💀 오염된 가스 유출! 당신에게 ${value} 대미지! (HP: ${state.player.hp}, 방어도: ${state.player.armor})` });
        }
        break;
      }
      case 'heal_target': {
        const cureLogText = `💚 영양 회복제: 대상 ${targetId === 'player_hero' ? '플레이어 영웅' : targetId === 'ai_hero' ? 'AI 영웅' : targetId}에게 생명력 +${value} 회복!`;
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: cureLogText });

        if (targetId === 'player_hero') {
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + value);
        } else if (targetId === 'ai_hero') {
          state.ai.hp = Math.min(state.ai.maxHp, state.ai.hp + value);
        } else {
          const match = findMinionOnField(targetId);
          if (match) {
            match.m.currentHp = Math.min(match.m.maxHp, match.m.currentHp + value);
          }
        }
        break;
      }
      case 'heal_hero': {
        active.hp = Math.min(active.maxHp, active.hp + value);
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `💚 아군 영웅이 생명력 +${value} 회복했습니다. (현재 HP: ${active.hp}/30)` });
        break;
      }
      case 'draw_card': {
        for (let i = 0; i < value; i++) {
          const res = drawCardFor(active, state.logs, side === 'player' ? '플레이어' : 'AI 상대방');
          active.deck = res.player.deck;
          active.hand = res.player.hand;
          active.hp = res.player.hp;
          active.fatigueCount = res.player.fatigueCount;
          if (res.logText) {
            state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: res.logText });
          }
        }
        break;
      }
      case 'destroy_weapon': {
        opponent.weapon = null;
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🔨 산성 습격! 상대방 영웅의 모든 대검/무기를 즉시 박살내었습니다!` });
        break;
      }
      case 'destroy_all_minions': {
        // Clear all minions except perhaps the source itself
        const sourceId = minionSourceId || 'none';
        state.player.board = state.player.board.filter(m => m.id === sourceId);
        state.ai.board = state.ai.board.filter(m => m.id === sourceId);
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🌋 데스윙의 불꽃 심판! 전장에 배치되어 있던 모든 하수인들이 소멸하였습니다!` });
        break;
      }
      case 'summon_slime': {
        const slime: BoardMinion = {
          id: generateId('slime'),
          templateId: 'm_slime_token',
          name: '진흙탕 슬라임',
          cost: 1,
          atk: 1,
          maxHp: 2,
          currentHp: 2,
          keywords: ['Taunt'],
          hasDivineShield: false,
          canAttack: false,
          isAsleep: true,
          hasAttackedThisTurn: false
        };
        active.board.push(slime);
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🧪 수라구의 악취 속에 1/2 도발 도적 '진흙탕 슬라임' 토큰 하수인이 새로이 출현하였습니다!` });
        break;
      }
      case 'summon_golem': {
        const golem: BoardMinion = {
          id: generateId('golem'),
          templateId: 'm_golem_token',
          name: '고철 보철 골렘',
          cost: 1,
          atk: 2,
          maxHp: 1,
          currentHp: 1,
          keywords: [],
          hasDivineShield: false,
          canAttack: false,
          isAsleep: true,
          hasAttackedThisTurn: false
        };
        active.board.push(golem);
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `⚙️ 골렘의 기계식 심장이 격동하여 2/1 '고철 보철 골렘' 하수인이 배치되었습니다!` });
        break;
      }
      case 'random_fire_blast': {
        const viableTargets: string[] = ['opponent_hero'];
        opponent.board.forEach(m => viableTargets.push(m.id));
        const pick = viableTargets[Math.floor(Math.random() * viableTargets.length)];

        if (pick === 'opponent_hero') {
          damageHero(opponent, value);
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🔥 라그나로스의 무작위 불발탄이 상대 영웅에게 꽂혀 ${value} 대미지를 입힙니다! (남은 HP: ${opponent.hp}, 방어도: ${opponent.armor})` });
        } else {
          const match = opponent.board.find(m => m.id === pick);
          if (match) {
            match.currentHp -= value;
            state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🔥 라그나로스의 거대 운석이 하수인 [${match.name}]을 소리 없이 때리고 가차 없이 파괴하였습니다!` });
          }
        }
        break;
      }
      case 'equip_ashbringer': {
        active.weapon = {
          name: '파멸의 인도자 (Ashbringer)',
          templateId: 'w_ashbringer',
          atk: 5,
          durability: 3
        };
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `✨ 전설의 대검 [파멸의 인도자 (Ashbringer)]가 영웅 패널에 장비되었습니다! (공격력 5, 내구력 3)` });
        break;
      }
      case 'set_health_15': {
        opponent.hp = 15;
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🐉 알렉스트라자의 영겁의 숨결! 상대 영웅의 체력이 즉시 생사의 기준점인 15로 조정되었습니다!` });
        break;
      }
      case 'silence_target': {
        const match = findMinionOnField(targetId);
        if (match) {
          match.m.keywords = [];
          match.m.hasDivineShield = false;
          match.m.currentHp = Math.min(match.m.currentHp, match.m.maxHp - 1);
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🔇 정적의 속삭임! 하수인 [${match.m.name}]의 도발과 천상의 보호막, 모든 키워드가 박탈되었습니다!` });
        }
        break;
      }
      case 'buff_all_friendly': {
        active.board.forEach(m => {
          m.atk += value;
          m.maxHp += value;
          m.currentHp += value;
        });
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🦁 위대한 함성! 모든 소환된 아군 충성스러운 대원들에게 +${value}/+${value} 영구 버프를 부여하였습니다!` });
        break;
      }
      case 'aoe_enemies': {
        opponent.board.forEach(m => {
          if (m.hasDivineShield) {
            m.hasDivineShield = false;
          } else {
            m.currentHp -= value;
          }
        });
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `❄️ 서리의 습격! 신성의 장막 속에서 소나기가 내리며 모든 적군 하수인들에게 광역 피해 ${value}를 가했습니다.` });
        break;
      }
      case 'aoe_enemies_all': {
        opponent.board.forEach(m => {
          if (m.hasDivineShield) {
            m.hasDivineShield = false;
          } else {
            m.currentHp -= value;
          }
        });
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🔥 폭염 화염기둥! 장관을 일으키며 상대 전장의 모든 대원들에게 지옥 피해 ${value}를 입힙니다!` });
        break;
      }
      case 'bloodlust': {
        active.board.forEach(m => {
          m.atk += value;
        });
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🔴 피의 격노! 이번 턴에 아군 전장의 대원들이 피에 휩쓸려 공격력이 과부하 가산시킵니다 (+${value} ATK)` });
        break;
      }
      case 'polymorph': {
        const match = findMinionOnField(targetId);
        if (match) {
          match.m.name = '새끼 양 (Sheep)';
          match.m.templateId = 'token_sheep';
          match.m.atk = 1;
          match.m.maxHp = 1;
          match.m.currentHp = 1;
          match.m.keywords = [];
          match.m.hasDivineShield = false;
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🐑 뿅! 강력한 주파수가 흐르며 [${targetId}] 하수인이 평화로운 1/1 '새끼 양' 토큰으로 기적의 변신을 당했습니다!` });
        }
        break;
      }
      case 'shield_buff': {
        const match = findMinionOnField(targetId);
        if (match) {
          match.m.maxHp += value;
          match.m.currentHp += value;
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🛡️ 신의 권능 장벽! 하수인 [${match.m.name}]의 생명력을 +${value} 늘리고 카드 1장을 보급받습니다.` });
          // Supply a card
          const res = drawCardFor(active, state.logs, side === 'player' ? '플레이어' : 'AI 상대방');
          active.deck = res.player.deck;
          active.hand = res.player.hand;
          active.hp = res.player.hp;
          active.fatigueCount = res.player.fatigueCount;
          if (res.logText) {
            state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: res.logText });
          }
        }
        break;
      }
      case 'full_heal_taunt': {
        const match = findMinionOnField(targetId);
        if (match) {
          match.m.currentHp = match.m.maxHp;
          if (!match.m.keywords.includes('Taunt')) {
            match.m.keywords.push('Taunt');
          }
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🌳 고대 치유술! 하수인 [${match.m.name}]의 생명력을 만충 회복시키고 두터운 도발 가드를 새겼습니다!` });
        }
        break;
      }
      case 'destroy_target': {
        const match = findMinionOnField(targetId);
        if (match) {
          match.m.currentHp = 0;
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `💀 기만 암살! 하수인 [${match.m.name}]을(를) 즉결 처단해 거두었습니다.` });
        }
        break;
      }
      case 'random_cleave': {
        const alive = opponent.board.filter(m => m.currentHp > 0);
        if (alive.length > 0) {
          // Cleave 2 random
          const shuffled = [...alive].sort(() => 0.5 - Math.random());
          const hits = shuffled.slice(0, 2);
          hits.forEach(m => {
            if (m.hasDivineShield) m.hasDivineShield = false;
            else m.currentHp -= value;
            state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `⚔️ 갈라치기 발동! 하수인 [${m.name}]이 불벼락 세찬 갈래 공격을 입어 ${value} 피해를 얻었습니다.` });
          });
        }
        break;
      }
      case 'savage_roar': {
        active.board.forEach(m => {
          m.atk += value;
        });
        active.hp += 0; // Wait, does hero get temporary ATK? Our simplified simulator gives minions the boost
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🐾 가인 야수 포효! 이번 한 턴 동안 모든 아군 대원들의 정면 결속 공격력을 +${value} 늘렸습니다.` });
        break;
      }
      case 'hero_strike_buff': {
        // give hero temporary attack (simulated by giving hero attack for turn)
        playSoundEffect('play_weapon');
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `⚔️ 영웅의 극노 공격권 격발! 플레이어가 힘을 끌어모아 이번 라운드 대검 피해 기회가 부여됩니다!` });
        break;
      }
      case 'stormwind_cry': {
        active.board.forEach(m => {
          m.atk += 1;
          m.maxHp += 1;
          m.currentHp += 1;
        });
        active.hp = Math.min(active.maxHp, active.hp + value);
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🛡️ 스톰윈드의 가호! 내 영웅 체력을 6 격상 회복하고 모든 필드 대원들에게 +1/+1 부대를 장식했습니다.` });
        break;
      }
      case 'whirlwind': {
        state.player.board.forEach(m => { m.currentHp -= value; });
        state.ai.board.forEach(m => { m.currentHp -= value; });
        state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `🌪️ 죽음의 소용돌이! 모든 하수인에게 세차게 돌아가는 철퇴 격돌 광역 대미지 1을 난타했습니다!` });
        break;
      }
      case 'stormpike_effect': {
        const alive = opponent.board.filter(m => m.currentHp > 0);
        if (alive.length > 0) {
          const m = alive[Math.floor(Math.random() * alive.length)];
          m.currentHp -= value;
          state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: `⚡ 지옥 낙뢰! 무기 장착과 함께 적 하수인 [${m.name}]에게 폭뢰를 떨구어 ${value} 피해를 가했습니다!` });
        }
        break;
      }
      case 'quest_mage': {
        active.activeQuest = {
          id: generateId('quest_inst'),
          templateId: 's_quest_mage',
          name: '신비한 비전 왜곡',
          progress: 0,
          target: 3,
          description: '[퀘스트] 주문을 3회 시전하십시오.',
          rewardTemplateId: 's_quest_mage_reward',
          rewardName: '대마법사의 지혜'
        };
        state.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🛡️ [퀘스트 활성화] ${side === 'player' ? '나' : '상대'}가 전설 퀘스트 [신비한 비전 왜곡]을 걸었습니다! 주문을 3회 시전하면 전설 보상 카드를 받습니다!`
        });
        break;
      }
      case 'quest_priest': {
        active.activeQuest = {
          id: generateId('quest_inst'),
          templateId: 's_quest_priest',
          name: '깨어난 자들의 사명',
          progress: 0,
          target: 2,
          description: '[퀘스트] 도발 하수인을 2회 소환하십시오.',
          rewardTemplateId: 'm_quest_priest_reward',
          rewardName: '희망의 인도자 아마라'
        };
        state.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🛡️ [퀘스트 활성화] ${side === 'player' ? '나' : '상대'}가 전설 퀘스트 [깨어난 자들의 사명]을 걸었습니다! 도발 하수인을 2회 소환하면 전설 보상 카드를 받습니다!`
        });
        break;
      }
      case 'quest_paladin': {
        active.activeQuest = {
          id: generateId('quest_inst'),
          templateId: 's_quest_paladin',
          name: '빛의 연합 구축',
          progress: 0,
          target: 2,
          description: '[퀘스트] 천상의 보호막 하수인을 2회 소환하십시오.',
          rewardTemplateId: 'm_quest_paladin_reward',
          rewardName: '거대 공룡 갈바돈'
        };
        state.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🛡️ [퀘스트 활성화] ${side === 'player' ? '나' : '상대'}가 전설 퀘스트 [빛의 연합 구축]을 걸었습니다! 천상의 보호막 하수인을 2회 소환하면 전설 보상 카드를 받습니다!`
        });
        break;
      }
      case 'quest_hunter': {
        active.activeQuest = {
          id: generateId('quest_inst'),
          templateId: 's_quest_hunter',
          name: '맹수 사냥 준비',
          progress: 0,
          target: 3,
          description: '[퀘스트] 1코스트 카드를 3회 사용하십시오.',
          rewardTemplateId: 'm_quest_hunter_reward',
          rewardName: '여왕 카르나사'
        };
        state.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🛡️ [퀘스트 활성화] ${side === 'player' ? '나' : '상대'}가 전설 퀘스트 [맹수 사냥 준비]를 걸었습니다! 1코스트 카드를 3회 사용하면 전설 보상 카드를 받습니다!`
        });
        break;
      }
      case 'quest_warrior': {
        active.activeQuest = {
          id: generateId('quest_inst'),
          templateId: 's_quest_warrior',
          name: '방어선 사수',
          progress: 0,
          target: 2,
          description: '[퀘스트] 공격력 5 이상의 하수인을 2회 소환하십시오.',
          rewardTemplateId: 'w_quest_warrior_reward',
          rewardName: '파괴의 불길 설퍼라스'
        };
        state.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🛡️ [퀘스트 활성화] ${side === 'player' ? '나' : '상대'}가 전설 퀘스트 [방어선 사수]를 걸었습니다! 공격력 5 이상의 하수인을 2회 소환하면 전설 보상 카드를 받습니다!`
        });
        break;
      }
      case 'quest_mage_reward': {
        state.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🔥 [대마법사의 지혜] 시전! 아군 영웅의 마나가 만수 회복되고, 영웅 체력이 10 치료 회복되며 카드를 4장 대거 장전합니다!`
        });
        active.mana = active.maxMana;
        active.hp = Math.min(active.maxHp, active.hp + 10);
        for (let i = 0; i < 4; i++) {
          const res = drawCardFor(active, state.logs, side === 'player' ? '플레이어' : 'AI 상대방');
          active.deck = res.player.deck;
          active.hand = res.player.hand;
          active.hp = res.player.hp;
          active.fatigueCount = res.player.fatigueCount;
          if (res.logText) {
            state.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM', text: res.logText });
          }
        }
        break;
      }
      case 'quest_priest_reward': {
        state.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `💖 [희망의 인도자 아마라]의 전투의 함성! 아군 영웅의 최대 생명력 상한이 40으로 증가하고 체력이 40으로 풀 충전 복원됩니다!`
        });
        active.maxHp = 40;
        active.hp = 40;
        break;
      }
      case 'quest_paladin_reward': {
        state.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🦖 [거대 공룡 갈바돈] 소환! 도발, 천상의 보호막, 돌진을 부여받아 사나운 포효를 내지릅니다!`
        });
        break;
      }
      case 'quest_hunter_reward': {
        state.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `💥 [여왕 카르나사]의 격포 일갈! 상대 영웅 본체에 즉각적인 저주 피해 12를 가격 타격합니다!`
        });
        damageHero(opponent, 12);
        break;
      }
      case 'quest_warrior_reward': {
        state.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
          text: `🔥 장비식 [설퍼라스] 점령! 진노의 무작위 불발을 사방에 방사합니다!`
        });
        const targets: string[] = [side === 'player' ? 'ai_hero' : 'player_hero'];
        opponent.board.forEach(m => {
          targets.push(m.id);
        });
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        if (randomTarget === 'player_hero' || randomTarget === 'ai_hero') {
          const targetPlayer = randomTarget === 'player_hero' ? state.player : state.ai;
          damageHero(targetPlayer, 8);
          state.logs.push({
            id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
            text: `🔥 설퍼라스 불덩이 분노 충돌! 영웅에게 폭발 피해 8을 전량 안겼습니다!`
          });
        } else {
          const targetMinion = opponent.board.find(m => m.id === randomTarget);
          if (targetMinion) {
            if (targetMinion.hasDivineShield) {
              targetMinion.hasDivineShield = false;
            } else {
              targetMinion.currentHp -= 8;
            }
            state.logs.push({
              id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
              text: `🔥 설퍼라스 불덩이 분노 충돌! 적 하수인 [${targetMinion.name}]에게 폭발 피해 8을 전량 안겼습니다!`
            });
          }
        }
        break;
      }
    }
  }

  // Sweep the boards, identify any dead minions, resolve Deathrattles!
  function resolveDeadMinions(state: AppState) {
    const processBoardDeaths = (board: BoardMinion[], opponentBoard: BoardMinion[], isPlayerBoard: boolean) => {
      const dead = board.filter(m => m.currentHp <= 0);
      if (dead.length === 0) return board;

      dead.forEach(m => {
        state.logs.push({
          id: generateId('death_log'),
          timestamp: new Date().toLocaleTimeString(),
          turn: state.turn,
          speaker: 'SYSTEM',
          text: `💀 하수인 [${m.name}]이 무참히 쓰러져 묘지로 안장되었습니다.`
        });

        // Trigger Deathrattle
        if (m.keywords.includes('Deathrattle')) {
          state.logs.push({
            id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: state.turn, speaker: 'SYSTEM',
            text: `⚡ 죽음의 메아리 발동: [${m.name}]`
          });
          const activeSide = isPlayerBoard ? 'player' : 'ai';
          executeCommandEffect(state, activeSide, m.deathrattleEffect || '', m.deathrattleValue || 0, isPlayerBoard ? 'ai_hero' : 'player_hero');
        }
      });

      return board.filter(m => m.currentHp > 0);
    };

    state.player.board = processBoardDeaths(state.player.board, state.ai.board, true);
    state.ai.board = processBoardDeaths(state.ai.board, state.player.board, false);
  }

  // 2. Play minion attack local action
  const executeAttackLocally = (gameState: AppState, activeSide: 'player' | 'ai', attackerId: string, defenderId: string): AppState => {
    const nextState: AppState = JSON.parse(JSON.stringify(gameState));
    const p = activeSide === 'player' ? nextState.player : nextState.ai;
    const opp = activeSide === 'player' ? nextState.ai : nextState.player;

    const attacker = p.board.find(m => m.id === attackerId);
    if (!attacker) return nextState;

    // Ready verification
    if (attacker.isAsleep || attacker.hasAttackedThisTurn) {
      if (activeSide === 'player') {
        playSoundEffect('error');
        nextState.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
          text: `❌ 하수인군단 [${attacker.name}]은 이번 턴에 준비가 안 되었거나 공격이 끝났습니다!`
        });
      }
      return nextState;
    }

    // Taunt verification
    const oppTaunts = scaleTauntMinions(opp.board);
    if (oppTaunts.length > 0) {
      const defenderMinion = oppTaunts.find(m => m.id === defenderId);
      if (!defenderMinion) {
        // invalid attack bypass attempt
        if (activeSide === 'player') {
          playSoundEffect('error');
          nextState.logs.push({
            id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
            text: `⚠️ 상대 전장에 '도발 (Taunt)' 하수인이 버티고 서 있습니다! 무조건 도발 대원들을 정면 강습하십시오.`
          });
        }
        return nextState;
      }
    }

    // Resolve Attack combat
    playSoundEffect('combat');
    attacker.hasAttackedThisTurn = true;

    if (defenderId === 'player_hero' || defenderId === 'ai_hero') {
      // Attacks Enemy Hero Face!
      const res = damageHero(opp, attacker.atk);
      let logSuffix = '';
      if (res.armorLost > 0) {
        logSuffix = ` (방어도로 ${res.armorLost} 피해 흡수, 남은 방어도: ${opp.armor})`;
      }
      nextState.logs.push({
        id: generateId('com_log'),
        timestamp: new Date().toLocaleTimeString(),
        turn: nextState.turn,
        speaker: activeSide === 'player' ? 'PLAYER' : 'AI',
        text: `⚔️ [직접 타격] 하수인 [${attacker.name}]이(가) 상대측 영웅을 강타해 -${attacker.atk} 피해를 입혔습니다!${logSuffix}`
      });
    } else {
      // Attacks Enemy Minion!
      const defender = opp.board.find(m => m.id === defenderId);
      if (defender) {
        nextState.logs.push({
          id: generateId('com_log'),
          timestamp: new Date().toLocaleTimeString(),
          turn: nextState.turn,
          speaker: activeSide === 'player' ? 'PLAYER' : 'AI',
          text: `💥 하수인 [${attacker.name}] (공: ${attacker.atk})이(가) 상대의 하수인 [${defender.name}] (공: ${defender.atk})을 공격했습니다!`
        });

        // Attacking damage calculation
        if (attacker.hasDivineShield) {
          attacker.hasDivineShield = false;
          nextState.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM', text: `🛡️ 소환대원 [${attacker.name}]의 수호장막이 적의 반격을 흡수하고 해제되었습니다.` });
        } else {
          attacker.currentHp -= defender.atk;
        }

        if (defender.hasDivineShield) {
          defender.hasDivineShield = false;
          nextState.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM', text: `🛡️ 상대의 [${defender.name}] 대원이 천상의 보호막을 발현하여 모든 상해를 우회했습니다.` });
        } else {
          defender.currentHp -= attacker.atk;
        }
      }
    }

    // Resolve death sweeps
    resolveDeadMinions(nextState);
    return nextState;
  };

  // 3. Play hero direct attack local action
  const executeHeroAttackLocally = (gameState: AppState, activeSide: 'player' | 'ai', defenderId: string): AppState => {
    const nextState: AppState = JSON.parse(JSON.stringify(gameState));
    const p = activeSide === 'player' ? nextState.player : nextState.ai;
    const opp = activeSide === 'player' ? nextState.ai : nextState.player;

    if (!p.weapon) {
      if (activeSide === 'player') {
        playSoundEffect('error');
        nextState.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
          text: `❌ 장착된 무기가 없거나 공격력 버프를 잃어 영웅이 전선에 나설 수 없습니다!`
        });
      }
      return nextState;
    }

    if (p.hasAttackedThisTurn) {
      if (activeSide === 'player') {
        playSoundEffect('error');
        nextState.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
          text: `❌ 영웅은 이번 턴에 무기를 이미 휘둘렀습니다! (공격 횟수 한계 보임)`
        });
      }
      return nextState;
    }

    // Taunt verification
    const oppTaunts = scaleTauntMinions(opp.board);
    if (oppTaunts.length > 0) {
      const defenderMinion = oppTaunts.find(m => m.id === defenderId);
      if (!defenderMinion) {
        if (activeSide === 'player') {
          playSoundEffect('error');
          nextState.logs.push({
            id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
            text: `⚠️ 도발하수인 가드가 아직 파쇄되지 않았습니다! 도발 요소를 공략해야 영웅의 본체 침공이 허가됩니다.`
          });
        }
        return nextState;
      }
    }

    playSoundEffect('combat');
    p.hasAttackedThisTurn = true;
    const weaponAtk = p.weapon.atk;

    if (defenderId === 'player_hero' || defenderId === 'ai_hero') {
      // Attacks Opponent Hero directly!
      const res = damageHero(opp, weaponAtk);
      let logSuffix = '';
      if (res.armorLost > 0) {
        logSuffix = ` (방어도로 ${res.armorLost} 피해 흡수, 남은 방어도: ${opp.armor})`;
      }
      nextState.logs.push({
        id: generateId('com'),
        timestamp: new Date().toLocaleTimeString(),
        turn: nextState.turn,
        speaker: activeSide === 'player' ? 'PLAYER' : 'AI',
        text: `⚔️ [무기 강습] 영웅이 무기 [${p.weapon.name}]을(를) 휘둘러 적의 영웅 본체에 기만 공격 ${weaponAtk}을 작렬했습니다!${logSuffix}`
      });
    } else {
      // Attacks active minion!
      const defender = opp.board.find(m => m.id === defenderId);
      if (defender) {
        const res = damageHero(p, defender.atk); // Hero takes retaliatory damage based on minion attack power
        let pLogSuffix = '';
        if (res.armorLost > 0) {
          pLogSuffix = ` (방어도로 ${res.armorLost} 피해 흡수, 남은 방어도: ${p.armor})`;
        }
        if (defender.hasDivineShield) {
          defender.hasDivineShield = false;
          nextState.logs.push({ id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM', text: `🛡️ 지목된 상대 [${defender.name}] 대원의 수호 보호막이 활성화되어 영웅의 일격을 흡수해 흩어졌습니다.` });
        } else {
          defender.currentHp -= weaponAtk;
        }

        nextState.logs.push({
          id: generateId('com'),
          timestamp: new Date().toLocaleTimeString(),
          turn: nextState.turn,
          speaker: activeSide === 'player' ? 'PLAYER' : 'AI',
          text: `💥 영웅이 직접 무장 대검을 들어 하수인 [${defender.name}]을 찍어 내렸습니다 (영웅 타격 ${weaponAtk} 대미지 / 반사피해 ${defender.atk} 입음!${pLogSuffix})`
        });
      }
    }

    // Decrement weapon durability
    p.weapon.durability -= 1;
    if (p.weapon.durability <= 0) {
      p.weapon = null;
      nextState.logs.push({
        id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
        text: `🥀 영웅이 혼신을 다해 가한 기습으로 검이 소멸당해 무덤으로 밀물 전락했습니다.`
      });
    }

    // Resolve sweeps
    resolveDeadMinions(nextState);
    return nextState;
  };

  const executeHeroPower = (gameState: AppState, side: 'player' | 'ai', targetId: string = 'none'): AppState => {
    const nextState: AppState = JSON.parse(JSON.stringify(gameState));
    const p = side === 'player' ? nextState.player : nextState.ai;
    const opp = side === 'player' ? nextState.ai : nextState.player;

    if (p.mana < 2) {
      if (side === 'player') {
        playSoundEffect('error');
        nextState.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
          text: `❌ 마나가 부족하여 영웅 능력을 사용할 수 없습니다! (비용: 2마나)`
        });
      }
      return nextState;
    }

    if (p.usedHeroPower) {
      if (side === 'player') {
        playSoundEffect('error');
        nextState.logs.push({
          id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
          text: `❌ 영웅 능력은 한 턴에 한 번만 사용할 수 있습니다!`
        });
      }
      return nextState;
    }

    // Deduct 2 mana and set used hero power
    p.mana -= 2;
    p.usedHeroPower = true;

    // Execute based on class
    const heroClass = p.heroClass;
    playSoundEffect('play_spell');

    switch (heroClass) {
      case 'Mage': {
        // Fireblast - Deal 1 damage
        const isPlayerTarget = targetId === 'player_hero';
        const isAiTarget = targetId === 'ai_hero';
        
        let targetName = '미상 대상';
        if (isPlayerTarget) {
          targetName = '플레이어 영웅';
          damageHero(nextState.player, 1);
        } else if (isAiTarget) {
          targetName = 'AI 상대방 영웅';
          damageHero(nextState.ai, 1);
        } else {
          // It's a minion
          const minion = nextState.player.board.find(m => m.id === targetId) || nextState.ai.board.find(m => m.id === targetId);
          if (minion) {
            targetName = `하수인 [${minion.name}]`;
            if (minion.hasDivineShield) {
              minion.hasDivineShield = false;
              nextState.logs.push({
                id: generateId('sys'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn, speaker: 'SYSTEM',
                text: `🛡️ 하수인 [${minion.name}]의 천상의 보호막이 화염 작렬을 흡수하고 꺼졌습니다.`
              });
            } else {
              minion.currentHp -= 1;
            }
          }
        }

        nextState.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn,
          speaker: side === 'player' ? 'PLAYER' : 'AI',
          text: `🔥 [영웅 능력: 화염 작렬] ${side === 'player' ? '나' : '상대'}가 화염 작렬을 시전하여 ${targetName}에게 1의 피해를 입혔습니다!`
        });
        break;
      }
      case 'Priest': {
        // Lesser Heal - Heal 2 health
        const isPlayerTarget = targetId === 'player_hero';
        const isAiTarget = targetId === 'ai_hero';
        
        let targetName = '미상 대상';
        if (isPlayerTarget) {
          targetName = '플레이어 영웅';
          nextState.player.hp = Math.min(nextState.player.maxHp, nextState.player.hp + 2);
        } else if (isAiTarget) {
          targetName = 'AI 상대방 영웅';
          nextState.ai.hp = Math.min(nextState.ai.maxHp, nextState.ai.hp + 2);
        } else {
          // It's a minion
          const minion = nextState.player.board.find(m => m.id === targetId) || nextState.ai.board.find(m => m.id === targetId);
          if (minion) {
            targetName = `하수인 [${minion.name}]`;
            minion.currentHp = Math.min(minion.maxHp, minion.currentHp + 2);
          }
        }

        nextState.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn,
          speaker: side === 'player' ? 'PLAYER' : 'AI',
          text: `💚 [영웅 능력: 하급 치유] ${side === 'player' ? '나' : '상대'}가 하급 치유를 시전하여 ${targetName}의 생명력을 2 회복시켰습니다!`
        });
        break;
      }
      case 'Paladin': {
        // Reinforce - Summon a 1/1 Silver Hand Recruit
        const recruit: BoardMinion = {
          id: generateId(`${side}_recruit`),
          templateId: 'minion_recruit',
          name: '은빛성전사 신병',
          cost: 1,
          atk: 1,
          maxHp: 1,
          currentHp: 1,
          keywords: [],
          hasDivineShield: false,
          canAttack: false,
          isAsleep: true,
          hasAttackedThisTurn: false
        };
        p.board.push(recruit);
        nextState.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn,
          speaker: side === 'player' ? 'PLAYER' : 'AI',
          text: `🛡️ [영웅 능력: 신병 소환] ${side === 'player' ? '나' : '상대'}가 은빛성전사 신병(1/1)을 전장에 긴급 소환했습니다!`
        });
        break;
      }
      case 'Hunter': {
        // Steady Shot - Deal 2 damage to enemy face
        damageHero(opp, 2);
        nextState.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn,
          speaker: side === 'player' ? 'PLAYER' : 'AI',
          text: `🏹 [영웅 능력: 고정 사격] ${side === 'player' ? '나' : '상대'}가 적 영웅의 명치에 고정 사격을 가해 2의 누진 피해를 입혔습니다!`
        });
        break;
      }
      case 'Warrior': {
        // Armor Up! - Gain 2 Armor
        p.armor += 2;
        nextState.logs.push({
          id: generateId('log'), timestamp: new Date().toLocaleTimeString(), turn: nextState.turn,
          speaker: side === 'player' ? 'PLAYER' : 'AI',
          text: `🛡️ [영웅 능력: 방어도 상승!] ${side === 'player' ? '나' : '상대'}가 방어도를 수급하여 방어도 +2를 얻었습니다! (현재 방어도: ${p.armor})`
        });
        break;
      }
    }

    resolveDeadMinions(nextState);
    return nextState;
  };

  const translateHeroClass = (cls: string): string => {
    switch (cls) {
      case 'Mage': return '마법사 (Mage)';
      case 'Priest': return '사제 (Priest)';
      case 'Paladin': return '성기사 (Paladin)';
      case 'Hunter': return '사냥꾼 (Hunter)';
      case 'Warrior': return '전사 (Warrior)';
      default: return '영웅';
    }
  };

  const getHeroPowerInfo = (cls: string) => {
    switch (cls) {
      case 'Mage':
        return { name: "화염 작렬", cost: 2, desc: "적 하수인이나 영웅에게 1의 피해를 입힙니다.", color: "from-[#ef4444]/60 to-[#f97316]/60 border-[#f97316]", icon: "🔥" };
      case 'Priest':
        return { name: "하급 치유", cost: 2, desc: "선택한 대상의 생명력을 2 회복시킵니다.", color: "from-[#fbbf24]/50 to-[#b45309]/50 border-[#fbbf24]", icon: "💚" };
      case 'Paladin':
        return { name: "신병 소환", cost: 2, desc: "1/1 은빛성전사 신병을 1명 전장에 소환합니다.", color: "from-[#3b82f6]/50 to-[#1d4ed8]/50 border-[#60a5fa]", icon: "🛡️" };
      case 'Hunter':
        return { name: "고정 사격", cost: 2, desc: "상대방 적 영웅 명치에 즉시 2의 피해를 줍니다.", color: "from-[#10b981]/50 to-[#047857]/50 border-[#10b981]", icon: "🏹" };
      case 'Warrior':
        return { name: "방어도 상승", cost: 2, desc: "방어도를 +2 얻습니다. (피해를 대신 막아주는 보호막 수급)", color: "from-[#64748b]/50 to-[#334155]/50 border-[#94a3b8]", icon: "🛡️" };
      default:
        return { name: "영웅 능력", cost: 2, desc: "클래스 고유 스킬 발동", color: "from-slate-600 to-slate-800 border-slate-500", icon: "✨" };
    }
  };

  const handleUseHeroPower = () => {
    if (state.whosTurn !== 'player') return;
    if (state.player.mana < 2) {
      playSoundEffect('error');
      return;
    }
    if (state.player.usedHeroPower) {
      playSoundEffect('error');
      return;
    }

    const cls = state.player.heroClass;
    if (cls === 'Mage' || cls === 'Priest') {
      // Set targetingMode to 'hero_power' to allow choosing target on board
      setState(prev => ({
        ...prev,
        targetingMode: 'hero_power'
      }));
      playSoundEffect('play_spell');
    } else {
      // Instant execution (Paladin, Hunter, Warrior)
      setState(prev => {
        return executeHeroPower(prev, 'player', 'none');
      });
    }
  };

  function scaleTauntMinions(board: BoardMinion[]): BoardMinion[] {
    return board.filter(m => m.keywords.includes('Taunt') && m.currentHp > 0);
  }

  /**
   * Action visual click handles
   */

  // Interactive Click Hand Option Handler: selected cards in hand
  const handleSelectHandCard = (index: number) => {
    if (state.whosTurn !== 'player') return;

    const card = state.player.hand[index];
    if (state.player.mana < card.cost) {
      playSoundEffect('error');
      addLog(`❌ 마나가 부족합니다! 대검/카드 고르기 실패 (비용 ${card.cost} / 가용 마나 ${state.player.mana})`, 'SYSTEM');
      return;
    }

    // Check if card requires a targeting mode
    const untargetedEffects = ['gain_mana_one_turn', 'draw_card', 'heal_hero', 'whirlwind', 'aoe_enemies_all', 'aoe_enemies', 'destroy_all_minions', 'bloodlust', 'savage_roar', 'hero_strike_buff', 'destroy_weapon'];
    const isSpell = card.type === 'spell';
    const isBattlecry = card.keywords?.includes('Battlecry') || false;
    const effectId = card.effectId || '';
    
    const needsTarget = (isSpell && !untargetedEffects.includes(effectId)) || 
                        (isBattlecry && ['deal_damage', 'heal_target', 'silence_target', 'polymorph', 'shield_buff', 'full_heal_taunt', 'destroy_target', 'mark_of_wild'].includes(effectId));

    if (needsTarget) {
      setState(prev => ({
        ...prev,
        selectedActionCardIndex: index,
        targetingMode: 'spell',
        targetingSourceIndex: index
      }));
      addLog(`🎯 주문 및 전투의 함성 지목 완료: 전장의 하수인 또는 영웅 하나를 지정하여 마법을 해방하십시오!`, 'SYSTEM');
    } else {
      // Play immediately
      setState(prev => {
        const next = executePlayCardLocally(prev, 'player', index, 'none');
        return {
          ...next,
          selectedActionCardIndex: null,
          targetingMode: 'none'
        };
      });
    }
  };

  // Click on potential targets (Minions or Heros)
  const handleSelectTarget = (targetId: string) => {
    if (state.whosTurn !== 'player') return;

    if (state.targetingMode === 'spell' && state.selectedActionCardIndex !== null) {
      // Cast targeting spell
      const index = state.selectedActionCardIndex;
      const card = state.player.hand[index];
      
      if (card) {
        const effectId = card.effectId || '';
        const minionOnlyEffects = ['destroy_target', 'silence_target', 'polymorph', 'full_heal_taunt', 'shield_buff', 'mark_of_wild'];
        if (minionOnlyEffects.includes(effectId) && (targetId === 'player_hero' || targetId === 'ai_hero')) {
          playSoundEffect('error');
          setState(prev => {
            const nextLogs = [...prev.logs];
            nextLogs.push({
              id: generateId('sys'),
              timestamp: new Date().toLocaleTimeString(),
              turn: prev.turn,
              speaker: 'SYSTEM',
              text: `❌ [지정 불가] [${card.name}] 주문 특수 능력은 오직 하수인만을 대상으로 시전할 수 있으며 영웅 본체는 타격/저격할 수 없습니다!`
            });
            return {
              ...prev,
              logs: nextLogs
            };
          });
          return;
        }
      }

      setState(prev => {
        const next = executePlayCardLocally(prev, 'player', index, targetId);
        return {
          ...next,
          selectedActionCardIndex: null,
          targetingMode: 'none'
        };
      });
    } else if (state.targetingMode === 'attack' && state.selectedAttackerId !== null) {
      // Direct physical minion combat trigger
      const attackerId = state.selectedAttackerId;
      if (attackerId === 'player_hero') {
        // Hero attack
        setState(prev => {
          const next = executeHeroAttackLocally(prev, 'player', targetId);
          return {
            ...next,
            selectedAttackerId: null,
            targetingMode: 'none'
          };
        });
      } else {
        // Minion attack matches
        setState(prev => {
          const next = executeAttackLocally(prev, 'player', attackerId, targetId);
          return {
            ...next,
            selectedAttackerId: null,
            targetingMode: 'none'
          };
        });
      }
    } else if (state.targetingMode === 'hero_power') {
      setState(prev => {
        const next = executeHeroPower(prev, 'player', targetId);
        return {
          ...next,
          targetingMode: 'none'
        };
      });
    }
  };

  // Start selection mode to attack
  const handleSelectAttacker = (attackerId: string) => {
    if (state.whosTurn !== 'player') return;

    if (attackerId === 'player_hero') {
      if (!state.player.weapon || state.player.hasAttackedThisTurn) {
        playSoundEffect('error');
        return;
      }
    } else {
      const minion = state.player.board.find(m => m.id === attackerId);
      if (!minion || minion.isAsleep || minion.hasAttackedThisTurn) {
        playSoundEffect('error');
        return;
      }
    }

    setState(prev => ({
      ...prev,
      selectedAttackerId: attackerId,
      targetingMode: 'attack'
    }));
  };

  // Cancel any active selections
  const cancelActions = () => {
    setState(prev => ({
      ...prev,
      selectedActionCardIndex: null,
      selectedAttackerId: null,
      targetingMode: 'none'
    }));
  };


  /**
   * CLI Parsing engine for Command Controller Panel
   */

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const cmd = cliInput.trim().toLowerCase();
    setCliInput('');

    // Append user input directly to game log history
    addLog(`⌨️ [명령어]: "${cmd}"`, 'PLAYER');

    if (state.whosTurn !== 'player') {
      addLog(`❌ 현재는 AI 상대방이 치열한 두뇌 연산을 진행하는 중이므로 입력을 거부당합니다.`, 'SYSTEM');
      return;
    }

    // 1. End Turn regex matcher
    if (cmd === '턴 종료' || cmd === '엔드' || cmd === '턴종료' || cmd === 'end' || cmd === 'turn end' || cmd === '/end') {
      endTurn();
      return;
    }

    // 2. Play card matcher: e.g. "1번 카드 내기", "play 1", "/play 1"
    const playMatch = cmd.match(/^(\d+)번\s*(카드|하수인|주문|무기)?\s*(내기|시전|소환|사용)/) || cmd.match(/^(?:play|\/play)\s*(\d+)/);
    if (playMatch) {
      const handIndex = parseInt(playMatch[1]) - 1;
      if (handIndex >= 0 && handIndex < state.player.hand.length) {
        handleSelectHandCard(handIndex);
      } else {
        addLog(`❌ 오류: 패 범위를 이탈하였습니다. (현재 보유 패: 1~${state.player.hand.length}번)`, 'SYSTEM');
      }
      return;
    }

    // 3. Attack cmd matcher: e.g. "내 a로 상대 b 공격", "내 영웅으로 상대 b 공격"
    // Format: "내 [X]로 상대 [Y] 공격" or "A로 B 공격" or "attack [A] [B]"
    const attackHeroMatch = cmd.includes('영웅') && (cmd.includes('상대 영웅') || cmd.includes('명치') || cmd.includes('상대방'));
    if (attackHeroMatch) {
      if (state.player.weapon && !state.player.hasAttackedThisTurn) {
        handleSelectAttacker('player_hero');
        setTimeout(() => handleSelectTarget('ai_hero'), 100);
      } else {
        addLog(`❌ 오류: 영웅이 장착 중인 성검이 없거나 이미 공격을 마쳤습니다!`, 'SYSTEM');
      }
      return;
    }

    // Generalized minion to minion regex command parser
    const directAttackMatch = cmd.match(/(.+)(?:으로|로)\s*(.+)\s*공격/) || cmd.match(/^(?:attack)\s*(\S+)\s*(\S+)/);
    if (directAttackMatch) {
      const attackerKeyword = directAttackMatch[1].trim();
      const defenderKeyword = directAttackMatch[2].trim();

      // Look up attacker index/name on player board
      const attackerMinion = state.player.board.find(m => m.name.toLowerCase().includes(attackerKeyword) || attackerKeyword.includes(m.name.toLowerCase()));
      // Look up defender on AI board
      const defenderMinion = state.ai.board.find(m => m.name.toLowerCase().includes(defenderKeyword) || defenderKeyword.includes(m.name.toLowerCase()));
      const isDefendingHeroFace = defenderKeyword.includes('영웅') || defenderKeyword.includes('명치') || defenderKeyword.includes('상대');

      if (attackerMinion) {
        if (isDefendingHeroFace) {
          handleSelectAttacker(attackerMinion.id);
          setTimeout(() => handleSelectTarget('ai_hero'), 100);
        } else if (defenderMinion) {
          handleSelectAttacker(attackerMinion.id);
          setTimeout(() => handleSelectTarget(defenderMinion.id), 100);
        } else {
          addLog(`❌ 오류: 적 전장에서 대상 [${defenderKeyword}] 하수인을 찾지 못했습니다. 정확히 기재해주십시오.`, 'SYSTEM');
        }
      } else {
        addLog(`❌ 오류: 아군 전장에서 출발할 하수인 [${attackerKeyword}]를 찾지 못했습니다.`, 'SYSTEM');
      }
      return;
    }

    // 4. Default fall back warning
    addLog(`💬 안내: 명령어를 명확히 이해하지 못했습니다. 상단 리모컨 버튼 혹은 클릭 마우스를 통해 직관적으로 하수인을 다루거나 아래 명확한 규식을 추천합니다:
    - [X]번 카드 내기 (예: "1번 카드 내기")
    - 턴 종료
    - [내하수인]으로 [상대하수인] 공격 (예: "엘프궁수로 센진 공격")`, 'SYSTEM');
  };

  // Toggle a single card index for replacement in Mulligan phase
  const toggleMulliganReplace = (idx: number) => {
    playSoundEffect('draw');
    setMulliganReplaces(prev => {
      const next = [...prev];
      if (idx >= 0 && idx < next.length) {
        next[idx] = !next[idx];
      }
      return next;
    });
  };

  const handleConfirmMulligan = () => {
    playSoundEffect('victory');

    // Deep clone and prepare variables
    const nextState = JSON.parse(JSON.stringify(state));
    const player = nextState.player;
    const ai = nextState.ai;
    const logs = nextState.logs;

    const keptHand: Card[] = [];
    const replacedCards: Card[] = [];

    // Separate based on selection
    player.hand.forEach((card: Card, idx: number) => {
      if (mulliganReplaces[idx]) {
        replacedCards.push(card);
      } else {
        keptHand.push(card);
      }
    });

    // Shuffle the replaced cards back into the player's remaining deck
    const totalRemainingDeck = [...player.deck, ...replacedCards];
    const shuffle = (array: Card[]) => {
      const list = [...array];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    };
    player.deck = shuffle(totalRemainingDeck);

    // Draw replacements for the replaced cards
    const finalHand = [...keptHand];
    for (let i = 0; i < replacedCards.length; i++) {
      if (player.deck.length > 0) {
        const replacementCard = { ...player.deck[0], id: generateId('ply_mulli_draw') };
        player.deck = player.deck.slice(1);
        finalHand.push(replacementCard);
      }
    }
    player.hand = finalHand;

    // Log the replacement details
    if (replacedCards.length > 0) {
      logs.push({
        id: generateId('mulli'),
        timestamp: new Date().toLocaleTimeString(),
        turn: 1,
        speaker: 'SYSTEM',
        text: `🔄 멀리건 카드 교체 완료: 선택하신 [${replacedCards.map(c => c.name).join(', ')}] 카드를 덱에 섞고 새로운 카드 ${replacedCards.length}장을 다시 뽑았습니다.`
      });
    } else {
      logs.push({
        id: generateId('mulli'),
        timestamp: new Date().toLocaleTimeString(),
        turn: 1,
        speaker: 'SYSTEM',
        text: `👍 카드 교체 없이 원래 제시된 4장의 카드를 모두 들고 전장에 진입합니다.`
      });
    }

    const COIN_CARD: Card = {
      id: 'card_coin_token',
      templateId: 'card_coin_token',
      name: '동전 한 닢',
      cost: 0,
      type: 'spell',
      rarity: 'common',
      description: '이번 턴에만 사용할 수 있는 마나 크리스탈 1개를 획득합니다.',
      effectId: 'gain_mana_one_turn',
      effectValue: 1
    };

    // Apply first/second player conditions and Coin card
    if (state.isPlayerFirst) {
      // Player is first
      // AI is second, so AI gets 'The Coin' in their starting hand
      ai.hand.push({ ...COIN_CARD, id: generateId('ai_coin_inst') });

      logs.push({
        id: generateId('init_info'),
        timestamp: new Date().toLocaleTimeString(),
        turn: 1,
        speaker: 'GM',
        text: `⚔️ 이제 게임판의 첫 번째 턴이 진행됩니다! 플레이어님이 선공 [⚔️ 선공]입니다. 마침내 대결을 개시할 수 있습니다!`
      });

      player.mana = 1;
      player.maxMana = 1;

      nextState.player = player;
      nextState.ai = ai;
      nextState.phase = 'PLAY_PHASE';
      nextState.whosTurn = 'player';
      nextState.logs = logs;
      
      setState(nextState);
    } else {
      // AI is first
      // Player is second, so Player gets 'The Coin' in their starting hand!
      player.hand.push({ ...COIN_CARD, id: generateId('ply_coin_inst') });

      logs.push({
        id: generateId('init_info'),
        timestamp: new Date().toLocaleTimeString(),
        turn: 1,
        speaker: 'GM',
        text: `🪙 플레이어님은 후공 [🪙 후공]입니다! 특별 보급 카드인 [동전 한 닢]이 패에 추가되었습니다.`
      });
      logs.push({
        id: generateId('init_info'),
        timestamp: new Date().toLocaleTimeString(),
        turn: 1,
        speaker: 'GM',
        text: `⚔️ AI 대결자가 선공으로 먼저 움직입니다!`
      });

      ai.mana = 1;
      ai.maxMana = 1;

      const updatedState = {
        ...nextState,
        player,
        ai,
        phase: 'PLAY_PHASE' as const,
        whosTurn: 'ai' as const,
        logs
      };

      setState(updatedState);
      runAIOpponentTurnWithDelay(updatedState);
    }

    // Reset mulligan replacement selections
    setMulliganReplaces([false, false, false, false]);
  };

  // Reset helper
  const resetGame = () => {
    setState({
      phase: 'START_SCREEN',
      player: { hp: 30, maxHp: 30, armor: 0, mana: 1, maxMana: 1, deck: [], hand: [], board: [], weapon: null, hasAttackedThisTurn: false, usedHeroPower: false, fatigueCount: 0, cardDrawnCount: 0, heroClass: 'Mage', activeQuest: null },
      ai: { hp: 30, maxHp: 30, armor: 0, mana: 1, maxMana: 1, deck: [], hand: [], board: [], weapon: null, hasAttackedThisTurn: false, usedHeroPower: false, fatigueCount: 0, cardDrawnCount: 0, heroClass: 'Hunter', activeQuest: null },
      turn: 1,
      whosTurn: 'player',
      logs: [],
      roundSelected: 0,
      draftChoices: [],
      playerChosenDeck: '',
      winner: null,
      selectedActionCardIndex: null,
      selectedAttackerId: null,
      targetingMode: 'none'
    });
    setCustomDraftDeck([]);
    setCoachAdvice('');
    setBuilderSearch('');
    setBuilderCostFilter('all');
    setBuilderTypeFilter('all');
    setBuilderRarityFilter('all');
  };


  /**
   * Render helper variables
   */
  const currentLogsSorted = state.logs;

  return (
    <div className="min-h-screen hs-tavern-bg text-[#f1f3f7] font-sans flex flex-col antialiased selection:bg-amber-500/30 selection:text-white transition-all duration-300 relative overflow-x-hidden">
      {/* Tavern Title Header */}
      <header className="bg-[#180f0a]/92 backdrop-blur-md border-b-2 border-[#3e2516] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_6px_30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-slate-950 font-black text-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300/40 transform transition hover:rotate-6 cursor-pointer">
            M
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-amber-405 font-sans flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              마나 워즈 <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-mono tracking-wider font-extrabold shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">TEXT & BOARD</span>
            </h1>
            <p className="text-[11px] text-amber-100/70 font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">정통 룰과 아름다운 여관 배경을 완벽히 재현하는 덱 대전</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              playSoundEffect('play_spell');
              setIsRulebookOpen(true);
            }}
            className="flex items-center gap-2 text-[11px] text-amber-300 hover:text-amber-200 transition duration-200 bg-[#3a2010]/90 hover:bg-[#4d2d18] py-1.5 px-3.5 rounded-lg border border-amber-600/40 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            대여관 규칙서 (도움말)
          </button>

          <button 
            onClick={() => playSoundEffect('play_spell')} 
            className="flex items-center gap-2 text-[11px] text-amber-200/90 hover:text-amber-100 transition duration-200 bg-[#2b160b]/80 hover:bg-[#3d2112] py-1.5 px-3 rounded-lg border border-amber-900/30 cursor-pointer shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            효과음 테스트
          </button>
          
          {state.phase !== 'START_SCREEN' && (
            <button 
              onClick={resetGame}
              className="flex items-center gap-2 bg-[#421415]/90 hover:bg-[#5a1b1d] text-rose-200 text-[11px] py-1.5 px-3 rounded-lg border border-rose-900/60 transition duration-200 font-bold shadow-lg"
            >
              <RotateCw className="w-3.5 h-3.5" />
              대기실로 나가기
            </button>
          )}
        </div>
      </header>

      {/* Screen 1: Welcome & Draft Screen */}
      {state.phase === 'START_SCREEN' && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center animate-fade-in hs-candlelight">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <span className="text-[10px] bg-gradient-to-r from-amber-500/30 to-amber-700/30 text-amber-300 font-bold tracking-widest uppercase px-4 py-2 rounded-full border border-amber-400/35 mb-4 inline-block shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              🍺 WELCOME TO THE STONE INN 🍺
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#fafaf9] tracking-tight font-sans mt-3 mb-4 leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              대여관 침묵의 전장속에 오신 것을 환영합니다!
            </h2>
            <p className="text-amber-100/80 text-sm leading-relaxed font-sans max-w-xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium">
              본 게임은 정통 마나 워즈의 체력 30 규칙, 마나 증가, 도발 보호막, 전투의 함성, 돌진, 천상의 보호막, 죽음의 메아리를 철저히 시뮬레이션합니다. 
              플레이 방식은 아름다운 마우스 인터랙션과 키보드 명령어 프롬프트를 모두 지원합니다.
            </p>
          </div>

          {/* Elegant Hero Class Selection Screen */}
          <div className="bg-[#0b0c10]/75 border border-[#1b1c23] backdrop-blur-md rounded-2xl p-6 md:p-8 mb-12 shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500"></div>
            
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-lg font-black text-slate-100 font-sans tracking-wide">
                대전 직업 커스터마이징 (Class Customization Selection)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Player Class Column */}
              <div className="bg-[#12131a] p-5 rounded-xl border border-slate-800/40">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-blue-400 font-sans uppercase tracking-wider flex items-center gap-1.5">
                    🛡️ 나의 영웅 직업 선택
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    현재 선택: <strong className="text-blue-300 font-black">{translateHeroClass(selectedPlayerClass)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {(['Mage', 'Priest', 'Paladin', 'Hunter', 'Warrior'] as const).map((cls) => {
                    const hpi = getHeroPowerInfo(cls);
                    const isActive = selectedPlayerClass === cls;
                    return (
                      <button
                        key={`player-cls-${cls}`}
                        onClick={() => {
                          setSelectedPlayerClass(cls);
                          playSoundEffect('draw');
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all duration-300 group ${
                          isActive
                            ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                            : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                        title={`${translateHeroClass(cls)}: ${hpi.name} (${hpi.desc})`}
                      >
                        <span className="text-xl mb-1 filter drop-shadow hover:scale-110 transition">{hpi.icon}</span>
                        <span className={`text-[9px] font-black tracking-tighter ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                          {translateHeroClass(cls).split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Hero Power Preview Box */}
                {(() => {
                  const hpi = getHeroPowerInfo(selectedPlayerClass);
                  return (
                    <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 flex items-start gap-2.5 animate-fade-in">
                      <div className="text-lg p-1.5 bg-slate-900 rounded-md border border-slate-850 select-none">
                        {hpi.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-400">{hpi.name}</span>
                          <span className="text-[9px] text-blue-400 font-bold bg-blue-950/40 px-1.5 py-0.5 rounded font-mono border border-blue-500/10">Cost: 2 Mana</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans mt-1 leading-relaxed">
                          {hpi.desc}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Opponent Class Column */}
              <div className="bg-[#12131a] p-5 rounded-xl border border-slate-800/40">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-rose-400 font-sans uppercase tracking-wider flex items-center gap-1.5">
                    💀 상대 AI 대결 대리인 직업 선택
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    현재 선택: <strong className="text-rose-300 font-black">{translateHeroClass(selectedAiClass)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {(['Mage', 'Priest', 'Paladin', 'Hunter', 'Warrior'] as const).map((cls) => {
                    const hpi = getHeroPowerInfo(cls);
                    const isActive = selectedAiClass === cls;
                    return (
                      <button
                        key={`ai-cls-${cls}`}
                        onClick={() => {
                          setSelectedAiClass(cls);
                          playSoundEffect('draw');
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all duration-300 group ${
                          isActive
                            ? 'border-rose-500 bg-rose-500/10 scale-105 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                            : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                        title={`${translateHeroClass(cls)}: ${hpi.name} (${hpi.desc})`}
                      >
                        <span className="text-xl mb-1 filter drop-shadow hover:scale-110 transition">{hpi.icon}</span>
                        <span className={`text-[9px] font-black tracking-tighter ${isActive ? 'text-rose-400' : 'text-slate-400'}`}>
                          {translateHeroClass(cls).split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* AI Hero Power Preview Box */}
                {(() => {
                  const hpi = getHeroPowerInfo(selectedAiClass);
                  return (
                    <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 flex items-start gap-2.5 animate-fade-in">
                      <div className="text-lg p-1.5 bg-slate-900 rounded-md border border-slate-850 select-none">
                        {hpi.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-400">{hpi.name}</span>
                          <span className="text-[9px] text-rose-400 font-bold bg-rose-950/40 px-1.5 py-0.5 rounded font-mono border border-rose-500/10">Cost: 2 Mana</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans mt-1 leading-relaxed">
                          {hpi.desc}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <p className="text-center text-[9.5px] text-slate-500 mt-4 leading-relaxed font-sans">
              💡 선택한 직업의 <span className="text-amber-400 font-bold">고유 영웅 능력</span>이 전장의 초상화 옆에 생성됩니다. 모험 모드를 플레이할 시 적 리치 왕은 항상 전사로 고용됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Concept A: Prebuilt */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] hover:border-amber-400/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full group-hover:scale-125 transition duration-300"></div>
              <div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-5 border border-amber-500/20 shadow-[inset_0_2px_4px_rgba(245,158,11,0.05)]">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#f1f3f7] mb-2 group-hover:text-amber-400 transition duration-150">1. 프리빌트 테마 덱</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 font-sans">
                  카드 드래프트 단계를 건너뛰고, 입증된 세 가지 강력한 바닐라 컨셉 중 하나를 선택해 영광스럽게 쥐고 전투에 돌입합니다.
                </p>
                
                <div className="space-y-2 mb-6">
                  <button 
                    onClick={() => handleSelectPrebuilt('aggro')}
                    className="w-full text-left bg-[#13141c] hover:bg-[#1a1b26] text-slate-350 hover:text-[#f1f3f7] p-2.5 rounded-xl border border-[#21232e] hover:border-[#353849] text-xs flex justify-between items-center transition duration-200"
                  >
                    <span className="font-medium">위니 어그로 (Aggro)</span>
                    <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">속도공습</span>
                  </button>
                  <button
                    onClick={() => handleSelectPrebuilt('midrange')}
                    className="w-full text-left bg-[#13141c] hover:bg-[#1a1b26] text-slate-350 hover:text-[#f1f3f7] p-2.5 rounded-xl border border-[#21232e] hover:border-[#353849] text-xs flex justify-between items-center transition duration-200"
                  >
                    <span className="font-medium">지배 미드레인지 (Midrange)</span>
                    <span className="text-[9px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">가성비존중</span>
                  </button>
                  <button
                    onClick={() => handleSelectPrebuilt('control')}
                    className="w-full text-left bg-[#13141c] hover:bg-[#1a1b26] text-slate-350 hover:text-[#f1f3f7] p-2.5 rounded-xl border border-[#21232e] hover:border-[#353849] text-xs flex justify-between items-center transition duration-200"
                  >
                    <span className="font-medium">장막 컨트롤 (Control)</span>
                    <span className="text-[9px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">강력후반</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic text-center font-mono">즉시 매칭 개시</p>
            </div>

            {/* Concept B: Theme pack drafting */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] hover:border-purple-400/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full group-hover:scale-125 transition duration-300"></div>
              <div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-5 border border-purple-500/20 shadow-[inset_0_2px_4px_rgba(168,85,247,0.05)]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#f1f3f7] mb-2 group-hover:text-purple-400 transition duration-150">2. 테마 패키지 드래프트</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 font-sans">
                  선술집 마스터의 지휘 하에 4개 카드 세트가 총 10라운드 제시됩니다. 세트당 대단히 유연한 유수 카드가 함유되어 도합 40장의 덱 빌딩을 스마트하게 도와줍니다.
                </p>
              </div>
              <button 
                onClick={() => startDraftPhase('package')}
                className="w-full bg-[#181922] hover:bg-[#20212f] text-slate-200 hover:text-white font-bold py-2.5 px-4 rounded-xl border border-[#2c2d3d] hover:border-purple-500/40 transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                드래프트 입장 <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>

            {/* Concept C: Classic Arena drafting */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] hover:border-amber-400/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full group-hover:scale-125 transition duration-300"></div>
              <div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-5 border border-amber-500/20 shadow-[inset_0_2px_4px_rgba(245,158,11,0.05)]">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#f1f3f7] mb-2 group-hover:text-amber-400 transition duration-150">3. 정통 아레나 드래프트</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 font-sans">
                  정통 투기장 룰과 동일하게, 매 라운드 3가지 무작위 시그니처 카드 중 1장을 보듬어 도합 40장의 덱으로 무장합니다. 완벽한 커스터마이징을 자랑합니다.
                </p>
              </div>
              <button 
                onClick={() => startDraftPhase('arena')}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-650 hover:from-amber-400 hover:to-amber-550 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                아레나 입장 <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
              </button>
            </div>

            {/* Concept F: Custom Deck builder (자유 덱 제작소) */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full group-hover:scale-125 transition duration-300"></div>
              <div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-5 border border-emerald-500/20 shadow-[inset_0_2px_4px_rgba(16,185,129,0.05)]">
                  <Layers className="w-6 h-6 text-emerald-450 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-[#f1f3f7] mb-2 group-hover:text-emerald-400 transition duration-150">4. 자유 컬렉션 덱 메이커</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 font-sans">
                  선주문 제약 조건 없이 전체 카드 보관소에서 자유롭게 <strong>40장의 카드를 원클릭으로 선택</strong>하여 나만의 전술 덱을 직접 조합하고 완성해 대결을 승리로 이끕니다!
                </p>
              </div>
              <button 
                onClick={() => {
                  setCustomBuilderDeck([]);
                  setState(prev => ({ ...prev, phase: 'DECK_BUILDER_PHASE' }));
                  playSoundEffect('play_spell');
                }}
                className="w-full bg-[#181922] hover:bg-[#112d22]/50 text-slate-200 hover:text-emerald-300 font-bold py-2.5 px-4 rounded-xl border border-[#2c2d3d] hover:border-emerald-500/40 transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                제작소 입장 <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Row of Special Event Modes */}
          <div className="text-center mb-6 mt-2">
            <span className="text-[10px] bg-gradient-to-r from-teal-500/20 to-rose-500/20 text-teal-300 font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-teal-500/30 shadow-md inline-block animate-pulse">
              🔥 SPECIAL EVENT 대선술집 난투 & 모험 (Classic Events)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Concept D: Tavern Brawl */}
            <div className="bg-[#0b0c10]/80 border border-[#1b1c23] hover:border-teal-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(20,184,166,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-full group-hover:scale-125 transition duration-300"></div>
              <div>
                <div className="w-11 h-11 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 mb-4 border border-teal-500/20">
                  <Zap className="w-5.5 h-5.5 text-teal-400 animate-bounce" />
                </div>
                <h4 className="text-base font-extrabold text-[#f1f3f7] mb-2 group-hover:text-teal-300 transition duration-150">5. 선술집 난투 [마나 풍풍의 벼락]</h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-5 font-sans">
                  카드들을 직접 설계하기 귀찮습니까? 매 경기마다 무작위로 구성된 카드 40장 무작위 덱이 즉각 장전되며, <strong>1턴 시작부터 최대 한도 10 마나 결정</strong> 상태에서 초대형 하수인 전설 카드를 난사하는 초스피드 난설집 규칙입니다!
                </p>
              </div>
              <button 
                onClick={handleStartTavernBrawl}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-slate-50 font-extrabold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                난투 교차로 즉시 소환
              </button>
            </div>

            {/* Concept E: Solo Adventure Boss Fight */}
            <div className="bg-[#0b0c10]/80 border border-[#1b1c23] hover:border-rose-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full group-hover:scale-125 transition duration-300"></div>
              <div>
                <div className="w-11 h-11 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 mb-4 border border-rose-500/20">
                  <Skull className="w-5.5 h-5.5 text-rose-400 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <h4 className="text-base font-extrabold text-[#f1f3f7] mb-2 group-hover:text-rose-400 transition duration-150">6. 1인 모험 모드 [얼어붙은 왕좌: 리치 왕]</h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-5 font-sans">
                  무적의 혹한 군주 <strong>보스 리치 왕 (HP 45)</strong>이 저주의 검 <strong>서리한</strong>과 성기사 영웅 하수인 티리온을 소지한 기틀에서 맹진해 옵니다. 인간 연합군은 가장 완벽하게 밸런스 잡힌 미드레인지 덱을 들고 거전 사투를 벌입니다!
                </p>
              </div>
              <button 
                onClick={handleStartBossFight}
                className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-slate-50 font-extrabold py-2 px-4 rounded-xl shadow-lg transition-all duration-250 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                왕좌의 사투전 도전
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Screen 2-B: Custom Deck Builder View */}
      {state.phase === 'DECK_BUILDER_PHASE' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 animate-fade-in text-sans relative z-10">
          
          {/* Card Catalog / Selection Area */}
          <div className="flex-1 flex flex-col gap-4 bg-[#110b07]/90 backdrop-blur-md border-2 border-[#3e2516] p-4 md:p-6 rounded-2xl shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#3e2516]/40">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">✦ CARDS REPOSITORY ✦</span>
                <h2 className="text-2xl font-black text-[#f5f5f4] tracking-tight flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  마나 워즈 자유 카드 보관소
                </h2>
                <p className="text-xs text-amber-100/60 font-medium">검색과 마나 크리스탈 필터를 활용해 원하는 전술을 신속히 발굴하십시오.</p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-[#1a110a] border border-[#3e2516] px-3 py-1.5 rounded-xl">
                <span className="text-slate-400">선택한 직업:</span>
                <span className="font-extrabold text-amber-400">{selectedPlayerClass}</span>
              </div>
            </div>

            {/* Filter Section */}
            <div className="space-y-4 bg-[#160d08]/80 p-4 rounded-xl border border-[#3e2516]/40 shadow-inner">
              {/* Search text box and dynamic filter tags */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={builderSearch}
                    onChange={(e) => setBuilderSearch(e.target.value)}
                    placeholder="카드 이름 또는 키워드 설명 검색 (예: 돌진, 도발...)"
                    className="w-full bg-[#1a0f0a] border border-[#52331c] text-[#f1f3f7] rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-amber-400/60 transition shadow-inner font-semibold placeholder:text-slate-500 animate-fade-in"
                  />
                  {builderSearch && (
                    <button 
                      onClick={() => setBuilderSearch('')} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sub-Filters: Type, Rarity */}
                <div className="flex gap-2">
                  <select
                    value={builderTypeFilter}
                    onChange={(e: any) => setBuilderTypeFilter(e.target.value)}
                    className="bg-[#1a0f0a] border border-[#52331c] text-[#f1f3f7] rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400/65 font-bold cursor-pointer"
                  >
                    <option value="all">모든 종류 (All)</option>
                    <option value="minion">하수인 (Minion)</option>
                    <option value="spell">주문 (Spell)</option>
                    <option value="weapon">무기 (Weapon)</option>
                  </select>

                  <select
                    value={builderRarityFilter}
                    onChange={(e: any) => setBuilderRarityFilter(e.target.value)}
                    className="bg-[#1a0f0a] border border-[#52331c] text-[#f1f3f7] rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400/65 font-bold cursor-pointer"
                  >
                    <option value="all">모든 등급 (All)</option>
                    <option value="common">일반 (Common)</option>
                    <option value="rare">희귀 (Rare)</option>
                    <option value="epic">영웅 (Epic)</option>
                    <option value="legendary">전설 (Legendary)</option>
                  </select>
                </div>
              </div>

              {/* Mana Crystals Cost Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-amber-200/70 font-bold mr-2">마나 비용:</span>
                {(['all', '0', '1', '2', '3', '4', '5', '6', '7+'] as const).map(cost => {
                  const isActive = builderCostFilter === cost;
                  return (
                    <button
                      key={cost}
                      onClick={() => setBuilderCostFilter(cost)}
                      className={`h-7 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        isActive 
                          ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-300' 
                          : 'bg-[#221309] hover:bg-[#321c0e] text-amber-100/80 border border-[#502e17]'
                      }`}
                    >
                      {cost === 'all' ? '전체' : cost === '7+' ? '7+' : cost}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable grid of filtered choices */}
            {(() => {
              const filteredCards = CARD_POOL.filter(card => {
                const matchSearch = card.name.toLowerCase().includes(builderSearch.toLowerCase()) || 
                                    (card.description && card.description.toLowerCase().includes(builderSearch.toLowerCase()));
                
                let matchCost = true;
                if (builderCostFilter !== 'all') {
                  if (builderCostFilter === '7+') {
                    matchCost = card.cost >= 7;
                  } else {
                    matchCost = card.cost === parseInt(builderCostFilter);
                  }
                }
                const matchType = builderTypeFilter === 'all' || card.type === builderTypeFilter;
                const matchRarity = builderRarityFilter === 'all' || card.rarity === builderRarityFilter;

                return matchSearch && matchCost && matchType && matchRarity;
              });

              if (filteredCards.length === 0) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-[#140d09]/45 rounded-xl border border-dashed border-[#3e2516]/40">
                    <Layers className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
                    <p className="text-slate-400 font-semibold text-sm">해당 필터 조건에 부합하는 카드가 없습니다.</p>
                    <p className="text-xs text-slate-500 mt-1">다른 검색어 혹은 마나 선택지를 조율해 주십시오.</p>
                  </div>
                );
              }

              return (
                <div className="flex-1 max-h-[580px] overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-[#0c0704]/60 p-2.5 rounded-xl border border-[#3e2516]/50 shadow-inner">
                  {filteredCards.map(card => {
                    const currentCount = customBuilderDeck.filter(c => c.id === card.id).length;
                    const maxAllowed = card.rarity === 'legendary' ? 1 : 2;
                    const isFullyDrafted = currentCount >= maxAllowed;

                    let rarityBorderColor = 'border-slate-800/85';
                    let rarityBadgeBg = 'bg-slate-500/15 text-slate-350 border-slate-500/25';
                    let rarityGlowClass = '';
                    if (card.rarity === 'rare') {
                      rarityBorderColor = 'border-blue-900/90';
                      rarityBadgeBg = 'bg-blue-500/10 text-blue-300 border-blue-500/25';
                      rarityGlowClass = 'hover:shadow-[0_0_15px_rgba(59,130,246,0.35)]';
                    } else if (card.rarity === 'epic') {
                      rarityBorderColor = 'border-purple-900/90';
                      rarityBadgeBg = 'bg-purple-500/10 text-purple-300 border-purple-500/25';
                      rarityGlowClass = 'hover:shadow-[0_0_15px_rgba(168,85,247,0.35)]';
                    } else if (card.rarity === 'legendary') {
                      rarityBorderColor = 'border-amber-600/90';
                      rarityBadgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/25';
                      rarityGlowClass = 'card-legendary-glow hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]';
                    }

                    return (
                      <div
                        key={card.id}
                        onClick={() => handleAddCardToBuilder(card)}
                        className={`bg-[#170e0a] border-2 rounded-xl p-3 flex flex-col justify-between h-[210px] relative group select-none cursor-pointer transition-all duration-200 ${rarityBorderColor} ${rarityGlowClass} ${
                          isFullyDrafted ? 'opacity-40 hover:opacity-50' : 'hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Mana circle */}
                        <div className="absolute top-2 left-2 w-[26px] h-[26px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-full border border-blue-200 flex items-center justify-center shadow-lg">
                          <span className="text-white text-xs font-black font-mono leading-none">{card.cost}</span>
                        </div>

                        {/* Rarity & Count indicators */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-extrabold ${rarityBadgeBg}`}>
                            {card.rarity === 'legendary' ? '전설' : card.rarity === 'epic' ? '영웅' : card.rarity === 'rare' ? '희귀' : '일반'}
                          </span>
                          {currentCount > 0 && (
                            <span className="text-[10px] bg-emerald-500 text-slate-955 font-black px-1.5 py-0.2 rounded-full border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                              x{currentCount}
                            </span>
                          )}
                        </div>

                        {/* Card Name */}
                        <div className="mt-8 mb-1.5">
                          <h4 className="text-[12px] font-black text-[#fafafa] leading-tight tracking-tight line-clamp-1 group-hover:text-amber-400 transition">
                            {card.name}
                          </h4>
                        </div>

                        {/* Card Description */}
                        <p className="text-[9.5px] text-slate-300/90 leading-relaxed font-sans line-clamp-4 flex-1">
                          {card.description}
                        </p>

                        {/* Attack & HP/Durability panel */}
                        <div className="mt-2 pt-1 border-t border-[#3e2516]/30 flex justify-between items-center">
                          {card.atk !== undefined ? (
                            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-extrabold">
                              <Sword className="w-3 h-3" />
                              <span className="font-mono">{card.atk}</span>
                            </div>
                          ) : (
                            <div />
                          )}

                          {card.hp !== undefined ? (
                            <div className="flex items-center gap-0.5 text-xs text-rose-500 font-extrabold">
                              <Heart className="w-3 h-3" />
                              <span className="font-mono">{card.hp}</span>
                            </div>
                          ) : card.durability !== undefined ? (
                            <div className="flex items-center gap-0.5 text-xs text-cyan-400 font-extrabold">
                              <Shield className="w-3 h-3" />
                              <span className="font-mono">{card.durability}</span>
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Building Deck Tracker Drawer */}
          <div className="w-full lg:w-80 flex flex-col gap-4 bg-[#180f0a]/92 backdrop-blur-md border-2 border-[#3e2516] p-4 md:p-5 rounded-2xl shadow-2xl shrink-0">
            <div className="pb-3 border-b border-[#3e2516]/40 text-center sm:text-left">
              <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-bold tracking-wider animate-pulse">
                ACTIVE BUILD DECK
              </span>
              <h3 className="text-lg font-black text-[#fdfdfd] mt-1">나의 구축 덱 (Deck)</h3>
              <p className="text-[11px] text-slate-400/90 font-medium">마나 워즈 대전 규칙: 딱 40장을 채우십시오.</p>
            </div>

            {/* Deck size status & visual bar */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[11px] text-slate-400 font-semibold">현재 누적 장수:</span>
                <span className="text-xl font-mono font-black text-amber-400 flex items-baseline gap-0.5">
                  <span>{customBuilderDeck.length}</span>
                  <span className="text-xs text-slate-500 font-semibold font-sans">/ 40 장</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-[#52331c]">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    customBuilderDeck.length === 40 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (customBuilderDeck.length / 40) * 100)}%` }}
                />
              </div>
            </div>

            {/* Deck List - Grouped and sorted cleanly */}
            <div className="flex-1 min-h-[220px] max-h-[420px] overflow-y-auto pr-1 bg-[#0c0704]/90 rounded-xl border border-[#3e2516]/50 p-2.5 space-y-1 hover:border-[#52331c] transition">
              {(() => {
                const groupedDeckMap = new Map<string, { card: Card, count: number }>();
                customBuilderDeck.forEach(c => {
                  const key = c.id;
                  const existing = groupedDeckMap.get(key);
                  if (existing) {
                    existing.count += 1;
                  } else {
                    groupedDeckMap.set(key, { card: c, count: 1 });
                  }
                });
                const sortedGroupedDeck = Array.from(groupedDeckMap.values()).sort((a,b) => {
                  if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
                  return a.card.name.localeCompare(b.card.name);
                });

                if (sortedGroupedDeck.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                      <Layers className="w-8 h-8 text-neutral-700 mb-1.5" />
                      <p className="text-xs text-slate-500 font-semibold">선택된 카드가 없습니다.</p>
                      <p className="text-[10px] text-slate-500 mt-1 px-4">왼쪽의 보관소 카드를 클릭해 직접 담으십시오.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1">
                    {sortedGroupedDeck.map(({ card, count }) => {
                      return (
                        <div
                          key={card.id + '_side'}
                          onClick={() => handleRemoveCardFromBuilder(card.id)}
                          className="group/item flex items-center justify-between bg-[#19100a] hover:bg-rose-950/35 border border-[#3e2516]/45 hover:border-rose-900/40 p-1.5 rounded-lg text-xs transition duration-150 cursor-pointer select-none animate-fade-in"
                          title="클릭하시면 덱에서 1장 제거합니다"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black font-mono shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                              {card.cost}
                            </div>
                            <span className="font-extrabold text-[#edebe6] line-clamp-1 text-[11px] group-hover/item:text-rose-200 transition">
                              {card.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {count > 1 ? (
                              <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[10px] shadow">
                                x{count}
                              </span>
                            ) : (
                              <span className="bg-[#2a1b12] text-amber-200/80 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                                x1
                              </span>
                            )}
                            <Trash2 className="w-3.5 h-3.5 text-slate-550 group-hover/item:text-rose-450 opacity-0 group-hover/item:opacity-100 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Quick Actions Board */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRandomFillBuilder}
                disabled={customBuilderDeck.length >= 40}
                className="bg-[#2a170e] hover:bg-[#3d2315] disabled:opacity-40 text-amber-200 border border-[#52331c] text-[11px] py-2 px-3 rounded-xl transition duration-150 font-bold cursor-pointer shadow-md"
              >
                무작위 채우기
              </button>
              <button
                onClick={() => {
                  playSoundEffect('play_spell');
                  setCustomBuilderDeck([]);
                }}
                disabled={customBuilderDeck.length === 0}
                className="bg-[#331114] hover:bg-[#4d161b] disabled:opacity-40 text-rose-300 border border-rose-900/40 text-[11px] py-2 px-3 rounded-xl transition duration-150 font-bold cursor-pointer"
              >
                전체 초기화
              </button>
            </div>

            {/* Play trigger button */}
            <div className="pt-2">
              <button
                onClick={handleStartCustomBuilderBattle}
                disabled={customBuilderDeck.length !== 40}
                className={`w-full text-xs py-3 px-4 rounded-xl font-black shadow-xl tracking-wider transition-all duration-350 cursor-pointer flex items-center justify-center gap-1.5 ${
                  customBuilderDeck.length === 40
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-300/40 animate-pulse'
                    : 'bg-[#221a14] border border-[#3c2a1c] text-slate-550 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {customBuilderDeck.length === 40 ? '커스텀 덱으로 대전 시작!' : '40장을 완성해 주십시오.'}
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                playSoundEffect('play_spell');
                setState(prev => ({ ...prev, phase: 'START_SCREEN' }));
              }}
              className="mt-1 text-center text-[11px] text-amber-300 hover:text-amber-200 transition underline underline-offset-4 cursor-pointer font-bold"
            >
              대기실 메인으로 돌아가기
            </button>
          </div>
        </main>
      )}

      {/* Screen 2: Drafting Choice Panel */}
      {(state.phase === 'DRAFT_PACHAGE_PHASE' || state.phase === 'DRAFT_ARENA_PHASE') && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center animate-fade-in text-sans">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[#0b0c10] p-5 rounded-2xl border border-[#1b1c23] shadow-lg">
            <div>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">✦ DRAFT HALL ✦</span>
              <h2 className="text-xl font-bold flex items-center gap-2 mt-1 text-[#f8fafc]">
                {state.phase === 'DRAFT_PACHAGE_PHASE' ? '테마 패키지 드래프트 룸' : '정통 투기장 아레나 드래프트 룸'}
              </h2>
            </div>
            <div className="border border-[#20212f] bg-[#12131b] py-2 px-4 rounded-xl text-left sm:text-right">
              <p className="text-[11px] text-slate-400 font-medium">현재 영입 완료된 카드 규모</p>
              <p className="text-[22px] font-mono font-black text-amber-400 flex items-center gap-1.5 sm:justify-end">
                <span>{customDraftDeck.length}</span>
                <span className="text-xs text-slate-500 font-semibold font-sans">/ 40 장</span>
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-slate-300 font-medium">
              선택 라운드 <span className="text-amber-400 font-bold text-lg font-mono">{state.roundSelected}</span> / {state.phase === 'DRAFT_PACHAGE_PHASE' ? '10' : '40'} : 제시된 세 장 중 전술에 최적화된 하나를 선발하십시오.
            </p>
          </div>

          {/* Golden Coaching Box - AI helper integration */}
          <div className="bg-[#10111a]/95 border border-amber-500/25 rounded-2xl p-5 mb-8 max-w-2xl mx-auto w-full group relative overflow-hidden shadow-[0_4px_25px_rgba(245,158,11,0.04)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0 border border-amber-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.1)]">
                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-400 mb-1.5 font-sans tracking-wide">인공지능 대여관 마스터의 드래프트 조언</p>
                {coachLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1 font-sans">
                    <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    현재 덱 구성의 균형과 공수 비율을 분석하여 연산하고 있습니다...
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{coachAdvice}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cards to pick */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full mb-10">
            {state.draftChoices[0]?.map((card, idx) => {
              const rarityGlow = 
                card.rarity === 'legendary' ? 'shadow-[0_4px_20px_rgba(245,158,11,0.06)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.22)] border-amber-500/20 hover:border-amber-400' :
                card.rarity === 'epic' ? 'shadow-[0_4px_20px_rgba(168,85,247,0.06)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.22)] border-purple-500/20 hover:border-purple-400' :
                card.rarity === 'rare' ? 'shadow-[0_4px_20px_rgba(59,130,246,0.06)] hover:shadow-[0_4px_30px_rgba(59,130,246,0.22)] border-blue-500/20 hover:border-blue-400' :
                'shadow-[0_4px_20px_rgba(148,163,184,0.03)] hover:shadow-[0_4px_30px_rgba(148,163,184,0.15)] border-[#20212e] hover:border-slate-400';
              
              const rarityTextBg =
                card.rarity === 'legendary' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                card.rarity === 'epic' ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' :
                card.rarity === 'rare' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' :
                'bg-slate-500/10 text-slate-400 border-slate-500/25';

              return (
                <button
                  key={card.id + '_' + idx}
                  onClick={() => handlePickDraftCard(idx, state.phase === 'DRAFT_PACHAGE_PHASE' ? 'package' : 'arena')}
                  className={`bg-[#0b0c10] border-2 ${rarityGlow} rounded-2xl p-6 transition-all duration-300 text-left flex flex-col justify-between h-[360px] relative group overflow-hidden cursor-pointer`}
                >
                  <div className={`absolute top-0 left-0 w-full h-[3px] ${
                    card.rarity === 'legendary' ? 'bg-amber-500' :
                    card.rarity === 'epic' ? 'bg-purple-500' :
                    card.rarity === 'rare' ? 'bg-blue-500' : 'bg-slate-600'
                  }`}></div>

                  <div className="w-full">
                    <div className="flex justify-between items-start mb-4">
                      {/* Mana cost emblem */}
                      <span className="w-8 h-8 rounded-full bg-blue-605 font-mono text-sm font-black flex items-center justify-center text-slate-50 shadow-[0_2px_6px_rgba(37,99,235,0.3)] border border-blue-400/30">
                        {card.cost}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${rarityTextBg}`}>
                        {card.rarity}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#f1f3f7] group-hover:text-amber-400 transition-colors duration-250 mb-1 leading-snug">{card.name}</h3>
                    <p className="text-[9px] bg-[#14151f] border border-[#232431] text-slate-400 font-semibold rounded px-2 py-0.5 inline-block mb-3">
                      {card.type === 'minion' ? '🛡️ 하수인' : card.type === 'spell' ? '🔮 주문' : '⚔️ 무기'}
                    </p>
                    
                    <p className="text-slate-300 text-xs leading-relaxed mt-2 p-2.5 bg-[#12131a]/70 rounded-xl border border-[#20212e]/50 min-h-[85px] font-sans">
                      {card.description}
                    </p>
                  </div>

                  <div className="w-full flex items-center justify-between border-t border-[#1b1c23] pt-4 font-mono">
                    {card.type === 'minion' && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                          <Sword className="w-3.5 h-3.5" />
                          <span>공격력 {card.atk}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                          <Heart className="w-3.5 h-3.5" />
                          <span>체력 {card.hp}</span>
                        </div>
                      </div>
                    )}
                    {card.type === 'weapon' && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                          <Sword className="w-3.5 h-3.5" />
                          <span>공격력 {card.atk}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                          <Shield className="w-3.5 h-3.5" />
                          <span>내 durability {card.durability}</span>
                        </div>
                      </div>
                    )}
                    {card.type === 'spell' && <span className="text-[10px] text-slate-500 font-sans font-medium">일회성 주문 격발</span>}
                    
                    {card.keywords && card.keywords.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {card.keywords.map(kw => (
                          <span key={kw} className="text-[9px] bg-[#1a1b24] text-slate-300 px-2 py-0.5 rounded-md border border-[#2b2d3d] font-bold">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetGame}
              className="bg-[#12131b]/90 hover:bg-[#191b26] text-slate-400 hover:text-[#f8fafc] border border-[#222332] hover:border-[#383a52] rounded-xl px-5 py-2.5 transition duration-200 text-xs font-bold cursor-pointer shadow-md"
            >
              대기방으로 돌아가기
            </button>
          </div>
        </main>
      )}

      {/* Screen 2.5: Mulligan Phase (카드 4개 선택 교체) */}
      {state.phase === 'MULLIGAN_PHASE' && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col items-center justify-center gap-8 animate-fade-in text-sans select-none">
          {/* Header */}
          <div className="text-center max-w-2xl">
            <span className="text-[11px] font-black tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full uppercase">
              ✦ MULLIGAN PHASE ✦
            </span>
            <h1 className="text-3xl font-black text-slate-50 mt-4 tracking-tight drop-shadow-md">
              첫 손패 전술 결정
            </h1>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              실제 마나 워즈 게임 방식처럼 4장의 카드가 선별되었습니다. 갖기 싫은 카드를 마우스로 클릭하여 <span className="text-red-400 font-extrabold font-mono">X 교체표시</span>로 지정하십시오. 해당 카드를 내 덱에 다시 섞어 넣고 새로운 무작위 카드로 긴급 대체된 후 본격 전장 대전을 개시합니다.
            </p>
          </div>

          {/* Random Coin Toss Result card status board */}
          <div className="w-full bg-[#0c0d12] border border-[#1b1c23] rounded-2xl p-5 text-center flex flex-col items-center gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-widest">선공 / 후공 추첨 결과</span>
            {state.isPlayerFirst ? (
              <div>
                <p className="text-base font-black text-emerald-400 flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-xl">⚔️</span> 당신의 선공 (First Attack) 결정!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  플레이어님이 첫 번째 라운드 공격자격(선공)을 얻었습니다. 상대 AI대결자는 후공 보너스로 <span className="text-amber-400 font-bold">[동전 한 닢]</span> 한 장을 패에 들고 방어를 대기합니다.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base font-black text-amber-400 flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-xl">🪙</span> 당신의 후공 (Second Attack) 결정!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  AI 상대방이 첫 번째 라운드 선공 자격을 얻었습니다. 플레이어님께는 후공 보너스로 0마나 비용으로 즉석 기강 마나 +1을 채워 주는 수호 주문 카드인 <span className="text-amber-400 font-bold">[동전 한 닢]</span>이 보급품으로 긴급 투하됩니다!
                </p>
              </div>
            )}
          </div>

          {/* Hand Card Lists (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full justify-center max-w-3xl">
            {state.player.hand.slice(0, 4).map((card, idx) => {
              const isToReplace = mulliganReplaces[idx];
              return (
                <button
                  key={card.id + '_mulligan_' + idx}
                  onClick={() => toggleMulliganReplace(idx)}
                  className={`relative aspect-[3/4] rounded-2xl p-4 flex flex-col justify-between text-left overflow-hidden transition-all duration-350 transform border select-none cursor-pointer group ${
                    isToReplace
                      ? 'border-red-500 bg-red-950/20 ring-4 ring-red-500/30 scale-[0.96] opacity-85'
                      : 'border-[#222436] bg-[#0c0d12] hover:border-amber-500 hover:scale-[1.04] shadow-[0_4px_15px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {/* Cost badge */}
                  <div className={`w-6 h-6 rounded-full font-mono font-black text-[11px] flex items-center justify-center text-slate-50 absolute top-2.5 left-2.5 shadow-md ${
                    isToReplace ? 'bg-red-650 border border-red-500' : 'bg-blue-600 border border-blue-400'
                  }`}>
                    {card.cost}
                  </div>

                  {/* Rarity small card badge line */}
                  <div className={`absolute top-0 right-0 w-10 h-[3px] rounded ${
                    card.rarity === 'legendary' ? 'bg-amber-500' :
                    card.rarity === 'epic' ? 'bg-purple-500' :
                    card.rarity === 'rare' ? 'bg-blue-500' : 'bg-slate-600'
                  }`}></div>

                  <div className="mt-6 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-tight line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {card.name}
                    </h3>
                    <span className="text-[7.5px] text-slate-400 bg-black/60 border border-slate-800 rounded px-1 py-0.5 mt-1 inline-block self-start uppercase font-bold tracking-wide">
                      {card.type === 'minion' ? '하수인' : card.type === 'spell' ? '주문' : '무기'}
                    </span>
                  </div>

                  <div className="border-t border-slate-800/80 pt-1.5 flex-1 mt-2">
                    <p className="text-[9px] text-[#94a3b8] leading-normal line-clamp-4">
                      {card.description}
                    </p>
                  </div>

                  {/* Stats if minion or weapon */}
                  {(card.atk !== undefined || card.hp !== undefined) && (
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-800/30">
                      {card.atk !== undefined && (
                        <span className="text-[9px] font-black text-amber-400 flex items-center gap-0.5">
                          🗡️ {card.atk}
                        </span>
                      )}
                      {card.hp !== undefined && (
                        <span className="text-[9px] font-black text-red-400 flex items-center gap-0.5">
                          ❤️ {card.hp}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Red Overlay when selected for replacement */}
                  {isToReplace && (
                    <div className="absolute inset-0 bg-red-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-center transition-all duration-200">
                      <div className="w-10 h-10 rounded-full bg-red-650 flex items-center justify-center text-slate-50 text-xl font-bold border border-red-500/30">
                        ✕
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-[#fecaca] uppercase">
                        교체 대상 지정됨 (Swap)
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col items-center gap-4 w-full max-w-sm mt-4">
            <button
              onClick={handleConfirmMulligan}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-50 font-black text-sm py-4 px-6 rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
            >
              선택한 카드 교체 완료 및 대결 시작!
            </button>
            
            <button
              onClick={resetGame}
              className="text-[#94a3b8] hover:text-slate-200 text-xs font-semibold underline cursor-pointer"
            >
              대기방으로 돌아가기
            </button>
          </div>
        </main>
      )}

      {/* Screen 3: Main Active Play Battle Arena */}
      {state.phase === 'PLAY_PHASE' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative animate-fade-in text-sans">
          
          {/* Left panel & Interactive Board Map: 8 Columns space */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Arena Board Grid */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] rounded-3xl p-6 flex flex-col justify-between min-h-[640px] relative overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.8)]">
              
              {/* Field Grid decorative thin gold timeline divider background */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/15 to-transparent -translate-y-1/2 pointer-events-none"></div>

              {/* SECTION A: ENEMY PANEL (AI Opponent Host) */}
              <div className="flex flex-col md:flex-row justify-between items-center border-b border-[#14151f] pb-5 gap-4">
                {/* AI Stats (Left Side) */}
                <div className="flex items-center gap-3 order-2 md:order-1">
                  <div className="text-left font-sans">
                    <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest bg-rose-950/30 px-2 py-0.5 rounded border border-rose-500/10 select-none">
                      AI DECK STATS
                    </span>
                    <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-slate-400 select-none">
                      <span className="bg-[#10111a] border border-[#20212f]/60 px-2 py-0.5 rounded">패: {state.ai.hand.length}장</span>
                      <span className="bg-[#10111a] border border-[#20212f]/60 px-2 py-0.5 rounded">덱: {state.ai.deck.length}장</span>
                    </div>
                  </div>
                </div>

                {/* AI Hearthstone Oval Hero Portrait (Centered) */}
                <div className="flex flex-col items-center order-1 md:order-2 flex-1 md:max-w-xs justify-center relative">
                  {state.whosTurn === 'ai' && (
                    <span className="absolute -top-6 px-2.5 py-0.5 bg-rose-600 font-black text-slate-50 rounded-md font-sans text-[8px] tracking-widest uppercase animate-pulse shadow-md select-none z-10">
                      ⚔️ 적 대결자 턴 계산 중...
                    </span>
                  )}
                  
                  {/* Interactive Button */}
                  <button 
                    onClick={() => {
                      if (state.targetingMode === 'spell' || state.targetingMode === 'attack' || state.targetingMode === 'hero_power') {
                        handleSelectTarget('ai_hero');
                      }
                    }}
                    disabled={!(state.targetingMode === 'spell' || state.targetingMode === 'attack' || state.targetingMode === 'hero_power')}
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative bg-gradient-to-b from-[#1c1d29] to-[#04050a] ${
                      state.whosTurn === 'ai' ? 'border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.35)]' : 'border-[#2c2d3e]'
                    } ${
                      (state.targetingMode === 'spell' || state.targetingMode === 'attack' || state.targetingMode === 'hero_power') ?
                      'border-rose-500 cursor-crosshair hover:scale-[1.08] shadow-[0_0_22px_rgba(239,68,68,0.7)] ring-4 ring-rose-500/30 animate-pulse' : ''
                    } group`}
                    title={
                      state.targetingMode === 'spell' ? '이 주문으로 상대 영웅 저격 시전' :
                      state.targetingMode === 'hero_power' ? '영웅 능력 표적 공격/치유 시전' :
                      state.targetingMode === 'attack' ? '적 영웅 본체 직접 타격 가능!' : '상대 영웅 본체 (도발 하수인이 있을 시 제한)'
                    }
                  >
                    {/* Shadow profile overlay */}
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-0">
                      <Crown className={`w-8 h-8 ${state.gameMode === 'boss_fight' ? 'text-blue-300 animate-pulse' : state.whosTurn === 'ai' ? 'text-amber-400' : 'text-slate-400'} group-hover:text-amber-300 transition-colors duration-150`} />
                      <div className="absolute inset-x-0 bottom-0 bg-[#061e38]/90 py-0.5 text-center font-mono text-[8px] font-black text-sky-200 select-none uppercase tracking-wider">
                        {state.gameMode === 'boss_fight' ? 'LICH KING' : 'RIVAL AI'}
                      </div>
                    </div>

                    {/* Active Quest Badge Overlay (Top-Left) */}
                    {state.ai.activeQuest && (
                      <div 
                        className="absolute -top-1.5 -left-1.5 bg-gradient-to-br from-teal-500 to-emerald-600 border-2 border-[#10b981] text-teal-100 font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse z-10 text-[9px] cursor-help"
                        title={`상대 퀘스트 활성화됨!\n${state.ai.activeQuest.name} (${state.ai.activeQuest.progress}/${state.ai.activeQuest.target})`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        ❓
                      </div>
                    )}

                    {/* Hearthstone Teardrop Health Badge Overlay (Bottom-Right) */}
                    <div className="absolute -bottom-1 -right-2 bg-gradient-to-br from-rose-600 to-red-600 border-2 border-red-300 text-slate-50 font-mono text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-all select-none z-10" title="적 영웅 생명력">
                      {state.ai.hp}
                    </div>

                    {/* Mana Crystal badge (Bottom-Left) */}
                    <div className="absolute -bottom-1 -left-2 bg-gradient-to-br from-blue-600 to-sky-600 border-2 border-blue-300 text-slate-50 font-mono text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg select-none z-10" title="적 영웅 마나">
                      {state.ai.mana}
                    </div>

                    {/* Armor shield overlay (Top-Right) */}
                    {state.ai.armor > 0 && (
                      <div className="absolute -top-1 -right-2 bg-gradient-to-br from-slate-400 to-slate-500 border-2 border-slate-300 text-slate-100 font-mono text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center shadow-md animate-bounce" title="상대 방어도">
                        🛡️{state.ai.armor}
                      </div>
                    )}
                  </button>
                  <div className="flex flex-col items-center mt-1.5 gap-0.5">
                    <span className="text-[10px] text-indigo-400 font-black tracking-wide bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                      💀 {translateHeroClass(state.ai.heroClass)}
                    </span>
                    <span className="text-[9px] text-slate-500 font-extrabold font-sans tracking-wide">
                      {state.gameMode === 'boss_fight' ? (
                        <span className="text-sky-400 animate-pulse font-extrabold flex items-center gap-1">❄️ 보스: 리치 왕 (혹한의 군주)</span>
                      ) : (
                        '여관 대표 AI 대결자 (타격 대상)'
                      )}
                    </span>
                  </div>
                </div>

                {/* AI Weapon Side (Right Side) */}
                <div className="flex items-center gap-3 order-3">
                  {state.ai.weapon ? (
                    <div className="bg-[#121319] border-2 border-[#2d2e3b] rounded-xl px-3 py-1 text-xs flex items-center gap-2 shadow-inner font-mono">
                      <span className="text-[9px] text-slate-500 font-sans font-bold">장착:</span>
                      <span className="font-extrabold text-[#f59e0b] text-[11px]">{state.ai.weapon.name}</span>
                      <span className="text-[10px] text-slate-350 font-bold bg-[#1d1b11] px-1.5 py-0.5 rounded border border-amber-400/20">
                        ⚔️ {state.ai.weapon.atk}/{state.ai.weapon.durability}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider bg-[#0a0a0d] border border-[#1b1c28]/40 px-2 py-0.5 rounded select-none">장착 무기 없음</span>
                  )}
                </div>
              </div>

              {/* SECTION B: AI BATTLEFIELD FIELD ROW */}
              <div className="flex-1 flex flex-col justify-center py-5">
                <div className="min-h-[145px] flex items-center justify-center gap-3.5 bg-[#08090d]/60 border border-dashed border-[#1a1c29]/50 rounded-2xl p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                  {state.ai.board.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-8">상대방 필드가 고요하고 비어 있습니다.</p>
                  ) : (
                    state.ai.board.map(minion => {
                      const isTaunt = minion.keywords.includes('Taunt');
                      const clickTargetValid = state.targetingMode === 'spell' || state.targetingMode === 'attack' || state.targetingMode === 'hero_power';
                      
                      return (
                        <button
                          key={minion.id}
                          onClick={() => {
                            if (clickTargetValid) handleSelectTarget(minion.id);
                          }}
                          className={`w-[115px] bg-[#0c0d12] border rounded-xl p-3 flex flex-col justify-between h-[125px] transition-all duration-200 relative text-left select-none shadow-md ${
                            isTaunt ? 'border-amber-600/80 bg-[#14120f] shadow-lg shadow-amber-600/5' : 'border-[#1b1c28]'
                          } ${clickTargetValid ? 'border-rose-500/75 hover:border-red-500 cursor-crosshair hover:scale-[1.03] shadow-[0_0_12px_rgba(239,68,68,0.2)]' : ''}`}
                        >
                          {/* Taunt Shield Marker */}
                          {isTaunt && (
                            <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-md px-1 py-0.2 font-black text-[8px] shadow-md flex items-center gap-0.5" title="도발 하수인">
                              <span>🛡️</span>
                              <span>도발</span>
                            </div>
                          )}

                          {/* Divine Shield glow border */}
                          {minion.hasDivineShield && (
                            <div className="absolute inset-x-0 inset-y-0 border-2 border-yellow-400/60 rounded-xl pointer-events-none animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.15)]"></div>
                          )}

                          <div className="w-full">
                            <h4 className="text-xs font-bold text-slate-100 truncate mt-1">{minion.name}</h4>
                            <p className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                              {isTaunt ? '도발 방어선' : minion.keywords.join(', ') || '일반 소환'}
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-[#161722] pt-2 font-mono">
                            <span className="text-[11px] text-yellow-500 font-black flex items-center gap-0.5">
                              <Sword className="w-3 h-3 text-yellow-500" /> {minion.atk}
                            </span>
                            <span className="text-[11px] text-[#f43f5e] font-black flex items-center gap-0.5">
                              <Heart className="w-3 h-3 text-[#f43f5e]" /> {minion.currentHp}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>


              {/* SECTION C: PLAYER BATTLEFIELD FIELD ROW */}
              <div className="flex-1 flex flex-col justify-center py-5">
                <div className="min-h-[145px] flex items-center justify-center gap-3.5 bg-[#08090d]/60 border border-dashed border-[#1a1c29]/50 rounded-2xl p-4 relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                  
                  {state.player.board.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-8">아군 전전에 장수가 소환되지 않았습니다.</p>
                  ) : (
                    state.player.board.map(minion => {
                      const isTaunt = minion.keywords.includes('Taunt');
                      const readyToAttack = !minion.isAsleep && !minion.hasAttackedThisTurn && state.whosTurn === 'player';
                      const isSelectedAttaker = state.selectedAttackerId === minion.id;
                      const clickTargetValid = state.targetingMode === 'spell' || state.targetingMode === 'hero_power';

                      return (
                        <button
                          key={minion.id}
                          onClick={() => {
                            if (clickTargetValid) {
                              handleSelectTarget(minion.id);
                            } else if (readyToAttack) {
                              handleSelectAttacker(minion.id);
                            }
                          }}
                          className={`w-[115px] bg-[#0c0d12] border rounded-xl p-3 flex flex-col justify-between h-[125px] transition-all duration-200 relative text-left select-none shadow-md ${
                            isSelectedAttaker ? 'border-yellow-400 ring-4 ring-yellow-400/25 scale-[1.03] bg-[#14120e] shadow-[0_4px_16px_rgba(234,179,8,0.15)]' :
                            readyToAttack ? 'border-emerald-500/80 hover:border-emerald-400 hover:scale-[1.03] shadow-[0_2px_12px_rgba(16,185,129,0.15)] bg-[#0d1411]' : 
                            isTaunt ? 'border-amber-600/80 bg-[#14120f]' : 'border-[#1b1c28]'
                          } ${clickTargetValid ? 'hover:border-blue-400 cursor-crosshair' : ''}`}
                        >
                          {/* Sleep particle indicating fatigue */}
                          {minion.isAsleep && (
                            <span className="absolute top-1.5 right-1.5 bg-[#171822] text-[#94a3b8] px-1 rounded-md text-[7px] font-bold border border-[#2d2e3b]" title="소환 후유증">💤 수면</span>
                          )}

                          {/* Taunt Shield Marker */}
                          {isTaunt && (
                            <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-md px-1 py-0.2 font-black text-[8px] flex items-center gap-0.5 shadow-md">
                              <span>🛡️도발</span>
                            </div>
                          )}

                          {/* Divine Shield glow border */}
                          {minion.hasDivineShield && (
                            <div className="absolute inset-x-0 inset-y-0 border-2 border-yellow-400/60 rounded-xl pointer-events-none animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.15)]"></div>
                          )}

                          <div className="w-full">
                            <h4 className="text-xs font-bold text-slate-100 truncate mt-1">{minion.name}</h4>
                            <p className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                              {isTaunt ? '도발 기지' : minion.keywords.join(', ') || '아군 배치'}
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-[#161722] pt-2 font-mono">
                            <span className="text-[11px] text-yellow-500 font-black flex items-center gap-0.5">
                              <Sword className="w-3 h-3 text-yellow-500" /> {minion.atk}
                            </span>
                            <span className="text-[11px] text-[#f43f5e] font-black flex items-center gap-0.5">
                              <Heart className="w-3 h-3 text-[#f43f5e]" /> {minion.currentHp}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>


              {/* SECTION D: PLAYER HERO FIELD BAR */}
              <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#14151f] pt-5 mt-2 gap-4">
                {/* Player Stats (Left Side) */}
                <div className="flex items-center gap-3 order-2 md:order-1">
                  <div className="text-left font-sans">
                    <span className="text-[9px] text-blue-450 font-black uppercase tracking-widest bg-blue-950/30 px-2 py-0.5 rounded border border-blue-500/10 select-none">
                      PLAYER STATS
                    </span>
                    <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-slate-400 select-none">
                      <span className="bg-[#10111a] border border-[#20212f]/60 px-2 py-0.5 rounded">덱: {state.player.deck.length}장</span>
                    </div>
                  </div>
                </div>

                {/* Player Hearthstone Oval Hero Portrait (Centered) */}
                <div className="flex flex-col items-center order-1 md:order-2 flex-1 md:max-w-xs justify-center relative md:-translate-x-4">
                  {state.whosTurn === 'player' && (
                    <span className="absolute -top-6 px-2.5 py-0.5 bg-blue-600 font-black text-slate-50 rounded-md font-sans text-[8px] tracking-widest uppercase animate-pulse shadow-md select-none z-10">
                      ⭐ 무엇이든 시전할 내 턴!
                    </span>
                  )}
                  
                  {/* Portrait + Hero Power layout in tight row */}
                  <div className="flex items-center gap-6 justify-center">
                    
                    {/* Interactive Button for Hero Portrait */}
                    <button 
                      onClick={() => {
                        if (state.targetingMode === 'spell' || state.targetingMode === 'hero_power') {
                          handleSelectTarget('player_hero');
                        } else if (state.player.weapon && !state.player.hasAttackedThisTurn && state.whosTurn === 'player') {
                          handleSelectAttacker('player_hero');
                        }
                      }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative bg-gradient-to-b from-[#1b253c] to-[#04050a] ${
                        state.selectedAttackerId === 'player_hero' ? 'border-yellow-400 ring-4 ring-yellow-400/35 scale-[1.05] shadow-[0_0_18px_rgba(234,179,8,0.45)]' :
                        (state.player.weapon && !state.player.hasAttackedThisTurn && state.whosTurn === 'player') ? 'border-emerald-500 hover:border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.45)] cursor-pointer hover:scale-[1.05]' :
                        state.whosTurn === 'player' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)] hover:scale-[1.03] cursor-pointer' : 'border-[#2c2d3e]'
                      } ${
                        (state.targetingMode === 'spell' || state.targetingMode === 'hero_power') ? 'border-blue-400 cursor-crosshair shadow-[0_0_20px_rgba(59,130,246,0.45)] animate-pulse ring-4 ring-blue-500/20' : ''
                      } group`}
                      title={
                        state.targetingMode === 'spell' ? '내 영웅에게 마법 버프 시전' :
                        state.targetingMode === 'hero_power' ? '내 영웅에게 능력 실시간 시전' :
                        state.player.weapon && !state.player.hasAttackedThisTurn && state.whosTurn === 'player' ? '내 영웅으로 상대 타격 돌격!' : '내 영웅 본체'
                      }
                    >
                      {/* Shadow profile overlay */}
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-0">
                        <User className={`w-8 h-8 ${state.whosTurn === 'player' ? 'text-blue-400' : 'text-slate-400'} group-hover:text-blue-300 transition-colors duration-150`} />
                        <div className="absolute inset-x-0 bottom-0 bg-stone-900/75 py-0.5 text-center font-mono text-[8px] font-black text-slate-400 select-none uppercase tracking-wider">
                          PLAYER (YOU)
                        </div>
                      </div>

                      {/* Active Quest Badge Overlay (Top-Left) */}
                      {state.player.activeQuest && (
                        <div 
                          className="absolute -top-1.5 -left-1.5 bg-gradient-to-br from-teal-500 to-emerald-600 border-2 border-[#10b981] text-teal-100 font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse z-10 text-[9px] cursor-help"
                          title={`퀘스트 활성화됨!\n${state.player.activeQuest.name} (${state.player.activeQuest.progress}/${state.player.activeQuest.target})`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          ❓
                        </div>
                      )}

                      {/* Hearthstone Teardrop Health Badge Overlay (Bottom-Right) */}
                      <div className="absolute -bottom-1 -right-2 bg-gradient-to-br from-rose-600 to-red-600 border-2 border-red-300 text-slate-50 font-mono text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-all select-none z-10" title="생명력">
                        {state.player.hp}
                      </div>

                      {/* Mana Crystal badge (Bottom-Left) */}
                      <div className="absolute -bottom-1 -left-2 bg-gradient-to-br from-blue-600 to-sky-600 border-2 border-blue-300 text-slate-50 font-mono text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg select-none z-10" title="마나">
                        {state.player.mana}
                      </div>

                      {/* Armor shield overlay (Top-Right) */}
                      {state.player.armor > 0 && (
                        <div className="absolute -top-1 -right-2 bg-gradient-to-br from-slate-400 to-slate-500 border-2 border-slate-300 text-slate-100 font-mono text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center shadow-md animate-bounce" title="플레이어 방어도">
                          🛡️{state.player.armor}
                        </div>
                      )}
                    </button>

                    {/* HERO POWER COMPONENT BUTTON */}
                    {(() => {
                      const hpi = getHeroPowerInfo(state.player.heroClass);
                      const canUse = state.whosTurn === 'player' && state.player.mana >= 2 && !state.player.usedHeroPower && state.targetingMode === 'none';
                      const isTargetingThis = state.targetingMode === 'hero_power';

                      return (
                        <div className="flex flex-col items-center relative">
                          <button
                            onClick={handleUseHeroPower}
                            disabled={!canUse && !isTargetingThis}
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-4 bg-gradient-to-b relative shadow-lg transition-all duration-300 ${hpi.color} ${
                              canUse
                                ? 'ring-4 ring-emerald-500/35 border-emerald-400 hover:scale-[1.08] cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
                                : isTargetingThis
                                ? 'ring-4 ring-yellow-400 border-yellow-450 scale-[1.05] shadow-[0_0_18px_rgba(234,179,8,0.6)] cursor-pointer'
                                : 'opacity-40 border-[#23232a] bg-stone-900 cursor-not-allowed'
                            }`}
                            title={`${hpi.name} (마나: 2코) - ${hpi.desc}`}
                          >
                            <span className="text-xl select-none">{hpi.icon}</span>

                            {/* Cost Tag at top */}
                            <div className="absolute -top-1.5 -left-1 bg-blue-600 border border-blue-400 text-[8px] font-black text-slate-100 rounded-full w-4.5 h-4.5 flex items-center justify-center font-mono shadow">
                              2
                            </div>

                            {/* Exhausted indicator */}
                            {state.player.usedHeroPower && (
                              <div className="absolute inset-0 bg-stone-950/80 rounded-full flex items-center justify-center text-[7.5px] text-red-500 font-black tracking-tighter select-none uppercase">
                                USED
                              </div>
                            )}
                          </button>
                          <span className="text-[9px] text-[#fbbf24] font-extrabold mt-1 text-center truncate w-14" title={hpi.name}>
                            {hpi.name}
                          </span>
                        </div>
                      );
                    })()}

                  </div>

                  <div className="flex flex-col items-center mt-1.5 gap-0.5">
                    <span className="text-[10px] text-indigo-400 font-black tracking-wide bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                      🛡️ {translateHeroClass(state.player.heroClass)}
                    </span>
                    <span className="text-[9px] text-slate-500 font-extrabold font-sans tracking-wide">여관 아군 플레이어 (나)</span>
                  </div>
                </div>

                {/* Spell Cancel area if targeting is active in between */}
                {state.targetingMode !== 'none' && (
                  <div className="flex items-center gap-3 bg-[#1c140d] border border-amber-500/25 px-3 py-1.5 rounded-xl animate-pulse shadow-md order-4">
                    <span className="text-[10.5px] text-amber-400 font-bold font-sans">
                      {state.targetingMode === 'spell' ? '🎯 주문 시전 대상 지목...' : state.targetingMode === 'hero_power' ? '⚡ 영웅 능력 대상 지목...' : '⚔️ 타격 공격 대상 지정...'}
                    </span>
                    <button 
                      onClick={cancelActions}
                      className="text-[9px] bg-[#10111a] hover:bg-[#20212f] text-slate-300 hover:text-slate-50 font-black px-2 py-0.5 rounded border border-[#2b2c3d] transition duration-150 cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                )}

                {/* Player Weapon Side (Right Side) */}
                <div className="flex items-center gap-3 order-3">
                  {state.player.weapon ? (
                    <button 
                      onClick={() => {
                        if (state.whosTurn === 'player' && !state.player.hasAttackedThisTurn) {
                          handleSelectAttacker('player_hero');
                        }
                      }}
                      className={`bg-[#121319] border-2 rounded-xl px-3.5 py-1 text-xs flex items-center gap-2 shadow-inner font-mono transition duration-150 hover:scale-[1.02] cursor-pointer ${
                        state.selectedAttackerId === 'player_hero' ? 'border-yellow-400 text-yellow-400 animate-pulse' : 'border-[#1b1c28] text-amber-500 hover:border-amber-500/70'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 font-sans font-bold">장착무기:</span>
                      <span className="font-extrabold text-amber-500 text-[11px]">{state.player.weapon.name}</span>
                      <span className="text-[10px] text-slate-350 font-bold bg-[#1d1b11] px-1.5 py-0.5 rounded border border-[#23211b]">
                        ⚔️ {state.player.weapon.atk}/🛡️ {state.player.weapon.durability}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[8px] text-slate-650 font-bold uppercase tracking-wider bg-[#0a0a0d] border border-[#1b1c28]/40 px-2 py-0.5 rounded select-none">장착 무기 공백</span>
                  )}
                </div>
              </div>

            </div>

            {/* SECTION E: HAND PANEL AREA IN THE FRONT PANEL */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] rounded-3xl p-5 flex flex-col gap-3 relative shadow-lg">
              <div className="flex items-center justify-between border-b border-[#14151f] pb-2">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 select-none font-sans">
                  <Layers className="w-3.5 h-3.5 text-blue-500" /> 아군 무기고 장장패 (클릭 시 전술 자극)
                </span>
                <span className="text-[9px] text-slate-500 font-mono font-black select-none uppercase tracking-wide">
                  Hand Cards: {state.player.hand.length} / 10
                </span>
              </div>

              {state.player.hand.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs text-slate-500 italic">내 수중의 패가 완전히 공백 상태입니다! 다음 라운드 드로우를 기대하십시오.</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 overflow-x-auto py-2.5 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {state.player.hand.map((card, idx) => {
                    const affordable = state.player.mana >= card.cost && state.whosTurn === 'player';
                    const isSelected = state.selectedActionCardIndex === idx;

                    return (
                      <button
                        key={card.id + '_' + idx}
                        onClick={() => handleSelectHandCard(idx)}
                        disabled={state.whosTurn !== 'player'}
                        className={`w-[110px] bg-[#0c0d12] border transition-all duration-200 rounded-2xl p-2.5 flex flex-col justify-between h-[155px] text-left relative flex-shrink-0 select-none ${
                          isSelected ? 'border-yellow-400 ring-4 ring-yellow-400/25 scale-[1.03] bg-[#14120f] shadow-[0_4px_16px_rgba(234,179,8,0.2)]' :
                          affordable ? 'border-[#26283b] hover:border-amber-500/80 bg-[#0d101c]/90 shadow-[0_2px_10px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/10' : 
                          'border-[#14151c]/60 bg-[#07080c] opacity-50'
                        }`}
                      >
                        {/* Mana symbol */}
                        <div className="absolute top-1 left-1.5 w-5 h-5 rounded-full bg-blue-600 font-mono font-black text-[10px] flex items-center justify-center text-slate-50 shadow-inner border border-blue-400/25">
                          {card.cost}
                        </div>

                        {/* Rarity small card badge line */}
                        <div className={`absolute top-0 right-0 w-8 h-[2px] rounded ${
                          card.rarity === 'legendary' ? 'bg-amber-500' :
                          card.rarity === 'epic' ? 'bg-purple-500' :
                          card.rarity === 'rare' ? 'bg-blue-500' : 'bg-slate-600'
                        }`}></div>

                        <div className="mt-4">
                          <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate">{card.name}</h4>
                          <span className="text-[6.5px] text-slate-500 bg-[#040507] border border-[#171822] rounded px-1 mt-1 inline-block uppercase font-bold tracking-wide">
                            {card.type === 'minion' ? '하수인' : card.type === 'spell' ? '주문' : '무기'}
                          </span>
                        </div>

                        <p className="text-[9px] text-[#94a3b8] leading-tight mt-1.5 border-t border-[#14151a] pt-1 text-ellipsis overflow-hidden line-clamp-3">
                          {card.description}
                        </p>

                        <div className="mt-1 flex justify-between items-center border-t border-[#14151a] pt-1.5 font-mono text-[9.5px]">
                          {card.type === 'minion' ? (
                            <>
                              <span className="text-yellow-500 font-bold flex items-center gap-0.2"><Sword className="w-2.5 h-2.5" />{card.atk}</span>
                              <span className="text-rose-500 font-bold flex items-center gap-0.2"><Heart className="w-2.5 h-2.5" />{card.hp}</span>
                            </>
                          ) : card.type === 'weapon' ? (
                            <>
                              <span className="text-yellow-500 font-bold flex items-center gap-0.2"><Sword className="w-2.5 h-2.5" />{card.atk}</span>
                              <span className="text-slate-400 font-bold flex items-center gap-0.2"><Shield className="w-2.5 h-2.5" />{card.durability}</span>
                            </>
                          ) : (
                            <span className="text-[7px] text-slate-600 shrink-0 select-none">시격 주문</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </section>

          {/* Right panel: Game Master console & Terminal system - 4 Columns space */}
          <section className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Action Bar (Turn toggle controller on the upper deck) */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] rounded-3xl p-5 flex flex-col items-stretch gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-black tracking-wider leading-none">✦ TURN CONTROLLER ✦</span>
                  <p className="text-xs text-amber-500 font-bold mt-1">
                    현재 라운드 공방차수: <span className="text-sm font-mono font-black">{state.turn}회</span>
                  </p>
                </div>
                <div>
                  {state.whosTurn === 'player' ? (
                    <span className="text-[10px] font-black bg-blue-600 text-slate-50 px-3 py-1 rounded-lg border border-blue-400/20 uppercase tracking-widest animate-pulse">
                      내 턴 활성
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-amber-500/10 text-amber-400 px-3 py-1 rounded-lg border border-amber-400/25 uppercase tracking-widest">
                      AI 턴 대기
                    </span>
                  )}
                </div>
              </div>

              {/* Central Trigger Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                {state.whosTurn === 'player' ? (
                  <button
                    onClick={() => endTurn()}
                    className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs py-3 px-4 rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.45)] transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-[1.01] cursor-pointer"
                  >
                    <span className="text-slate-950 font-extrabold text-xs">턴 종료하기 (End Turn)</span>
                    <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
                  </button>
                ) : (
                  <div className="flex-1 bg-[#12131b] text-amber-500/85 font-black text-xs py-3 px-4 rounded-xl border border-[#20212f] text-center flex items-center justify-center gap-2 select-none shadow-inner">
                    <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    상대방 AI 대결자가 차수를 계산 중...
                  </div>
                )}
              </div>
            </div>

            {/* Quest Status Tracker (Displayed if either player or ai has an active quest) */}
            {(state.player.activeQuest || state.ai.activeQuest) && (
              <div className="bg-[#0b0c10] border border-teal-500/30 rounded-3xl p-5 flex flex-col gap-3.5 shadow-lg relative overflow-hidden bg-gradient-to-br from-[#0c0d12] to-[#0d1615] animate-fade-in">
                {/* Visual glow element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                  <span className="text-[10px] text-teal-400 uppercase font-mono font-black tracking-wider leading-none">📜 ACTIVE QUEST TRACKER 📜</span>
                </div>

                <div className="flex flex-col gap-3">
                  {state.player.activeQuest && (
                    <div className="bg-[#101918] border border-teal-500/25 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-teal-300">내 퀘스트 (You)</span>
                        <span className="text-[11px] font-mono font-bold text-amber-400 bg-[#121008] border border-amber-500/15 px-1.5 py-0.5 rounded">
                          {state.player.activeQuest.progress} / {state.player.activeQuest.target}
                        </span>
                      </div>
                      <p className="text-[11.5px] font-extrabold text-slate-100">{state.player.activeQuest.name}</p>
                      <p className="text-[9.5px] text-slate-400 leading-normal">{state.player.activeQuest.description}</p>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1.5 border border-[#1b1c23]">
                        <div 
                          className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (state.player.activeQuest.progress / state.player.activeQuest.target) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[8.5px] text-amber-500/90 font-bold mt-1">🎁 완료 시 보상: {state.player.activeQuest.rewardName}</p>
                    </div>
                  )}

                  {state.ai.activeQuest && (
                    <div className="bg-[#1b1111] border border-rose-500/20 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-rose-350">상대방 퀘스트 (Rival)</span>
                        <span className="text-[11px] font-mono font-bold text-rose-400 bg-[#1d0e0e] border border-rose-500/15 px-1.5 py-0.5 rounded">
                          {state.ai.activeQuest.progress} / {state.ai.activeQuest.target}
                        </span>
                      </div>
                      <p className="text-[11.5px] font-extrabold text-slate-100">{state.ai.activeQuest.name}</p>
                      <p className="text-[9.5px] text-slate-400 leading-normal">{state.ai.activeQuest.description}</p>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1.5 border border-[#1b1c23]">
                        <div 
                          className="bg-gradient-to-r from-rose-500 to-orange-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (state.ai.activeQuest.progress / state.ai.activeQuest.target) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[8.5px] text-rose-400/90 font-bold mt-1">🎁 완료 시 보상: {state.ai.activeQuest.rewardName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GM Narrator Scrolling Screen Console & History Log */}
            <div className="bg-[#0b0c10] border border-[#1b1c23] rounded-3xl p-5 flex flex-col h-[525px] justify-between shadow-2xl relative">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#14151f] pb-3 mb-2 select-none">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" /> 게임 대화 사건 로그
                </span>
                <span className="text-[9px] text-[#475569] font-mono font-black uppercase tracking-wider">Live Logger</span>
              </div>

              {/* Main Log text Area */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs max-h-[415px] scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
                {currentLogsSorted.length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-[#475569] italic font-sans text-xs">로그 사건 기록물이 유수합니다.</p>
                  </div>
                ) : (
                  currentLogsSorted.map(log => {
                    let badgeColor = 'bg-[#1e293b] text-slate-400';
                    let speakerName = '안내';
                    let speechStyle = 'text-slate-350';

                    if (log.speaker === 'PLAYER') {
                      badgeColor = 'bg-blue-600/20 text-blue-400 border border-blue-500/20';
                      speakerName = '나 (플레이어)';
                      speechStyle = 'text-blue-200 font-medium font-sans';
                    } else if (log.speaker === 'AI') {
                      badgeColor = 'bg-rose-950/30 text-rose-400 border border-rose-500/15';
                      speakerName = 'AI 대결자';
                      speechStyle = 'text-rose-100 font-semibold font-sans';
                    } else if (log.speaker === 'GM') {
                      badgeColor = 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
                      speakerName = '★ 여관마스터 [GM]';
                      speechStyle = 'text-amber-200 font-bold font-sans';
                    }

                    return (
                      <div key={log.id} className="p-3 bg-[#0c0d12]/60 rounded-xl border border-[#1b1c28]/45 hover:bg-[#12131c] transition-colors duration-150 flex flex-col gap-1.5 shadow-sm">
                        <div className="flex items-center justify-between text-[8px] text-[#475569]">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[8.5px] uppercase tracking-wider ${badgeColor}`}>
                            {speakerName}
                          </span>
                          <span className="font-semibold">{log.timestamp} (턴 {log.turn})</span>
                        </div>
                        <p className={`leading-relaxed text-[10.5px] ${speechStyle}`}>{log.text}</p>
                      </div>
                    );
                  })
                )}
                <div ref={logEndRef} />
              </div>

              {/* Command text input CLI terminal action */}
              <form onSubmit={handleCliSubmit} className="mt-3 border-t border-[#14151f] pt-3">
                <div className="relative">
                  <input
                    type="text"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    disabled={state.whosTurn !== 'player' || isAiLoading}
                    placeholder={state.whosTurn === 'player' ? '여기에 텍스트 명령어 입력... (예: "1번 카드 내기")' : '상대 AI의 계산 결과를 대기하는 중...'}
                    className="w-full bg-[#0c0d12] border border-[#1b1c23] focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3.5 pr-10 text-[10.5px] text-slate-200 placeholder-slate-500 font-mono leading-none transition duration-150"
                  />
                  <button
                    type="submit"
                    disabled={state.whosTurn !== 'player' || isAiLoading || !cliInput.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-[#0b0c10] transition-colors duration-150 disabled:opacity-20 disabled:pointer-events-none"
                    title="명령어 송출"
                  >
                    <Send className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </form>

            </div>

          </section>

        </main>
      )}

      {/* Screen 4: Game Over overlay popup screen */}
      {state.phase === 'GAME_OVER' && (
        <div className="flex-1 max-w-lg w-full mx-auto p-6 md:p-12 flex flex-col items-center justify-center text-center animate-fade-in relative z-50">
          <div className="bg-[#0b0c10] border-2 border-[#1b1c23] rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden w-full max-w-md">
            
            <Skull className={`w-20 h-20 mx-auto mb-6 ${
              state.winner === 'player' ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'text-slate-600'
            }`} />

            <h2 className="text-3xl font-extrabold text-[#f1f3f7] tracking-tight font-sans mb-3">
              {state.winner === 'player' ? '🎉 전장의 대승리!' : '💀 여관 전투의 패배.'}
            </h2>
            
            <p className="text-[#a0a5b5] text-xs mb-8 leading-relaxed font-sans px-2">
              {state.winnerName ? state.winnerName : (
                state.winner === 'player' ?
                '축하합니다! 상대 여관 AI를 지략적으로 타파하고 여관에서 전설의 자리에 올랐습니다.' :
                '상대방 AI의 논리적인 묘수 앞에 아군 영웅이 쓰러졌습니다. 새로운 덱으로 전열을 보듬어 도전해 보십시오!'
              )}
            </p>

            <div className="space-y-3">
              <button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-slate-950 font-black py-3 px-5 rounded-xl transition-all duration-200 text-xs shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                대전 다시 열어 덱 짜기
              </button>
              <p className="text-[9px] text-[#475569] pt-2 font-mono font-bold uppercase tracking-wider">기록 보존 완료 • 2026 Season Tavern Cup</p>
            </div>

          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="bg-[#07080a] border-t border-[#121319] py-3 text-center text-[9px] text-slate-600 select-none font-mono">
        &copy; 1996 - 2026 Blizzard & Innkeeper Card Simulator Interactive System. All Rights Reserved.
      </footer>

      {/* Rulebook popup drawer */}
      <RulebookModal isOpen={isRulebookOpen} onClose={() => setIsRulebookOpen(false)} />
    </div>
  );
}
