/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState, Card, BoardMinion, PlayerState, WeaponState, GameLog } from './types';
import { CARD_POOL } from './cardsData';

// Helper to create a unique ID
export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Draw a card for either user or AI
export function drawCardFor(player: PlayerState, logs: GameLog[], sideName: string): { player: PlayerState, logText: string | null } {
  const nextPlayer = { ...player };
  let logText: string | null = null;
  
  if (nextPlayer.deck.length === 0) {
    // Fatigue!
    nextPlayer.fatigueCount += 1;
    nextPlayer.hp -= nextPlayer.fatigueCount;
    logText = `⚠️ 덱에 카드가 남아 있지 않습니다! ${sideName} 영웅이 피로 대미지를 ${nextPlayer.fatigueCount} 입습니다 (현재 HP: ${nextPlayer.hp})`;
  } else {
    const card = nextPlayer.deck[0];
    nextPlayer.deck = nextPlayer.deck.slice(1);
    
    if (nextPlayer.hand.length >= 10) {
      logText = `🔥 ${sideName}의 패가 10장으로 가득 차서 카드 [${card.name}]이(가) 불타 없어졌습니다!`;
    } else {
      nextPlayer.hand.push({ ...card, id: generateId('card_inst') });
      nextPlayer.cardDrawnCount += 1;
    }
  }
  
  return { player: nextPlayer, logText };
}

// Find if any Taunt minions exist on the opposing panel
export function hasTauntMinion(board: BoardMinion[]): boolean {
  return board.some(m => m.keywords.includes('Taunt') && m.currentHp > 0);
}

