/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from './types';

export const CARD_POOL: Card[] = [
  // --- 비용 1 ---
  {
    id: 'm_elven_archer',
    templateId: 'm_elven_archer',
    name: '엘프 궁수',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 1,
    keywords: ['Battlecry'],
    description: '전투의 함성: 선택한 대상에게 피해를 1 줍니다.',
    effectId: 'deal_damage',
    effectValue: 1
  },
  {
    id: 'm_leper_gnome',
    templateId: 'm_leper_gnome',
    name: '오염된 노움',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 1,
    keywords: ['Deathrattle'],
    description: '죽음의 메아리: 상대 영웅에게 피해를 2 줍니다.',
    effectId: 'deal_hero_damage',
    effectValue: 2
  },
  {
    id: 'm_goldshire_footman',
    templateId: 'm_goldshire_footman',
    name: '골드샤이어 보초병',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 2,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_argent_squire',
    templateId: 'm_argent_squire',
    name: '은빛십자군 종자',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 1,
    keywords: ['Divine Shield'],
    description: '천상의 보호막'
  },
  {
    id: 'm_stonetusk_boar',
    templateId: 'm_stonetusk_boar',
    name: '돌진하는 멧돼지',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 1,
    keywords: ['Charge'],
    description: '돌진'
  },
  {
    id: 'm_voodoo_doctor',
    templateId: 'm_voodoo_doctor',
    name: '부두교 의술사',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 1,
    keywords: ['Battlecry'],
    description: '전투의 함성: 아군 캐릭터 한 명의 체력을 2 회복시킵니다.',
    effectId: 'heal_target',
    effectValue: 2
  },
  {
    id: 's_arcane_shot',
    templateId: 's_arcane_shot',
    name: '신비한 화살',
    cost: 1,
    type: 'spell',
    rarity: 'common',
    description: '선택한 대상에게 피해를 2 줍니다.',
    effectId: 'deal_damage',
    effectValue: 2
  },
  {
    id: 's_shield_buff',
    templateId: 's_shield_buff',
    name: '신의 권능: 보호막',
    cost: 1,
    type: 'spell',
    rarity: 'common',
    description: '아군 하수인 하나에게 생명력을 +3 부여하고 카드 1장을 뽑습니다.',
    effectId: 'shield_buff',
    effectValue: 3
  },
  {
    id: 'w_light_dagger',
    templateId: 'w_light_dagger',
    name: '빛의 단검',
    cost: 1,
    type: 'weapon',
    rarity: 'common',
    atk: 1,
    durability: 3,
    description: '가벼운 무기입니다.'
  },

  // --- 비용 2 ---
  {
    id: 'm_bloodfen_raptor',
    templateId: 'm_bloodfen_raptor',
    name: '민물맹독충',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 2,
    description: '칼바람 계곡의 유명한 포식자입니다.'
  },
  {
    id: 'm_acidic_ooze',
    templateId: 'm_acidic_ooze',
    name: '산성 늪수렁 괴물',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 2,
    keywords: ['Battlecry'],
    description: '전투의 함성: 상대 영웅의 파괴되지 않은 무기를 즉시 파괴합니다.',
    effectId: 'destroy_weapon'
  },
  {
    id: 'm_bluegill_warrior',
    templateId: 'm_bluegill_warrior',
    name: '푸른지느러미 전사',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 1,
    keywords: ['Charge'],
    description: '돌진'
  },
  {
    id: 'm_novice_engineer',
    templateId: 'm_novice_engineer',
    name: '풋내기 기술자',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 1,
    keywords: ['Battlecry'],
    description: '전투의 함성: 카드를 1장 뽑습니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 'm_shielded_minion',
    templateId: 'm_shielded_minion',
    name: '보호막을 든 사단장',
    cost: 2,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 2,
    keywords: ['Divine Shield'],
    description: '천상의 보호막'
  },
  {
    id: 's_frostbolt',
    templateId: 's_frostbolt',
    name: '얼음 화살',
    cost: 2,
    type: 'spell',
    rarity: 'common',
    description: '선택한 대상에게 피해를 3 줍니다.',
    effectId: 'deal_damage',
    effectValue: 3
  },
  {
    id: 's_healing_touch',
    templateId: 's_healing_touch',
    name: '성스러운 빛',
    cost: 2,
    type: 'spell',
    rarity: 'common',
    description: '아군 캐릭터 하나의 체력을 6 회복시킵니다.',
    effectId: 'heal_target',
    effectValue: 6
  },
  {
    id: 's_power_wild',
    templateId: 's_power_wild',
    name: '야생의 힘',
    cost: 2,
    type: 'spell',
    rarity: 'rare',
    description: '이 턴에 소환된 하수인이나 모든 아군 하수인에게 +1/+1 부스트를 줍니다.',
    effectId: 'buff_all_friendly',
    effectValue: 1
  },
  {
    id: 'w_heavy_axe',
    templateId: 'w_heavy_axe',
    name: '용사의 헤비 엑스',
    cost: 2,
    type: 'weapon',
    rarity: 'common',
    atk: 2,
    durability: 2,
    description: '기본 도끼 무기입니다.'
  },

  // --- 비용 3 ---
  {
    id: 'm_ironfur_grizzly',
    templateId: 'm_ironfur_grizzly',
    name: '무쇠가죽 곰',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 3,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_wolfrider',
    templateId: 'm_wolfrider',
    name: '늑대기수',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 1,
    keywords: ['Charge'],
    description: '돌진'
  },
  {
    id: 'm_harvest_golem',
    templateId: 'm_harvest_golem',
    name: '누더기 골렘 수확기',
    cost: 3,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 3,
    keywords: ['Deathrattle'],
    description: '죽음의 메아리: 2/1 고철 골렘을 1마리 임시 소환합니다.',
    effectId: 'summon_golem',
    effectValue: 1
  },
  {
    id: 'm_earthen_farseer',
    templateId: 'm_earthen_farseer',
    name: '대지 고리 선견자',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 3,
    keywords: ['Battlecry'],
    description: '전투의 함성: 선택한 대상에게 체력을 3 회복시킵니다.',
    effectId: 'heal_target',
    effectValue: 3
  },
  {
    id: 'm_scarlet_shielder',
    templateId: 'm_scarlet_shielder',
    name: '붉은십자군 성전사',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 1,
    keywords: ['Divine Shield'],
    description: '천상의 보호막'
  },
  {
    id: 's_arcane_intellect',
    templateId: 's_arcane_intellect',
    name: '신비한 지능',
    cost: 3,
    type: 'spell',
    rarity: 'common',
    description: '카드를 2장 뽑습니다.',
    effectId: 'draw_card',
    effectValue: 2
  },
  {
    id: 's_healing_water',
    templateId: 's_healing_water',
    name: '치유의 비',
    cost: 3,
    type: 'spell',
    rarity: 'common',
    description: '아군 영웅의 체력을 8 회복시킵니다.',
    effectId: 'heal_hero',
    effectValue: 8
  },
  {
    id: 'w_fiery_war_axe',
    templateId: 'w_fiery_war_axe',
    name: '이글거리는 도끼',
    cost: 3,
    type: 'weapon',
    rarity: 'common',
    atk: 3,
    durability: 2,
    description: '전사의 믿음직한 3공격력 도끼입니다.'
  },

  // --- 비용 4 ---
  {
    id: 'm_senjin_shieldmasta',
    templateId: 'm_senjin_shieldmasta',
    name: '센진 방패대가',
    cost: 4,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 5,
    keywords: ['Taunt'],
    description: '도발 (야~ 호!)'
  },
  {
    id: 'm_chillwind_yeti',
    templateId: 'm_chillwind_yeti',
    name: '서리바람 예티',
    cost: 4,
    type: 'minion',
    rarity: 'common',
    atk: 4,
    hp: 5,
    description: '말장난도 안 통하는 완벽한 가성비의 서리바람 괴수.'
  },
  {
    id: 'm_gnomish_inventor',
    templateId: 'm_gnomish_inventor',
    name: '노움 발명가',
    cost: 4,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 4,
    keywords: ['Battlecry'],
    description: '전투의 함성: 카드를 1장 뽑습니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 'm_spellbreaker',
    templateId: 'm_spellbreaker',
    name: '주문파괴자',
    cost: 4,
    type: 'minion',
    rarity: 'common',
    atk: 4,
    hp: 3,
    keywords: ['Battlecry'],
    description: '전투의 함성: 지목한 하수인 하나의 천상의 보호막을 해제하고 체력을 1 깎습니다.',
    effectId: 'silence_target'
  },
  {
    id: 's_fireball',
    templateId: 's_fireball',
    name: '화염구',
    cost: 4,
    type: 'spell',
    rarity: 'common',
    description: '선택한 대상에게 피해를 6 줍니다.',
    effectId: 'deal_damage',
    effectValue: 6
  },
  {
    id: 's_consecration',
    templateId: 's_consecration',
    name: '신성화',
    cost: 4,
    type: 'spell',
    rarity: 'common',
    description: '모든 적 하수인에게 피해를 2 줍니다.',
    effectId: 'aoe_enemies',
    effectValue: 2
  },
  {
    id: 's_polymorph',
    templateId: 's_polymorph',
    name: '변이',
    cost: 4,
    type: 'spell',
    rarity: 'rare',
    description: '선택한 하수인을 1/1 귀여운 양으로 만듭니다.',
    effectId: 'polymorph'
  },
  {
    id: 'w_truesilver_champion',
    templateId: 'w_truesilver_champion',
    name: '진은검',
    cost: 4,
    type: 'weapon',
    rarity: 'rare',
    atk: 4,
    durability: 2,
    description: '전투의 함성: 아군 영웅의 체력을 4 회복시킵니다.',
    effectId: 'heal_hero',
    effectValue: 4
  },
  {
    id: 'w_death_bite',
    templateId: 'w_death_bite',
    name: '죽음의 이빨',
    cost: 4,
    type: 'weapon',
    rarity: 'rare',
    atk: 4,
    durability: 2,
    keywords: ['Deathrattle'],
    description: '죽음의 메아리: 모든 전장의 하수인에게 광역 피해를 1 줍니다.',
    effectId: 'whirlwind',
    effectValue: 1
  },

  // --- 비용 5 ---
  {
    id: 'm_booty_bay_bodyguard',
    templateId: 'm_booty_bay_bodyguard',
    name: '무법항 경호원',
    cost: 5,
    type: 'minion',
    rarity: 'common',
    atk: 5,
    hp: 4,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_sludge_belcher',
    templateId: 'm_sludge_belcher',
    name: '썩은가죽 벼룩',
    cost: 5,
    type: 'minion',
    rarity: 'rare',
    atk: 3,
    hp: 5,
    keywords: ['Taunt', 'Deathrattle'],
    description: '도발, 죽음의 메아리: 1/2 도발 능력을 가진 슬라이드를 1마리 소환합니다.',
    effectId: 'summon_slime',
    effectValue: 1
  },
  {
    id: 'm_anubis_guardian',
    templateId: 'm_anubis_guardian',
    name: '아누비스 수호병',
    cost: 5,
    type: 'minion',
    rarity: 'rare',
    atk: 4,
    hp: 6,
    keywords: ['Divine Shield'],
    description: '천상의 보호막'
  },
  {
    id: 's_assassinate',
    templateId: 's_assassinate',
    name: '암살',
    cost: 5,
    type: 'spell',
    rarity: 'common',
    description: '선택한 적 하수인을 처치합니다.',
    effectId: 'destroy_target'
  },
  {
    id: 's_bloodlust',
    templateId: 's_bloodlust',
    name: '피의 욕망',
    cost: 5,
    type: 'spell',
    rarity: 'epic',
    description: '모든 아군 하수인에게 공격력을 +3 부여합니다.',
    effectId: 'bloodlust',
    effectValue: 3
  },
  {
    id: 'w_arcanite_reaper',
    templateId: 'w_arcanite_reaper',
    name: '아케인 도끼',
    cost: 5,
    type: 'weapon',
    rarity: 'common',
    atk: 5,
    durability: 2,
    description: '매우 묵직하여 무자비하게 상대를 내리찍습니다.'
  },

  // --- 비용 6 ---
  {
    id: 'm_boulderfist_ogre',
    templateId: 'm_boulderfist_ogre',
    name: '돌주먹 오우거',
    cost: 6,
    type: 'minion',
    rarity: 'common',
    atk: 6,
    hp: 7,
    description: '우수한 공체합과 주파력으로 명성을 떨친 필드의 고지주.'
  },
  {
    id: 'm_sunwalker',
    templateId: 'm_sunwalker',
    name: '태양길잡이',
    cost: 6,
    type: 'minion',
    rarity: 'rare',
    atk: 4,
    hp: 5,
    keywords: ['Taunt', 'Divine Shield'],
    description: '도발, 천상의 보호막'
  },
  {
    id: 's_blizzard',
    templateId: 's_blizzard',
    name: '눈보라',
    cost: 6,
    type: 'spell',
    rarity: 'rare',
    description: '모든 적 하수인에게 피해를 2 줍니다.',
    effectId: 'aoe_enemies',
    effectValue: 2
  },

  // --- 비용 7 ---
  {
    id: 'm_core_hound',
    templateId: 'm_core_hound',
    name: '심장부 사냥개',
    cost: 7,
    type: 'minion',
    rarity: 'common',
    atk: 9,
    hp: 5,
    description: '비록 체력은 낮아도 한 방 공격력만큼은 9에 육박하는 괴수.'
  },
  {
    id: 'm_stormwind_champion',
    templateId: 'm_stormwind_champion',
    name: '스톰윈드 용사',
    cost: 7,
    type: 'minion',
    rarity: 'common',
    atk: 6,
    hp: 6,
    keywords: ['Battlecry'],
    description: '전투의 함성: 아군 영웅의 체력을 6 회복시키고, 모든 내 하수인에게 +1/+1 버프를 줍니다.',
    effectId: 'stormwind_cry',
    effectValue: 6
  },
  {
    id: 's_flamestrike',
    templateId: 's_flamestrike',
    name: '불기둥',
    cost: 7,
    type: 'spell',
    rarity: 'common',
    description: '모든 적 하수인에게 피해를 5 줍니다.',
    effectId: 'aoe_enemies_all',
    effectValue: 5
  },

  // --- 비용 8 ---
  {
    id: 'm_ragnaros',
    templateId: 'm_ragnaros',
    name: '불의 군주 라그나로스',
    cost: 8,
    type: 'minion',
    rarity: 'legendary',
    atk: 8,
    hp: 8,
    keywords: ['Battlecry'],
    description: '전투의 함성: 임의의 적 하나에게 강력한 불덩이를 던져 참혹한 8의 생명력 피해를 입힙니다.',
    effectId: 'random_fire_blast',
    effectValue: 8
  },
  {
    id: 'm_tirion',
    templateId: 'm_tirion',
    name: '티리온 폴드링',
    cost: 8,
    type: 'minion',
    rarity: 'legendary',
    atk: 6,
    hp: 6,
    keywords: ['Taunt', 'Divine Shield', 'Deathrattle'],
    description: '도발, 천상의 보호막, 죽음의 메아리: 공격력 5, 내구도 3의 명검 \'파멸의 인도자\' 아이템을 착용합니다.',
    effectId: 'equip_ashbringer'
  },

  // --- 비용 9 ---
  {
    id: 'm_alexstrasza',
    templateId: 'm_alexstrasza',
    name: '알렉스트라자',
    cost: 9,
    type: 'minion',
    rarity: 'legendary',
    atk: 8,
    hp: 8,
    keywords: ['Battlecry'],
    description: '전투의 함성: 상대방 영웅의 체력을 15로 강제 설정하여 생명력을 조절합니다.',
    effectId: 'set_health_15',
    effectValue: 15
  },
  {
    id: 'm_ysera',
    templateId: 'm_ysera',
    name: '녹색용 이세라',
    cost: 9,
    type: 'minion',
    rarity: 'legendary',
    atk: 4,
    hp: 12,
    keywords: ['Battlecry'],
    description: '전투의 함성: 카드 3장을 즉시 하늘에서 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 3
  },

  // --- 비용 10 ---
  {
    id: 'm_deathwing',
    templateId: 'm_deathwing',
    name: '파괴자 데스윙',
    cost: 10,
    type: 'minion',
    rarity: 'legendary',
    atk: 12,
    hp: 12,
    keywords: ['Battlecry'],
    description: '전투의 함성: 전장의 다른 모든 하수인들을 통째로 불살라 영구 파괴합니다.',
    effectId: 'destroy_all_minions'
  },
  {
    id: 's_pyroblast',
    templateId: 's_pyroblast',
    name: '불덩이 작렬',
    cost: 10,
    type: 'spell',
    rarity: 'epic',
    description: '모든 대상 중 하나를 전율의 고통으로 내리쳐 피해를 10 줍니다.',
    effectId: 'deal_damage',
    effectValue: 10
  },

  // --- 추가 기타 테마 카드들로 70장 채우기 ---
  {
    id: 'm_murloc_raider',
    templateId: 'm_murloc_raider',
    name: '멀록 습격자',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 1,
    description: '아옳옳옳!'
  },
  {
    id: 'm_spellbreaker_apprentice',
    templateId: 'm_spellbreaker_apprentice',
    name: '주문파괴 신임생',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 3,
    description: '가벼운 방어용 사관생 하수인.'
  },
  {
    id: 'm_wolf_companion',
    templateId: 'm_wolf_companion',
    name: '야수 무리늑대',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 2,
    keywords: ['Charge'],
    description: '돌진'
  },
  {
    id: 'm_defender_shield',
    templateId: 'm_defender_shield',
    name: '은빛 방패병',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 4,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_mana_spark',
    templateId: 'm_mana_spark',
    name: '마나 마력불새',
    cost: 2,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 3,
    keywords: ['Battlecry'],
    description: '전투의 함성: 카드를 1장 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 'm_spidertank',
    templateId: 'm_spidertank',
    name: '태엽 장치 거미 전차',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 4,
    description: '대단한 튼튼함을 가진 노움의 훌륭한 공사장 기계.'
  },
  {
    id: 'm_raging_berserker',
    templateId: 'm_raging_berserker',
    name: '맹렬한 광전사',
    cost: 3,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 4,
    description: '격노에 차 있으며, 튼튼한 체력을 바탕으로 지배합니다.'
  },
  {
    id: 'm_jungle_panther',
    templateId: 'm_jungle_panther',
    name: '가시덤불 호랑이',
    cost: 5,
    type: 'minion',
    rarity: 'common',
    atk: 5,
    hp: 5,
    description: '밀림의 가장 위협적으로 번개 같이 덮치는 맹수.'
  },
  {
    id: 'm_frostwolf_warlord',
    templateId: 'm_frostwolf_warlord',
    name: '서리늑대 부족장',
    cost: 5,
    type: 'minion',
    rarity: 'common',
    atk: 4,
    hp: 4,
    keywords: ['Battlecry'],
    description: '전투의 함성: 내 영웅 체력을 4 회복시킵니다.',
    effectId: 'heal_hero',
    effectValue: 4
  },
  {
    id: 'm_reckless_rocketeer',
    templateId: 'm_reckless_rocketeer',
    name: '무모한 로켓병',
    cost: 6,
    type: 'minion',
    rarity: 'common',
    atk: 5,
    hp: 2,
    keywords: ['Charge'],
    description: '돌진'
  },
  {
    id: 'm_temple_enforcer',
    templateId: 'm_temple_enforcer',
    name: '대사원 집행관',
    cost: 6,
    type: 'minion',
    rarity: 'common',
    atk: 6,
    hp: 6,
    keywords: ['Battlecry'],
    description: '전투의 함성: 지목한 아군 하수인에게 체력을 +3 추가 부여합니다.',
    effectId: 'shield_buff',
    effectValue: 3
  },
  {
    id: 'm_ancient_of_war',
    templateId: 'm_ancient_of_war',
    name: '전쟁의 고대정령',
    cost: 7,
    type: 'minion',
    rarity: 'epic',
    atk: 5,
    hp: 10,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_gladiator',
    templateId: 'm_gladiator',
    name: '검투사 골리앗',
    cost: 7,
    type: 'minion',
    rarity: 'rare',
    atk: 7,
    hp: 6,
    keywords: ['Taunt', 'Divine Shield'],
    description: '도발, 천상의 보호막'
  },
  {
    id: 'm_gruul',
    templateId: 'm_gruul',
    name: '학살자 그룰',
    cost: 8,
    type: 'minion',
    rarity: 'legendary',
    atk: 7,
    hp: 7,
    keywords: ['Challenge'],
    description: '도발과 돌진의 강점에 버금가는 거대 용사입니다.'
  },
  {
    id: 'm_grommash',
    templateId: 'm_grommash',
    name: '그롬마쉬 헬스크림',
    cost: 8,
    type: 'minion',
    rarity: 'legendary',
    atk: 9,
    hp: 7,
    keywords: ['Charge'],
    description: '돌진'
  },
  {
    id: 's_ancestral_healing',
    templateId: 's_ancestral_healing',
    name: '선조의 치유력',
    cost: 0,
    type: 'spell',
    rarity: 'common',
    description: '지정한 하수인의 체력을 가득 채우고 도발(Taunt) 속성을 제공합니다.',
    effectId: 'full_heal_taunt'
  },
  {
    id: 's_corruption',
    templateId: 's_corruption',
    name: '부패 살점폭발',
    cost: 1,
    type: 'spell',
    rarity: 'common',
    description: '선택한 적 하수인에게 피해를 3 입힙니다.',
    effectId: 'deal_damage',
    effectValue: 3
  },
  {
    id: 's_cleave',
    templateId: 's_cleave',
    name: '갈라치기',
    cost: 2,
    type: 'spell',
    rarity: 'common',
    description: '임의의 적 하수인 2명에게 각각 피해를 2씩 줍니다.',
    effectId: 'random_cleave',
    effectValue: 2
  },
  {
    id: 's_mark_of_wild',
    templateId: 's_mark_of_wild',
    name: '야생의 증표',
    cost: 2,
    type: 'spell',
    rarity: 'common',
    description: '하수인 하나에게 도발 능력과 공격력+2, 체력+2를 부여합니다.',
    effectId: 'mark_of_wild'
  },
  {
    id: 's_shadow_word_pain',
    templateId: 's_shadow_word_pain',
    name: '어둠의 권능: 고통',
    cost: 2,
    type: 'spell',
    rarity: 'common',
    description: '지정한 적 하수인 하나를 처단해 영면을 줍니다.',
    effectId: 'destroy_target'
  },
  {
    id: 's_savage_roar',
    templateId: 's_savage_roar',
    name: '야생의 포효',
    cost: 3,
    type: 'spell',
    rarity: 'common',
    description: '모든 아군 하수인과 영웅에게 이번 턴에 공격력 +2를 일시 부여합니다.',
    effectId: 'savage_roar',
    effectValue: 2
  },
  {
    id: 's_heroic_strike',
    templateId: 's_heroic_strike',
    name: '영웅의 격노격',
    cost: 2,
    type: 'spell',
    rarity: 'common',
    description: '내 영웅이 이번 턴에 공격력을 +4 얻어 직접 적을 타격할 수 있습니다.',
    effectId: 'hero_strike_buff',
    effectValue: 4
  },
  {
    id: 'w_assassins_blade',
    templateId: 'w_assassins_blade',
    name: '암살자의 군검',
    cost: 5,
    type: 'weapon',
    rarity: 'common',
    atk: 3,
    durability: 4,
    description: '엄청난 내구도(4회)를 지닌 암살용 독성 무기입니다.'
  },
  {
    id: 'w_stormpike_hammer',
    templateId: 'w_stormpike_hammer',
    name: '스톰파이크 전기망치',
    cost: 3,
    type: 'weapon',
    rarity: 'rare',
    atk: 2,
    durability: 3,
    description: '전투의 함성: 무작위 적 하수인 하나에게 피해를 2 줍니다.',
    effectId: 'stormpike_effect',
    effectValue: 2
  },
  {
    id: 'w_fiery_doom',
    templateId: 'w_fiery_doom',
    name: '지옥의 불꽃 둔기',
    cost: 6,
    type: 'weapon',
    rarity: 'epic',
    atk: 5,
    durability: 2,
    keywords: ['Battlecry'],
    description: '전투의 함성: 모든 적 하수인들에게 대미지 1을 휘두릅니다.',
    effectId: 'aoe_enemies',
    effectValue: 1
  },

  // --- 추가 50장 클래식 하스스톤 테마 카드 ---
  {
    id: 'm_northshire_cleric',
    templateId: 'm_northshire_cleric',
    name: '북녘골 성직자',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 3,
    keywords: ['Battlecry'],
    description: '전투의 함성: 카드를 1장 기쁘게 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 'm_voidwalker',
    templateId: 'm_voidwalker',
    name: '공허방랑자',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 3,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_mana_wyrm',
    templateId: 'm_mana_wyrm',
    name: '마나 지룡',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 3,
    description: '학구열에 가득 찬 왜소하고 귀여운 야수입니다.'
  },
  {
    id: 'm_abusive_sergeant',
    templateId: 'm_abusive_sergeant',
    name: '가혹한 하사관',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 1,
    keywords: ['Battlecry'],
    description: '전투의 함성: 무작위 적 하수인 하나에게 성가신 가벼운 피해를 2 줍니다.',
    effectId: 'stormpike_effect',
    effectValue: 2
  },
  {
    id: 'm_shieldbearer',
    templateId: 'm_shieldbearer',
    name: '방패병',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 0,
    hp: 4,
    keywords: ['Taunt'],
    description: '도발 (뚫어봐라!)'
  },
  {
    id: 's_mortal_coil',
    templateId: 's_mortal_coil',
    name: '필멸의 고리',
    cost: 1,
    type: 'spell',
    rarity: 'common',
    description: '필멸의 영혼을 엮어 즉각 카드를 1장 뽑습니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 's_holy_smite',
    templateId: 's_holy_smite',
    name: '성스러운 강타',
    cost: 1,
    type: 'spell',
    rarity: 'common',
    description: '어스름 속에 정화의 낙뢰를 내려 피해를 2 가합니다.',
    effectId: 'deal_damage',
    effectValue: 2
  },
  {
    id: 'm_loot_hoarder',
    templateId: 'm_loot_hoarder',
    name: '전리품 수집가',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 1,
    keywords: ['Deathrattle'],
    description: '죽음의 메아리: 카드를 1장 정산 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 'm_bloodmage_thalnos',
    templateId: 'm_bloodmage_thalnos',
    name: '혈법사 탈노스',
    cost: 2,
    type: 'minion',
    rarity: 'legendary',
    atk: 1,
    hp: 1,
    keywords: ['Divine Shield', 'Deathrattle'],
    description: '천상의 보호막, 죽음의 메아리: 신비한 비술로 카드를 1장 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 'm_dire_wolf_alpha',
    templateId: 'm_dire_wolf_alpha',
    name: '광포한 늑대 우두머리',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 2,
    keywords: ['Battlecry'],
    description: '전투의 함성: 모든 아군 하수인들의 투지를 일깨워 공격력+1 버프를 줍니다.',
    effectId: 'buff_all_friendly',
    effectValue: 1
  },
  {
    id: 'm_knife_juggler',
    templateId: 'm_knife_juggler',
    name: '단검 곡예사',
    cost: 2,
    type: 'minion',
    rarity: 'rare',
    atk: 3,
    hp: 2,
    keywords: ['Battlecry'],
    description: '전투의 함성: 예리한 대거를 투척해 임의의 장외 적 하수인에게 피해를 1 줍니다.',
    effectId: 'stormpike_effect',
    effectValue: 1
  },
  {
    id: 'm_sunfury_protector',
    templateId: 'm_sunfury_protector',
    name: '태양성직자 파수병',
    cost: 2,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 3,
    keywords: ['Battlecry'],
    description: '전투의 함성: 전장의 모든 적 하수인들에게 피해를 1씩 쏘아 보냅니다.',
    effectId: 'aoe_enemies',
    effectValue: 1
  },
  {
    id: 'm_bluegill_warrior_remix',
    templateId: 'm_bluegill_warrior_remix',
    name: '미치광이 봄버',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 2,
    description: '폭탄을 전장에 이리저리 던지고 싶어서 매일 밤 광기에 몸부림치고 소리치는 미치광이 노움 하수인입니다.'
  },
  {
    id: 'm_milhouse_manastorm',
    templateId: 'm_milhouse_manastorm',
    name: '밀하우스 마나스톰',
    cost: 2,
    type: 'minion',
    rarity: 'legendary',
    atk: 4,
    hp: 4,
    description: '어마어마하게 우월한 공체합을 저렴하게 무장한 채 출격하는 시공간의 독보적 대마법사.'
  },
  {
    id: 's_wild_growth',
    templateId: 's_wild_growth',
    name: '급속 성장',
    cost: 2,
    type: 'spell',
    rarity: 'common',
    description: '생명의 기운을 활성화해 주 마나를 이번 턴에 1회 한정 1 늘리며 동시에 카드 1장을 드로우카드로 얻습니다.',
    effectId: 'gain_mana_one_turn',
    effectValue: 1
  },
  {
    id: 'm_acolyte_of_pain',
    templateId: 'm_acolyte_of_pain',
    name: '고통의 수행사제',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 1,
    hp: 3,
    keywords: ['Battlecry'],
    description: '전투의 함성: 고통의 교훈을 삼아 카드를 2장 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 2
  },
  {
    id: 'm_coldlight_oracle',
    templateId: 'm_coldlight_oracle',
    name: '시린빛 점술사',
    cost: 3,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 2,
    keywords: ['Battlecry'],
    description: '전투의 함성: 카드 2장을 낚아올리듯 신속히 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 2
  },
  {
    id: 'm_unbound_elemental',
    templateId: 'm_unbound_elemental',
    name: '날뛰는 정령',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 4,
    description: '전장을 푸른 대정령의 가호 아래 지배하는 수려한 자연물 정령.'
  },
  {
    id: 'm_flesheating_ghoul',
    templateId: 'm_flesheating_ghoul',
    name: '살점 먹는 구울',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 2,
    hp: 3,
    description: '전장에서의 피비린내 나는 폭력사태와 상해를 숨죽이고 묘한 탐욕적 표정으로 관찰하는 구울.'
  },
  {
    id: 'm_emperor_cobra',
    templateId: 'm_emperor_cobra',
    name: '황제코브라',
    cost: 3,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 3,
    keywords: ['Divine Shield'],
    description: '천상의 보호막'
  },
  {
    id: 'm_scarlet_crusader',
    templateId: 'm_scarlet_crusader',
    name: '붉은십자군 기사',
    cost: 3,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 1,
    keywords: ['Divine Shield'],
    description: '천상의 보호막'
  },
  {
    id: 's_sprint_mini',
    templateId: 's_sprint_mini',
    name: '소형 촉발 포효',
    cost: 3,
    type: 'spell',
    rarity: 'common',
    description: '순간의 기적을 촉진하여 내 영웅의 가쁜 체력을 4 치유하는 동시에 카드 1장을 뽑습니다.',
    effectId: 'draw_card',
    effectValue: 1
  },
  {
    id: 'm_twilight_drake',
    templateId: 'm_twilight_drake',
    name: '황혼의 비룡',
    cost: 4,
    type: 'minion',
    rarity: 'rare',
    atk: 4,
    hp: 4,
    keywords: ['Battlecry'],
    description: '전투의 함성: 아군 하수인 하나에게 생명력 +3 버프를 전사하고 카드 1장을 드로우해 결합 보강합니다.',
    effectId: 'shield_buff',
    effectValue: 3
  },
  {
    id: 'm_defender_of_argus',
    templateId: 'm_defender_of_argus',
    name: '아르거스의 수호자',
    cost: 4,
    type: 'minion',
    rarity: 'rare',
    atk: 2,
    hp: 3,
    keywords: ['Battlecry'],
    description: '전투의 함성: 모든 내 아군 배치 하수인군단에게 +1/+1 격려 고무 상승 버프를 걸어 힘을 모읍니다.',
    effectId: 'buff_all_friendly',
    effectValue: 1
  },
  {
    id: 'm_water_elemental',
    templateId: 'm_water_elemental',
    name: '물의 정령',
    cost: 4,
    type: 'minion',
    rarity: 'common',
    atk: 3,
    hp: 6,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_dark_iron_dwarf',
    templateId: 'm_dark_iron_dwarf',
    name: '검은무쇠 난쟁이',
    cost: 4,
    type: 'minion',
    rarity: 'common',
    atk: 4,
    hp: 4,
    keywords: ['Battlecry'],
    description: '전투의 함성: 아군 전체를 강해지게 격앙시켜 전체 공격력 상승(+1/+1)을 부여합니다.',
    effectId: 'buff_all_friendly',
    effectValue: 1
  },
  {
    id: 'm_violet_teacher',
    templateId: 'm_violet_teacher',
    name: '보랏빛 여교사',
    cost: 4,
    type: 'minion',
    rarity: 'rare',
    atk: 3,
    hp: 5,
    description: '차갑고 도도하게 한 치 어긋남 없이 엄혹한 전술 기예 교육을 선도하는 정통 아카데미 교두.'
  },
  {
    id: 'm_tazdingo_gold',
    templateId: 'm_tazdingo_gold',
    name: '황금빛 타즈딩고',
    cost: 4,
    type: 'minion',
    rarity: 'epic',
    atk: 3,
    hp: 6,
    keywords: ['Taunt'],
    description: '도발 (황금 방패를 들고 영혼의 함성을 질러 적들을 강력하게 위협합니다.)'
  },
  {
    id: 's_swipe',
    templateId: 's_swipe',
    name: '휘둘러치기',
    cost: 4,
    type: 'spell',
    rarity: 'common',
    description: '맹수의 갈퀴를 투영함으로써 상대방 전장의 모든 하수인에게 피해를 2씩 가합니다.',
    effectId: 'aoe_enemies',
    effectValue: 2
  },
  {
    id: 'm_azure_drake',
    templateId: 'm_azure_drake',
    name: '하늘빛 비룡',
    cost: 5,
    type: 'minion',
    rarity: 'rare',
    atk: 4,
    hp: 4,
    keywords: ['Battlecry'],
    description: '전투의 함성: 하늘길을 개척해 즉각 카드 2장을 연속으로 비전 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 2
  },
  {
    id: 'm_harrison_jones',
    templateId: 'm_harrison_jones',
    name: '해리슨 존스',
    cost: 5,
    type: 'minion',
    rarity: 'legendary',
    atk: 5,
    hp: 4,
    keywords: ['Battlecry'],
    description: '전투의 함성: 상대 보물을 고찰하며 카드 2장을 정교하게 신속 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 2
  },
  {
    id: 'm_loatheb',
    templateId: 'm_loatheb',
    name: '로데브',
    cost: 5,
    type: 'minion',
    rarity: 'legendary',
    atk: 5,
    hp: 5,
    keywords: ['Battlecry'],
    description: '전투의 함성: 역병 포자를 살포하여 아군 영웅 캐릭터의 건강을 온화하게 5 회복합니다.',
    effectId: 'heal_hero',
    effectValue: 5
  },
  {
    id: 'm_druid_of_the_claw',
    templateId: 'm_druid_of_the_claw',
    name: '발톱의 고대정령',
    cost: 5,
    type: 'minion',
    rarity: 'common',
    atk: 4,
    hp: 6,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_abomination',
    templateId: 'm_abomination',
    name: '복수의 아보미네이션',
    cost: 5,
    type: 'minion',
    rarity: 'rare',
    atk: 4,
    hp: 4,
    keywords: ['Taunt', 'Deathrattle'],
    description: '도발, 죽음의 메아리: 역겨운 파편을 흩뿌려 모든 전장의 적 하수인에게 광역 피해를 2 가합니다.',
    effectId: 'aoe_enemies',
    effectValue: 2
  },
  {
    id: 's_nourish',
    templateId: 's_nourish',
    name: '육성',
    cost: 5,
    type: 'spell',
    rarity: 'rare',
    description: '대자연의 풍요한 자양분을 섭취하여 카드 3장을 쥐어짜듯이 한껏 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 3
  },
  {
    id: 'm_cairne_bloodhoof',
    templateId: 'm_cairne_bloodhoof',
    name: '케인 블러드후프',
    cost: 6,
    type: 'minion',
    rarity: 'legendary',
    atk: 4,
    hp: 5,
    keywords: ['Deathrattle'],
    description: '죽음의 메아리: 다음 세대를 위엄있게 계승해 2/1 가디언 고철 골렘 토큰을 소환합니다.',
    effectId: 'summon_golem',
    effectValue: 1
  },
  {
    id: 'm_sylvanas_windrunner',
    templateId: 'm_sylvanas_windrunner',
    name: '실바나스 윈드러너',
    cost: 6,
    type: 'minion',
    rarity: 'legendary',
    atk: 5,
    hp: 5,
    keywords: ['Battlecry'],
    description: '전투의 함성: 부정한 침묵의 저주를 뿜어 지척의 적 하수인 하나를 처치해 단절합니다.',
    effectId: 'destroy_target'
  },
  {
    id: 'm_sunwalker_gold',
    templateId: 'm_sunwalker_gold',
    name: '황금 태양길잡이',
    cost: 6,
    type: 'minion',
    rarity: 'rare',
    atk: 4,
    hp: 6,
    keywords: ['Taunt', 'Divine Shield'],
    description: '도발, 천상의 보호막'
  },
  {
    id: 'm_argent_commander',
    templateId: 'm_argent_commander',
    name: '은빛십자군 부대장',
    cost: 6,
    type: 'minion',
    rarity: 'common',
    atk: 4,
    hp: 2,
    keywords: ['Charge', 'Divine Shield'],
    description: '돌진, 천상의 보호막'
  },
  {
    id: 'm_reaper_of_doom',
    templateId: 'm_reaper_of_doom',
    name: '황금 수확기',
    cost: 6,
    type: 'minion',
    rarity: 'epic',
    atk: 6,
    hp: 5,
    keywords: ['Battlecry'],
    description: '전투의 함성: 낫을 휘둘러 곡식을 추수하듯 기이하게 카드 2장을 드로우합니다.',
    effectId: 'draw_card',
    effectValue: 2
  },
  {
    id: 's_sprint',
    templateId: 's_sprint',
    name: '질주',
    cost: 7,
    type: 'spell',
    rarity: 'common',
    description: '극강의 날렵함으로 전광석화처럼 카드 4장을 즉시 연달아 드로우하여 소지합니다.',
    effectId: 'draw_card',
    effectValue: 4
  },
  {
    id: 'm_dr_boom',
    templateId: 'm_dr_boom',
    name: '박사 붐',
    cost: 7,
    type: 'minion',
    rarity: 'legendary',
    atk: 7,
    hp: 7,
    keywords: ['Battlecry'],
    description: '전투의 함성: 기계 폭탄 가디언의 위용을 담아 2/1 고철 보철 골렘 1마리를 새로이 복제 조립 배치합니다.',
    effectId: 'summon_golem',
    effectValue: 1
  },
  {
    id: 'm_baron_geddon',
    templateId: 'm_baron_geddon',
    name: '남작 게돈',
    cost: 7,
    type: 'minion',
    rarity: 'legendary',
    atk: 7,
    hp: 5,
    keywords: ['Battlecry'],
    description: '전투의 함성: 전장의 수많은 잔당들에게 유황 메테오를 내려 모든 하수인에게 광휘 피해를 1씩 안깁니다.',
    effectId: 'whirlwind',
    effectValue: 1
  },
  {
    id: 'm_bog_creeper',
    templateId: 'm_bog_creeper',
    name: '늪지 이끼괴물',
    cost: 7,
    type: 'minion',
    rarity: 'common',
    atk: 6,
    hp: 8,
    keywords: ['Taunt'],
    description: '도발 (그 누구도 통과하지 못하리라!)'
  },
  {
    id: 's_fire_pillar',
    templateId: 's_fire_pillar',
    name: '불기둥의 비',
    cost: 7,
    type: 'spell',
    rarity: 'epic',
    description: '고고한 불기둥을 화룡점정으로 하늘에서 무수히 낙하시켜 모든 적 전장 하수인에게 5 범위의 심판 불길을 퍼붓습니다.',
    effectId: 'aoe_enemies_all',
    effectValue: 5
  },
  {
    id: 'm_kelthuzad',
    templateId: 'm_kelthuzad',
    name: '지배자 켈투사드',
    cost: 8,
    type: 'minion',
    rarity: 'legendary',
    atk: 6,
    hp: 8,
    keywords: ['Battlecry'],
    description: '전투의 함성: 낙스라마스의 가호로 아군 캐릭터들의 피로 체력을 6 정교히 소생 수혈하고 힘을 충당합니다.',
    effectId: 'stormwind_cry',
    effectValue: 6
  },
  {
    id: 'm_ragnaros_remix',
    templateId: 'm_ragnaros_remix',
    name: '라그나로스의 빛',
    cost: 8,
    type: 'minion',
    rarity: 'legendary',
    atk: 8,
    hp: 8,
    keywords: ['Battlecry'],
    description: '전투의 함성: 불기둥 광탄을 던져 무작위 적 하나에게 엄중한 화염 대미지 8을 먹입니다.',
    effectId: 'random_fire_blast',
    effectValue: 8
  },
  {
    id: 'm_ironbark_protector',
    templateId: 'm_ironbark_protector',
    name: '무쇠껍질 수호자',
    cost: 8,
    type: 'minion',
    rarity: 'common',
    atk: 8,
    hp: 8,
    keywords: ['Taunt'],
    description: '도발'
  },
  {
    id: 'm_king_krush',
    templateId: 'm_king_krush',
    name: '왕 크루쉬',
    cost: 9,
    type: 'minion',
    rarity: 'legendary',
    atk: 8,
    hp: 8,
    keywords: ['Charge'],
    description: '돌진 (전장을 쿵쾅거리며 진입해 상대를 궤멸합니다.)'
  },
  {
    id: 'm_malygos',
    templateId: 'm_malygos',
    name: '푸른빛 말리고스',
    cost: 9,
    type: 'minion',
    rarity: 'legendary',
    atk: 4,
    hp: 12,
    keywords: ['Battlecry'],
    description: '전투의 함성: 푸른 비전성운의 폭발로 적 하수인들에게 일제히 광역 5 대미지 포화를 흩뿌려 선사합니다.',
    effectId: 'aoe_enemies_all',
    effectValue: 5
  },
  // --- 비밀 & 토템 & 악마 & 신규 카드군 ---
  {
    id: 's_explosive_trap',
    templateId: 's_explosive_trap',
    name: '비밀: 폭발의 덫 (Secret)',
    cost: 2,
    type: 'spell',
    rarity: 'rare',
    description: '🛡️ 비밀: 상대방 필드의 모든 대원에게 피해를 2 줍니다. (격발 시 대기 없이 소탕 피해 시전)',
    effectId: 'aoe_enemies',
    effectValue: 2
  },
  {
    id: 's_ice_barrier',
    templateId: 's_ice_barrier',
    name: '비밀: 얼음 화막 (Secret)',
    cost: 3,
    type: 'spell',
    rarity: 'rare',
    description: '🛡️ 비밀: 아군 영웅이 차가운 비호를 입어 즉시 생명력을 8 회복합니다.',
    effectId: 'heal_hero',
    effectValue: 8
  },
  {
    id: 'm_flametongue_totem',
    templateId: 'm_flametongue_totem',
    name: '불꽃의 토템 (Totem)',
    cost: 2,
    type: 'minion',
    rarity: 'common',
    atk: 0,
    hp: 3,
    keywords: ['Battlecry'],
    description: '토템. 전투의 함성: 모든 아군 하수인에게 피의 기세를 휘감아 영구히 공격력 +2를 증폭합니다.',
    effectId: 'bloodlust',
    effectValue: 2
  },
  {
    id: 'm_healing_totem',
    templateId: 'm_healing_totem',
    name: '치유의 토템 (Totem)',
    cost: 1,
    type: 'minion',
    rarity: 'common',
    atk: 0,
    hp: 2,
    keywords: ['Battlecry'],
    description: '토템. 전투의 함성: 구원 구도를 세워 아군 영웅의 체력을 6 치유 회복합니다.',
    effectId: 'heal_hero',
    effectValue: 6
  },
  {
    id: 'm_jaraxxus',
    templateId: 'm_jaraxxus',
    name: '군주 자락서스 (Demon)',
    cost: 9,
    type: 'minion',
    rarity: 'legendary',
    atk: 3,
    hp: 15,
    keywords: ['Battlecry'],
    description: '악마. 전투의 함성: 내 영웅이 지옥의 기운을 받아 즉시 체력을 15 회복합니다.',
    effectId: 'heal_hero',
    effectValue: 15
  },
  {
    id: 'm_tirion_fordring',
    templateId: 'm_tirion_fordring',
    name: '티리온 폴드링',
    cost: 8,
    type: 'minion',
    rarity: 'legendary',
    atk: 6,
    hp: 6,
    keywords: ['Taunt', 'Divine Shield', 'Deathrattle'],
    description: '도발, 천상의 보호막. 죽음의 메아리: 공격력 5, 내구력 3 성검 [파멸의 인도자]를 영웅 슬롯에 장비합니다.',
    effectId: 'equip_ashbringer'
  },
  {
    id: 'w_frostmourne',
    templateId: 'w_frostmourne',
    name: '서리한 (Frostmourne)',
    cost: 7,
    type: 'weapon',
    rarity: 'legendary',
    atk: 5,
    durability: 3,
    description: '리치 왕의 저주받은 룬 마검입니다. 휘두를 때마다 찬 공기를 뿜습니다.'
  },
  // --- 퀘스트 카드 & 전설 보상 카드 세트 ---
  {
    id: 's_quest_mage',
    templateId: 's_quest_mage',
    name: '신비한 비전 왜곡 (Quest)',
    cost: 1,
    type: 'spell',
    rarity: 'legendary',
    description: '🛡️ [공동 퀘스트] 아호! 주문을 3회 시전하십시오. 보상: 전설 주문 [대마법사의 지혜] 획득!',
    effectId: 'quest_mage'
  },
  {
    id: 's_quest_mage_reward',
    templateId: 's_quest_mage_reward',
    name: '대마법사의 지혜 (Reward)',
    cost: 2,
    type: 'spell',
    rarity: 'legendary',
    description: '🔮 [퀘스트 보상] 내 가용 마나를 가득 채우고, 카드를 4장 뽑으며 체력을 10 치유 복구합니다.',
    effectId: 'quest_mage_reward'
  },
  {
    id: 's_quest_priest',
    templateId: 's_quest_priest',
    name: '깨어난 자들의 사명 (Quest)',
    cost: 1,
    type: 'spell',
    rarity: 'legendary',
    description: '🛡️ [공동 퀘스트] 도발 하수인을 2회 소환하십시오. 보상: 전설 하수인 [희망의 인도자 아마라] 획득!',
    effectId: 'quest_priest'
  },
  {
    id: 'm_quest_priest_reward',
    templateId: 'm_quest_priest_reward',
    name: '희망의 인도자 아마라 (Reward)',
    cost: 4,
    type: 'minion',
    rarity: 'legendary',
    atk: 8,
    hp: 8,
    keywords: ['Taunt', 'Battlecry'],
    description: '도발. 전투의 함성: 아군 영웅의 최대 생명력을 40으로 높이고, 체력을 40으로 풀 회복시킵니다!',
    effectId: 'quest_priest_reward'
  },
  {
    id: 's_quest_paladin',
    templateId: 's_quest_paladin',
    name: '빛의 연합 구축 (Quest)',
    cost: 1,
    type: 'spell',
    rarity: 'legendary',
    description: '🛡️ [공동 퀘스트] 천상의 보호막 하수인을 2회 소환하십시오. 보상: 전설 하수인 [거대 공룡 갈바돈] 획득!',
    effectId: 'quest_paladin'
  },
  {
    id: 'm_quest_paladin_reward',
    templateId: 'm_quest_paladin_reward',
    name: '거대 공룡 갈바돈 (Reward)',
    cost: 5,
    type: 'minion',
    rarity: 'legendary',
    atk: 8,
    hp: 8,
    keywords: ['Taunt', 'Divine Shield', 'Charge'],
    description: '도발, 천상의 보호막, 돌진. 궁극의 포식 공룡입니다.',
    effectId: 'quest_paladin_reward'
  },
  {
    id: 's_quest_hunter',
    templateId: 's_quest_hunter',
    name: '맹수 사냥 준비 (Quest)',
    cost: 1,
    type: 'spell',
    rarity: 'legendary',
    description: '🛡️ [공동 퀘스트] 1코스트 카드를 3회 사용하십시오. 보상: 전설 하수인 [여왕 카르나사] 획득!',
    effectId: 'quest_hunter'
  },
  {
    id: 'm_quest_hunter_reward',
    templateId: 'm_quest_hunter_reward',
    name: '여왕 카르나사 (Reward)',
    cost: 6,
    type: 'minion',
    rarity: 'legendary',
    atk: 8,
    hp: 8,
    keywords: ['Battlecry'],
    description: '전투의 함성: 적 영웅 본체에 즉시 지옥의 가래침을 쏘아 피해를 12 줍니다.',
    effectId: 'quest_hunter_reward'
  },
  {
    id: 's_quest_warrior',
    templateId: 's_quest_warrior',
    name: '방어선 사수 (Quest)',
    cost: 1,
    type: 'spell',
    rarity: 'legendary',
    description: '🛡️ [공동 퀘스트] 공격력 5 이상의 하수인을 2회 소환하십시오. 보상: 전설 무기 [파괴의 불길 설퍼라스] 획득!',
    effectId: 'quest_warrior'
  },
  {
    id: 'w_quest_warrior_reward',
    templateId: 'w_quest_warrior_reward',
    name: '파괴의 불길 설퍼라스 (Reward)',
    cost: 4,
    type: 'weapon',
    rarity: 'legendary',
    atk: 6,
    durability: 3,
    description: '장착 시 즉시 무작위 적(영웅 혹은 하수인)에게 8의 불덩이 대미지를 발사합니다.',
    effectId: 'quest_warrior_reward'
  }
];