// Create Initial State
export function createInitialState(
  playerDeck: Card[], 
  aiDeck: Card[], 
  deckName: string, 
  gameMode?: 'prebuilt' | 'package' | 'arena' | 'tavern_brawl' | 'boss_fight',
  playerClass: 'Mage' | 'Priest' | 'Paladin' | 'Hunter' | 'Warrior' = 'Mage',
  aiClass: 'Mage' | 'Priest' | 'Paladin' | 'Hunter' | 'Warrior' = 'Hunter'
): AppState {
  // Deep clone deck items
  const playerDeckCloned = playerDeck.map(c => ({ ...c, id: generateId('ply') }));
  const aiDeckCloned = aiDeck.map(c => ({ ...c, id: generateId('ai') }));

  // Shuffle helpful util
  const shuffle = (array: Card[]) => {
    const list = [...array];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  const pDeckShuffled = shuffle(playerDeckCloned);
  const aDeckShuffled = shuffle(aiDeckCloned);

  const isTavern = gameMode === 'tavern_brawl';
  const isBoss = gameMode === 'boss_fight';

  const initialPlayer: PlayerState = {
    hp: 30,
    maxHp: 30,
    armor: 0,
    mana: isTavern ? 10 : 1,
    maxMana: isTavern ? 10 : 1,
    deck: pDeckShuffled,
    hand: [],
    board: [],
    weapon: null,
    hasAttackedThisTurn: false,
    usedHeroPower: false,
    fatigueCount: 0,
    cardDrawnCount: 0,
    heroClass: playerClass
  };

  const initialAi: PlayerState = {
    hp: isBoss ? 45 : 30,
    maxHp: isBoss ? 45 : 30,
    armor: isBoss ? 10 : 0, // Give Lich King boss some initial armor!
    mana: isTavern ? 10 : 1,
    maxMana: isTavern ? 10 : 1,
    deck: aDeckShuffled,
    hand: [],
    board: [],
    weapon: null,
    hasAttackedThisTurn: false,
    usedHeroPower: false,
    fatigueCount: 0,
    cardDrawnCount: 0,
    heroClass: isBoss ? 'Warrior' : aiClass // Boss is Warrior
  };

  // Draw initial hands: 4 cards for player, 4 cards for AI
  const pLogs: GameLog[] = [];
  const timestamp = new Date().toLocaleTimeString();

  const isPlayerFirst = Math.random() < 0.5;

  for (let i = 0; i < 4; i++) {
    const res = drawCardFor(initialPlayer, pLogs, '플레이어');
    Object.assign(initialPlayer, res.player);
  }
  for (let i = 0; i < 4; i++) {
    const res = drawCardFor(initialAi, pLogs, 'AI 상대방');
    Object.assign(initialAi, res.player);
  }

  pLogs.push({
    id: generateId('log'),
    timestamp,
    turn: 1,
    speaker: 'GM',
    text: `🃏 마나 워즈 대전이 시작되었습니다! 선택한 덱: '${deckName}'.`
  });

  pLogs.push({
    id: generateId('log'),
    timestamp,
    turn: 1,
    speaker: 'GM',
    text: `🎲 [선공/후공 동전 던지기 결과] ${
      isPlayerFirst 
        ? '플레이어님이 선공 [⚔️ 선공]입니다! 상대 AI는 후공 [🪙 후공]으로 시작합니다.'
        : '상대 AI가 선공 [⚔️ 선공]입니다! 플레이어님은 후공 [🪙 후공]으로 시작합니다.'
    }`
  });

  pLogs.push({
    id: generateId('log'),
    timestamp,
    turn: 1,
    speaker: 'SYSTEM',
    text: `🔄 원하지 않는 카드를 선택하여 'X' 표시로 교체할 수 있는 멀리건(Mulligan) 단계에 입장하였습니다.`
  });

  return {
    phase: 'MULLIGAN_PHASE',
    player: initialPlayer,
    ai: initialAi,
    turn: 1,
    whosTurn: isPlayerFirst ? 'player' : 'ai',
    logs: pLogs,
    roundSelected: 0,
    draftChoices: [],
    playerChosenDeck: deckName,
    winner: null,
    selectedActionCardIndex: null,
    selectedAttackerId: null,
    targetingMode: 'none',
    isPlayerFirst,
    gameMode
  };
}

// Local simulation fallback heuristic generator for the AI
export function computeRuleBasedAITurn(player: PlayerState, ai: PlayerState): { actions: any[], commentary: string } {
  const actions: any[] = [];
  let simulatedMana = ai.mana;
  const simulatedHand: Card[] = JSON.parse(JSON.stringify(ai.hand));
  const simulatedAiBoard: BoardMinion[] = JSON.parse(JSON.stringify(ai.board));
  const simulatedPlayerBoard: BoardMinion[] = JSON.parse(JSON.stringify(player.board));
  let tempAiHp = ai.hp;
  let tempPlayerHp = player.hp;

  // Track simulated minions deaths for targeting
  const getAliveTargets = () => {
    return simulatedPlayerBoard.filter(m => m.currentHp > 0);
  };

  const getAliveFriendly = () => {
    return simulatedAiBoard.filter(m => m.currentHp > 0);
  };

  // Step 1: Analyze playable cards using a smart mana curve template optimizer
  let madePlay = true;
  while (madePlay) {
    madePlay = false;

    const alivePlayerMinions = getAliveTargets();
    const aliveFriendlyMinions = getAliveFriendly();

    // Filter cards that we can currently afford and that have valid targets if they are targeted spells
    const affordable = simulatedHand
      .map((card, originalIndex) => ({ card, originalIndex }))
      .filter(item => {
        if (item.card.cost > simulatedMana) return false;

        // Check minion-only spell target constraints in planning
        if (item.card.type === 'spell') {
          const effectId = item.card.effectId || '';
          if (['destroy_target', 'polymorph', 'silence_target'].includes(effectId)) {
            // Needs at least one enemy minion to target
            if (alivePlayerMinions.length === 0) return false;
          }
          if (['shield_buff', 'mark_of_wild', 'full_heal_taunt'].includes(effectId)) {
            // Needs at least one friendly minion to target
            if (aliveFriendlyMinions.length === 0) return false;
          }
        }
        return true;
      });

    if (affordable.length > 0) {
      // Sort: High cost first (tempo curve), prioritizing Minions first, then Spells for board control
      affordable.sort((a, b) => {
        if (b.card.cost !== a.card.cost) {
          return b.card.cost - a.card.cost;
        }
        if (a.card.type === 'minion' && b.card.type !== 'minion') return -1;
        if (b.card.type === 'minion' && a.card.type !== 'minion') return 1;
        return 0;
      });

      const bestItem = affordable[0];
      const card = bestItem.card;
      const indexInSimulatedHand = bestItem.originalIndex;

      simulatedMana -= card.cost;
      simulatedHand.splice(indexInSimulatedHand, 1);

      let targetId = 'none';
      const hasTaunts = alivePlayerMinions.some(m => m.keywords.includes('Taunt'));
      const tauntMinions = alivePlayerMinions.filter(m => m.keywords.includes('Taunt'));

      if (card.type === 'minion') {
        const hasBattlecry = card.keywords?.includes('Battlecry');
        if (hasBattlecry && card.effectId === 'deal_damage') {
          const dmg = card.effectValue || 1;
          // Target priorities: 1. Killable taunt, 2. Killable high-threat, 3. Highest attack minion, 4. Face
          const killableTaunt = tauntMinions.find(m => m.currentHp <= dmg);
          const killableMinion = alivePlayerMinions.find(m => m.currentHp <= dmg);

          if (killableTaunt) {
            targetId = killableTaunt.id;
            killableTaunt.currentHp -= dmg;
          } else if (killableMinion) {
            targetId = killableMinion.id;
            killableMinion.currentHp -= dmg;
          } else if (alivePlayerMinions.length > 0) {
            const highAtk = [...alivePlayerMinions].sort((a, b) => b.atk - a.atk)[0];
            targetId = highAtk.id;
            highAtk.currentHp -= dmg;
          } else {
            targetId = 'player_hero';
            tempPlayerHp -= dmg;
          }
        } else if (hasBattlecry && card.effectId === 'heal_target') {
          // Heal damaged friendly board units, otherwise face
          const damagedFriendly = aliveFriendlyMinions.find(m => m.currentHp < m.maxHp && m.currentHp > 0);
          if (damagedFriendly) {
            targetId = damagedFriendly.id;
            damagedFriendly.currentHp = Math.min(damagedFriendly.maxHp, damagedFriendly.currentHp + (card.effectValue || 2));
          } else {
            targetId = 'ai_hero';
            tempAiHp = Math.min(30, tempAiHp + (card.effectValue || 2));
          }
        }

        simulatedAiBoard.push({
          id: generateId('minion_sim'),
          templateId: card.templateId,
          name: card.name,
          cost: card.cost,
          maxHp: card.hp || 1,
          currentHp: card.hp || 1,
          atk: card.atk || 1,
          keywords: card.keywords || [],
          hasDivineShield: card.keywords?.includes('Divine Shield') || false,
          canAttack: card.keywords?.includes('Charge') || false,
          isAsleep: !card.keywords?.includes('Charge'),
          hasAttackedThisTurn: false
        });
      } else if (card.type === 'spell') {
        if (card.effectId === 'destroy_target' || card.effectId === 'polymorph' || card.effectId === 'silence_target') {
          // Guaranteed to have at least 1 alivePlayerMinion because of candidate filters
          const bigThreat = [...alivePlayerMinions].sort((a, b) => b.atk - a.atk)[0];
          targetId = bigThreat.id;
          bigThreat.currentHp = 0; // Destroyed in simulation
        } else if (card.effectId === 'deal_damage') {
          const spellDmg = card.effectValue || 2;
          const killableMinion = alivePlayerMinions.find(m => m.currentHp <= spellDmg);
          const killableTaunt = tauntMinions.find(m => m.currentHp <= spellDmg);

          if (killableTaunt) {
            targetId = killableTaunt.id;
            killableTaunt.currentHp -= spellDmg;
          } else if (killableMinion) {
            targetId = killableMinion.id;
            killableMinion.currentHp -= spellDmg;
          } else if (alivePlayerMinions.length > 0) {
            const highAtk = [...alivePlayerMinions].sort((a, b) => b.atk - a.atk)[0];
            targetId = highAtk.id;
            highAtk.currentHp -= spellDmg;
          } else {
            targetId = 'player_hero';
            tempPlayerHp -= spellDmg;
          }
        } else if (card.effectId === 'heal_target' || card.effectId === 'heal_hero') {
          targetId = 'ai_hero';
          tempAiHp = Math.min(30, tempAiHp + (card.effectValue || 4));
        } else if (card.effectId === 'shield_buff' || card.effectId === 'mark_of_wild' || card.effectId === 'full_heal_taunt') {
          // Guaranteed friendly minion exists due to filter
          const targetMinion = [...aliveFriendlyMinions].sort((a, b) => (b.atk + b.currentHp) - (a.atk + a.currentHp))[0];
          targetId = targetMinion.id;
          if (card.effectId === 'shield_buff') {
            targetMinion.currentHp = Math.min(targetMinion.maxHp + (card.effectValue || 3), targetMinion.currentHp + (card.effectValue || 3));
            targetMinion.maxHp += (card.effectValue || 3);
          } else if (card.effectId === 'mark_of_wild') {
            targetMinion.atk += 2;
            targetMinion.currentHp += 2;
            targetMinion.maxHp += 2;
            if (!targetMinion.keywords.includes('Taunt')) targetMinion.keywords.push('Taunt');
          } else if (card.effectId === 'full_heal_taunt') {
            targetMinion.currentHp = targetMinion.maxHp;
            if (!targetMinion.keywords.includes('Taunt')) targetMinion.keywords.push('Taunt');
          }
        }
      }

      actions.push({
        type: 'PLAY_CARD',
        cardHandIndex: indexInSimulatedHand,
        cardTemplateId: card.templateId,
        targetId
      });
      madePlay = true;
    }
  }

  // Step 1.5: Simulate using Hero Power if possible
  if (simulatedMana >= 2) {
    const heroClass = ai.heroClass;
    let targetId = 'none';

    if (heroClass === 'Mage') {
      const alivePlayerMinions = getAliveTargets();
      const pinMinion = alivePlayerMinions.find(m => m.currentHp === 1);
      if (pinMinion) {
        targetId = pinMinion.id;
        pinMinion.currentHp -= 1;
      } else {
        targetId = 'player_hero';
        tempPlayerHp -= 1;
      }
      actions.push({
        type: 'HERO_POWER',
        targetId
      });
      simulatedMana -= 2;
    } else if (heroClass === 'Priest') {
      const damagedFriendly = getAliveFriendly().find(m => m.currentHp < m.maxHp);
      if (damagedFriendly) {
        targetId = damagedFriendly.id;
        damagedFriendly.currentHp = Math.min(damagedFriendly.maxHp, damagedFriendly.currentHp + 2);
      } else {
        targetId = 'ai_hero';
        tempAiHp = Math.min(30, tempAiHp + 2);
      }
      actions.push({
        type: 'HERO_POWER',
        targetId
      });
      simulatedMana -= 2;
    } else if (heroClass === 'Paladin') {
      simulatedAiBoard.push({
        id: generateId('recruit_sim'),
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
      });
      actions.push({
        type: 'HERO_POWER',
        targetId: 'none'
      });
      simulatedMana -= 2;
    } else if (heroClass === 'Hunter') {
      tempPlayerHp -= 2;
      actions.push({
        type: 'HERO_POWER',
        targetId: 'none'
      });
      simulatedMana -= 2;
    } else if (heroClass === 'Warrior') {
      actions.push({
        type: 'HERO_POWER',
        targetId: 'none'
      });
      simulatedMana -= 2;
    }
  }

  // Step 2: Combat Attack calculation with Lethal (킬각) check
  const activeAttackers = simulatedAiBoard.filter(m => m.atk > 0 && !m.isAsleep && !m.hasAttackedThisTurn);
  const totalBoardAttack = activeAttackers.reduce((s, m) => s + m.atk, 0) + (ai.weapon && !ai.hasAttackedThisTurn ? ai.weapon.atk : 0);

  // Check if we can secure immediate victory by ignoring trades and going face (if no Taunts are in the way)
  const activeTaunts = simulatedPlayerBoard.filter(m => m.keywords.includes('Taunt') && m.currentHp > 0);
  const isLethalSecure = (totalBoardAttack >= tempPlayerHp) && (activeTaunts.length === 0);

  activeAttackers.forEach(attacker => {
    const aliveEnemyMinions = simulatedPlayerBoard.filter(m => m.currentHp > 0);
    const taunts = aliveEnemyMinions.filter(m => m.keywords.includes('Taunt'));
    let targetId = 'player_hero';

    if (taunts.length > 0) {
      // Must trade through Taunt. Select the optimal Taunt (killable with attacker, or lowest health)
      const killableTaunt = taunts.find(m => m.currentHp <= attacker.atk);
      const chosenTaunt = killableTaunt || taunts[0];
      targetId = chosenTaunt.id;

      // Simulate combat impact
      chosenTaunt.currentHp -= attacker.atk;
      attacker.currentHp -= chosenTaunt.atk;
    } else if (isLethalSecure) {
      // Face is place! Secure instant victory
      targetId = 'player_hero';
      tempPlayerHp -= attacker.atk;
    } else {
      // Value trading logic: Favorable trading prioritised over simple face hits
      // A trade is favourable if we kill the enemy minion and ours survives!
      const favorableTrade = aliveEnemyMinions.find(m => 
        m.atk < attacker.currentHp && 
        attacker.atk >= m.currentHp && 
        m.atk > 0
      );

      if (favorableTrade) {
        targetId = favorableTrade.id;
        favorableTrade.currentHp -= attacker.atk;
        attacker.currentHp -= favorableTrade.atk;
      } else {
        // High-threat trade: Kill a huge threat even if we die
        const highThreatTrade = aliveEnemyMinions.find(m => 
          m.atk > attacker.atk && 
          attacker.atk >= m.currentHp
        );

        if (highThreatTrade) {
          targetId = highThreatTrade.id;
          highThreatTrade.currentHp -= attacker.atk;
          attacker.currentHp -= highThreatTrade.atk;
        } else {
          // Go for face
          targetId = 'player_hero';
          tempPlayerHp -= attacker.atk;
        }
      }
    }

    actions.push({
      type: 'ATTACK',
      attackerMinionId: attacker.id,
      targetId
    });
    attacker.hasAttackedThisTurn = true;
  });

  // Step 3: Weapon Attack simulation
  if (ai.weapon && !ai.hasAttackedThisTurn) {
    const aliveEnemyMinions = simulatedPlayerBoard.filter(m => m.currentHp > 0);
    const taunts = aliveEnemyMinions.filter(m => m.keywords.includes('Taunt'));
    let targetId = 'player_hero';

    if (taunts.length > 0) {
      targetId = taunts[0].id;
    } else if (isLethalSecure) {
      targetId = 'player_hero';
    } else {
      // Kill high-attack/medium-health threat with weapon to save board minions, if safe for hero life
      const killableThreat = aliveEnemyMinions.find(m => m.currentHp <= (ai.weapon?.atk || 0) && m.atk < ai.hp - 5);
      if (killableThreat) {
        targetId = killableThreat.id;
      } else {
        targetId = 'player_hero';
      }
    }

    actions.push({
      type: 'HERO_ATTACK',
      targetId
    });
  }

  const quotes = [
    "🔥 나의 대여관 마나 수급 속도와 완벽한 효율적인 필드 교환비를 보여주마!",
    "⚔️ 쓸데없는 교환은 없다! 완벽한 마나 템포와 철저히 계획된 킬각을 맞이해라!",
    "🛡️ 도발 방패와 전투의 함성은 무작위가 아닌 치밀한 수학적 배치다! 전장을 주도하지!",
    "🦅 공습 개시! 내 손패의 마나 효율을 극대화하여 네 영웅의 숨통을 조여가마!"
  ];
  const randomCommentary = quotes[Math.floor(Math.random() * quotes.length)];

  return {
    actions,
    commentary: randomCommentary
  };
}