// Helper to safely fetch card templates from CARD_POOL by ID
function findCardById(id: string): Card {
  const found = CARD_POOL.find(c => c.id === id);
  if (!found) {
    // Fallback if cards are missing to prevent any runtime exceptions
    return CARD_POOL[0];
  }
  return found;
}

export const PREBUILT_AGGRO_DECK: Card[] = [
  findCardById('m_leper_gnome'), findCardById('m_leper_gnome'), // 오염된 노움 *2
  findCardById('m_goldshire_footman'), findCardById('m_goldshire_footman'), // 골드샤이어 보초병 *2
  findCardById('m_stonetusk_boar'), findCardById('m_stonetusk_boar'), // 돌진하는 멧돼지 *2
  findCardById('m_flametongue_totem'), findCardById('m_flametongue_totem'), // 불꽃의 토템 (신규 토템 추가!) *2
  findCardById('s_arcane_shot'), findCardById('s_arcane_shot'), // 신비한 화살 *2
  findCardById('m_bluegill_warrior'), findCardById('m_bluegill_warrior'), // 푸른지느러미 전사 *2
  findCardById('s_explosive_trap'), findCardById('s_explosive_trap'), // 비밀: 폭발의 덫 (신규 비밀 추가!) *2
  findCardById('m_wolf_companion'), findCardById('m_wolf_companion'), // 야수 무리늑대 *2
  findCardById('m_wolfrider'), findCardById('m_wolfrider'), // 늑대기수 *2
  findCardById('w_fiery_war_axe'), findCardById('w_fiery_war_axe'), // 이글거리는 도끼 *2
  findCardById('s_fireball'), findCardById('s_fireball'), // 화염구 *2
  findCardById('s_bloodlust'), findCardById('s_bloodlust'), // 피의 욕망 *2
  findCardById('s_savage_roar'), findCardById('s_savage_roar'), // 야생의 포효 *2
  findCardById('s_heroic_strike'), findCardById('s_heroic_strike'), // 영웅의 격노격 *2
  findCardById('m_core_hound'), findCardById('m_core_hound'), // 심장부 사냥개 *2
  findCardById('m_abusive_sergeant'), findCardById('m_abusive_sergeant'), // 가혹한 하사관 *2 (신규)
  findCardById('m_dire_wolf_alpha'), findCardById('m_dire_wolf_alpha'), // 광포한 늑대 우두머리 *2 (신규)
  findCardById('m_knife_juggler'), findCardById('m_knife_juggler'), // 단검 곡예사 *2 (신규)
  findCardById('m_loot_hoarder'), findCardById('m_loot_hoarder'), // 전리품 수집가 *2 (드로우 카드, 신규)
  findCardById('m_argent_commander'), findCardById('m_argent_commander') // 은빛십자군 부대장 *2 (신규)
];

export const PREBUILT_MIDRANGE_DECK: Card[] = [
  findCardById('m_elven_archer'), findCardById('m_elven_archer'), // 엘프 궁수 *2
  findCardById('m_argent_squire'), findCardById('m_argent_squire'), // 은빛십자군 종자 *2
  findCardById('m_bloodfen_raptor'), findCardById('m_bloodfen_raptor'), // 민물맹독충 *2
  findCardById('m_acidic_ooze'), findCardById('m_acidic_ooze'), // 산성 늪수렁 괴물 *2
  findCardById('m_novice_engineer'), findCardById('m_novice_engineer'), // 풋내기 기술자 *2
  findCardById('s_frostbolt'), findCardById('s_frostbolt'), // 얼음 화살 *2
  findCardById('m_ironfur_grizzly'), findCardById('m_ironfur_grizzly'), // 무쇠가죽 곰 *2
  findCardById('m_earthen_farseer'), findCardById('m_earthen_farseer'), // 대지 고리 선견자 *2
  findCardById('m_healing_totem'), findCardById('m_healing_totem'), // 치유의 토템 (신규 토템 추가!) *2
  findCardById('s_ice_barrier'), findCardById('s_ice_barrier'), // 비밀: 얼음 화막 (신규 비밀 추가!) *2
  findCardById('m_senjin_shieldmasta'), findCardById('m_senjin_shieldmasta'), // 센진 방패대가 *2
  findCardById('m_chillwind_yeti'), findCardById('m_chillwind_yeti'), // 서리바람 예티 *2
  findCardById('m_spellbreaker'), findCardById('m_spellbreaker'), // 주문파괴자 *2
  findCardById('s_consecration'), findCardById('s_consecration'), // 신성화 *2
  findCardById('m_sludge_belcher'), findCardById('m_sludge_belcher'), // 썩은가죽 벼룩 *2
  findCardById('m_boulderfist_ogre'), findCardById('m_boulderfist_ogre'), // 돌주먹 오우거 *2
  findCardById('m_stormwind_champion'), findCardById('m_stormwind_champion'), // 스톰윈드 용사 *2
  findCardById('m_northshire_cleric'), findCardById('m_northshire_cleric'), // 북녘골 성직자 *2 (드로우 카드, 신규)
  findCardById('m_defender_of_argus'), findCardById('m_defender_of_argus'), // 아르거스의 수호자 *2 (신규)
  findCardById('m_water_elemental'), findCardById('m_water_elemental') // 물의 정령 *2 (신규)
];

export const PREBUILT_CONTROL_DECK: Card[] = [
  findCardById('s_quest_mage'), findCardById('s_quest_priest'), // 전설 퀘스트(마법사/사제) 대전 시험용 추가!
  findCardById('s_shield_buff'), findCardById('s_shield_buff'), // 신의 권능 보호막 *2
  findCardById('s_healing_touch'), findCardById('s_healing_touch'), // 성스러운 빛 *2
  findCardById('m_ironfur_grizzly'), findCardById('m_ironfur_grizzly'), // 무쇠가죽 곰 *2
  findCardById('m_earthen_farseer'), findCardById('m_earthen_farseer'), // 대지 고리 선견자 *2
  findCardById('s_arcane_intellect'), findCardById('s_arcane_intellect'), // 신비한 지능 *2
  findCardById('m_senjin_shieldmasta'), findCardById('m_senjin_shieldmasta'), // 센진 방패대가 *2
  findCardById('m_chillwind_yeti'), findCardById('m_chillwind_yeti'), // 서리바람 예티 *2
  findCardById('m_gnomish_inventor'), findCardById('m_gnomish_inventor'), // 노움 발명가 *2
  findCardById('s_polymorph'), findCardById('s_polymorph'), // 변이 *2
  findCardById('w_truesilver_champion'), findCardById('w_truesilver_champion'), // 진은검 *2
  findCardById('s_assassinate'), findCardById('s_assassinate'), // 암살 *2
  findCardById('s_blizzard'), findCardById('s_blizzard'), // 눈보라 *2
  findCardById('s_flamestrike'), findCardById('s_flamestrike'), // 불기둥 *2
  findCardById('m_jaraxxus'), findCardById('m_jaraxxus'), // 군주 자락서스 (신규 전설 악마) *2
  findCardById('m_tirion_fordring'), findCardById('m_tirion_fordring'), // 티리온 폴드링 (신규 장장) *2
  findCardById('w_frostmourne'), findCardById('w_frostmourne'), // 서리한 (명품 무기 추가) *2
  findCardById('m_acolyte_of_pain'), findCardById('m_acolyte_of_pain'), // 고통의 수행사제 *2 (드로우 카드, 신규)
  findCardById('s_nourish'), findCardById('s_nourish'), // 육성 *2 (드로우 카드, 신규)
  findCardById('m_sylvanas_windrunner'), findCardById('m_sylvanas_windrunner') // 실바나스 윈드러너 *2 (신규)
];
