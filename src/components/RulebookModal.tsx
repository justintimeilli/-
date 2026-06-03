import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Shield, Disc, Zap, Heart, Flame, Sparkles, 
  Sword, Skull, ShieldCheck, Award, Info, RefreshCw, Layers 
} from 'lucide-react';

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'system' | 'keywords' | 'cards' | 'tactics';

export function RulebookModal({ isOpen, onClose }: RulebookModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('system');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020204]/90 backdrop-blur-md"
        />

        {/* Modal body container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative max-w-4xl w-full h-[85vh] bg-[#0b0c11] border-2 border-[#b45309]/50 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden text-slate-200 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#171109] via-[#0b0c11] to-[#0e161f] border-b border-[#2e2111]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  대여관 대전 규칙서 <span className="text-xs font-normal text-slate-400 bg-[#1e1f26] px-2 py-0.5 rounded border border-[#2d2e3b]">Tavern Codex</span>
                </h2>
                <p className="text-[11px] text-slate-400">대전의 승리 조건, 핵심 하수인 키워드 및 대여관의 실전 전법 요약</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#181921] hover:bg-[#2e2025] border border-[#2d2e3b] hover:border-red-900/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="flex border-b border-[#1b1c23] bg-[#0f1016]/90 p-2 overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 text-xs py-2 px-4 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === 'system'
                  ? 'bg-[#291e13] text-amber-400 border border-[#b45309]/30 shadow-[inset_0_1px_5px_rgba(245,158,11,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#15161f]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              📜 기본 게임 규칙
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`flex items-center gap-2 text-xs py-2 px-4 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === 'keywords'
                  ? 'bg-[#291e13] text-amber-400 border border-[#b45309]/30 shadow-[inset_0_1px_5px_rgba(245,158,11,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#15161f]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              ⚡ 특수 키워드 백과
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-2 text-xs py-2 px-4 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === 'cards'
                  ? 'bg-[#291e13] text-amber-400 border border-[#b45309]/30 shadow-[inset_0_1px_5px_rgba(245,158,11,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#15161f]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              🃏 주요 카드 명장집
            </button>
            <button
              onClick={() => setActiveTab('tactics')}
              className={`flex items-center gap-2 text-xs py-2 px-4 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === 'tactics'
                  ? 'bg-[#291e13] text-amber-400 border border-[#b45309]/30 shadow-[inset_0_1px_5px_rgba(245,158,11,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#15161f]'
              }`}
            >
              <Sword className="w-3.5 h-3.5 text-amber-500" />
              🧠 프로급 대전 바이블
            </button>
          </div>

          {/* Tab Contents Frame */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#07080b]/95 space-y-6">
            {activeTab === 'system' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Visual Banner */}
                <div className="bg-gradient-to-r from-amber-600/10 to-transparent p-5 rounded-xl border border-amber-500/10 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">마나와 생명력, 그리고 카드 템포의 전설</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      하스스톤 대여관 시뮬레이터는 정통 1대1 선술집 카드 배틀 게임의 규칙을 충실히 구현한 실전 테이블 대전 기입니다. 
                      각 영웅은 생명력 30을 가지며, 상대방의 피를 0이하로 만드는 승부사가 대승리를 쟁취합니다.
                    </p>
                  </div>
                </div>

                {/* Sub-sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rule 1: Turn & Mana */}
                  <div className="bg-[#12131a] p-5 rounded-xl border border-[#21222e]/60 space-y-3">
                    <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-amber-500" />
                      마나 크리스탈 & 턴 규칙
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      매 턴이 시작될 때마다 사용할 수 있는 활성 마나가 충전됩니다. 
                      마나 크리스탈의 도달 한도는 최대 10이며, 강력한 하수인을 소환하거나 주문을 사용하려면 카드에 표시된 파란색 숫자만큼 마나가 소비됩니다. <span className="text-blue-400">남은 마나는 내 턴이 끝나면 자동 소멸</span>하며 다음 턴에 다시 충전됩니다.
                    </p>
                  </div>

                  {/* Rule 2: Hand & Mulligan */}
                  <div className="bg-[#12131a] p-5 rounded-xl border border-[#21222e]/60 space-y-3">
                    <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                      <RefreshCw className="w-4 h-4 text-emerald-400" />
                      멀리건 & 드로우 시스템
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      게임 시작 전 첫 손패 4장을 펼쳐 갖기 싫은 카드를 마음껏 버리고 대체 카드로 섞는 '멀리건 의식'을 치릅니다. 
                      또한 선공 영웅은 손패 4장으로 시작하고 후공 영웅은 전투의 템포를 맞추기 위해 <span className="text-amber-400 font-semibold">"동전 한 닢" (0코스트 1마나 임시 획득)</span> 카드를 특별 추가로 지급받아 불리함을 메꿉니다.
                    </p>
                  </div>

                  {/* Rule 3: Sleep Mechanics */}
                  <div className="bg-[#12131a] p-5 rounded-xl border border-[#21222e]/60 space-y-3">
                    <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                      <Flame className="w-4 h-4 text-red-500" />
                      하수인 공격 배틀
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      필드로 출격한 모든 하수인은 소환된 첫 턴에 깊은 <span className="text-[#93c5fd]">"소환 후유증(Sleep / 잠듦)"</span> 상태가 되며 다음 아군 턴이 오기 전까지는 공격할 수 없습니다. 
                      예외적으로 <strong>돌진(Charge)</strong> 키워드를 장착한 발빠른 돌격대들만이 출격 즉시 즉각적인 격파를 자행하게 됩니다.
                    </p>
                  </div>

                  {/* Rule 4: Fatigue damage */}
                  <div className="bg-[#12131a] p-5 rounded-xl border border-[#21222e]/60 space-y-3">
                    <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                      <Skull className="w-4 h-4 text-[#8b5cf6]" />
                      덱 고갈과 '탈진 (Fatigue)' 규칙
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      내 고유한 덱의 카드가 단 한 장도 없는 상태에서 카드 드로우를 시도할 경우, 신비로운 벌칙인 <strong>'탈진 광역 피해'</strong>를 입히게 됩니다. 
                      첫 탈진에는 1의 생명력을 잃고, 드로우 시도가 겹칠 때마다 상시 피해 수치가 <span className="text-rose-400">1씩 점진적으로 가중</span>되어 치명적인 패배에 이릅니다.
                    </p>
                  </div>
                </div>

                {/* Instant Victory Rule Reminder */}
                <div className="bg-[#240a10]/80 p-4 rounded-lg border border-red-900/30 text-rose-300 flex items-center gap-3">
                  <Info className="w-5 h-5 opacity-80" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>[즉시 종료 검출]</strong> 상대방 영웅의 피(HP) 혹은 우리의 수호 영웅의 체력이 0 이하가 되는 극적인 순간, 어떠한 대기 턴 전환이나 렉 없이 전투 연산기 단계에서 <strong>그 즉시 대결이 종결</strong>되며 완벽한 승패가 현장에서 기록됩니다.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'keywords' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-slate-100 font-bold mb-2 text-sm">전장의 국면을 바꾸는 핵심 효과 도감</h3>
                
                {/* Keyword List */}
                <div className="space-y-3">
                  
                  {/* Taunt */}
                  <div className="flex flex-col md:flex-row bg-[#111219] p-4 rounded-xl border border-[#21222e]/80 gap-3 md:gap-5">
                    <div className="md:w-44 flex items-center gap-2 bg-[#2d1b09] px-3 py-1.5 rounded-lg border border-amber-600/20 text-amber-400 h-fit self-start">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-xs font-sans">도발 (Taunt)</span>
                    </div>
                    <div className="flex-1 text-xs text-slate-300 space-y-1">
                      <p className="text-amber-100 font-medium">전우들을 지켜내는 성스러운 방패의 벽</p>
                      <p className="leading-relaxed">
                        이 키워드를 가진 하수인이 아군 필드에 한 마리라도 포진되어 있으면, 적 하수인이든 상대 영웅이든 관계없이 <span className="text-rose-300 font-semibold">절대 다른 다른 대상이나 아군 영웅의 명치를 공격할 수 없습니다.</span> 
                        적들은 의무적으로 전장에 살아있는 도발 하수인을 먼저 격파해야 합니다. (단, 무작위 피해를 주는 탄막이나 표적 주문 폭격 등은 도발의 우회가 가능합니다.)
                      </p>
                    </div>
                  </div>

                  {/* Battlecry */}
                  <div className="flex flex-col md:flex-row bg-[#111219] p-4 rounded-xl border border-[#21222e]/80 gap-3 md:gap-5">
                    <div className="md:w-44 flex items-center gap-2 bg-[#09221a] px-3 py-1.5 rounded-lg border border-emerald-600/20 text-emerald-400 h-fit self-start">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs font-sans">전전우의 함성 (Battlecry)</span>
                    </div>
                    <div className="flex-1 text-xs text-slate-300 space-y-1">
                      <p className="text-emerald-100 font-medium">손패에서 필드로 내려앉는 위엄찬 포효</p>
                      <p className="leading-relaxed">
                        카드를 손패에서 빈 전장 필드 위로 소환할 때 <span className="text-emerald-400 font-semibold">그 즉시 발동하는 맹렬한 고유 능력</span>입니다. 
                        예컨대 '엘프 궁수' 카드는 소환되자마자 전장의 약체 대상을 정밀 저격해 데미지를 입히거나, 은빛십자군 치유사는 아군 영웅을 치유하는 등 가차 없는 단발 전술적 개입을 행합니다.
                      </p>
                    </div>
                  </div>

                  {/* Deathrattle */}
                  <div className="flex flex-col md:flex-row bg-[#111219] p-4 rounded-xl border border-[#21222e]/80 gap-3 md:gap-5">
                    <div className="md:w-44 flex items-center gap-2 bg-[#221021] px-3 py-1.5 rounded-lg border border-fuchsia-600/20 text-fuchsia-300 h-fit self-start">
                      <Skull className="w-4 h-4 text-fuchsia-400" />
                      <span className="font-bold text-xs font-sans">죽음의 메아리 (Deathrattle)</span>
                    </div>
                    <div className="flex-1 text-xs text-slate-300 space-y-1">
                      <p className="text-fuchsia-100 font-medium">쓰러지는 마지막 찰나에 울부짖는 영혼의 유언</p>
                      <p className="leading-relaxed">
                        해당 하수인이 적들의 맹공이나 전장 마법으로 인해 파괴되어 <span className="text-fuchsia-300 font-semibold">묘지로 퇴장하는 죽음의 영면 순간에 격발되는 특수 마법</span>입니다. 
                        오염된 노움을 적이 억지로 뚫어 죽이는 순간에 상대 영웅의 가슴팍에 즉각 2코스트 치명타 메아리를 갈기게 되는 독보적인 보복 수단입니다.
                      </p>
                    </div>
                  </div>

                  {/* Charge */}
                  <div className="flex flex-col md:flex-row bg-[#111219] p-4 rounded-xl border border-[#21222e]/80 gap-3 md:gap-5">
                    <div className="md:w-44 flex items-center gap-2 bg-[#2d1111] px-3 py-1.5 rounded-lg border border-rose-600/20 text-rose-400 h-fit self-start">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <span className="font-bold text-xs font-sans">돌진 (Charge)</span>
                    </div>
                    <div className="flex-1 text-xs text-slate-300 space-y-1">
                      <p className="text-rose-100 font-medium">전장 소환의 수면 후유증을 파괴하는 번광</p>
                      <p className="leading-relaxed">
                        보통의 하수인은 한 차례 턴 잠재적 숙면을 요구하지만, 돌진 자들은 <span className="text-rose-400 font-semibold">소환된 즉시 광속으로 타격을 전개</span>할 수 있습니다. 
                        적의 강력한 고밸류 어태커가 마땅한 방비를 마치기 전 번개처럼 파고들어 응징하거나 킬각 폭발을 일으키는 무시무시한 기포입니다.
                      </p>
                    </div>
                  </div>

                  {/* Divine Shield */}
                  <div className="flex flex-col md:flex-row bg-[#111219] p-4 rounded-xl border border-[#21222e]/80 gap-3 md:gap-5">
                    <div className="md:w-44 flex items-center gap-2 bg-[#1d2636] px-3 py-1.5 rounded-lg border border-blue-600/20 text-blue-400 h-fit self-start">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-xs font-sans">천상보호막 (Divine Shield)</span>
                    </div>
                    <div className="flex-1 text-xs text-slate-300 space-y-1">
                      <p className="text-blue-100 font-medium">어떠한 무자비한 붕괴 대전도 1회 감쇄하는 성막</p>
                      <p className="leading-relaxed">
                        적의 무기나 거대한 전설 급 하수인의 살벌한 일격, 지옥 마법의 엄청난 피해가 들어오더라도 <span className="text-sky-300 font-semibold">단 한 차례 완전히 피해 도를 "0"으로 지워버리는 보호막</span>입니다. 
                        황금 보호막이 한 번 깨진 후에는 일반 무장 병렬 체력 연산을 다시 시작합니다.
                      </p>
                    </div>
                  </div>

                  {/* Windfury */}
                  <div className="flex flex-col md:flex-row bg-[#111219] p-4 rounded-xl border border-[#21222e]/80 gap-3 md:gap-5">
                    <div className="md:w-44 flex items-center gap-2 bg-[#2d0f2b] px-3 py-1.5 rounded-lg border border-violet-600/20 text-violet-400 h-fit self-start">
                      <Disc className="w-4 h-4 text-violet-400" />
                      <span className="font-bold text-xs font-sans">질풍 (Windfury)</span>
                    </div>
                    <div className="flex-1 text-xs text-slate-300 space-y-1">
                      <p className="text-violet-100 font-medium">한 턴에 소나기처럼 몰아치는 폭풍 2배 연타</p>
                      <p className="leading-relaxed">
                        일반 하수인이 자신의 턴에 단 1번만 격타할 수 있는 물리적 구조를 완전히 탈피하여, 단 한 턴에 <span className="text-violet-400 font-semibold">두 차례 연이어 연속 타격</span>을 실행하는 광풍의 제왕입니다. 
                        이 하수인에게 성스러운 축복 공격력 버프를 얹을 경우 일점사 두뇌 붕괴 데미지가 배가됩니다.
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {activeTab === 'cards' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-slate-100 font-bold text-sm">대여관 시뮬레이터 주요 핵심 카드 해설첩</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: Elven Archer */}
                  <div className="bg-[#111219] p-5 rounded-xl border border-amber-600/10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">엘프 궁수 (Archer)</span>
                        <span className="text-xs text-slate-400 font-mono">1 마나 | 1/1</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        도발이 가로막고 있어 도저히 영웅 혹은 핵심 대상을 찍을 수 없을 때, 손패서 빈 전장에 안착시키며 <strong>전투의 함성 1피해 지정</strong> 사격으로 상대 실체 체력을 영리하게 저격해 끊어내는 미학의 첨병입니다.
                      </p>
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-mono">#Battlecry #TargetDamage #Tempo</span>
                  </div>

                  {/* Card 2: Leper Gnome */}
                  <div className="bg-[#111219] p-5 rounded-xl border border-amber-600/10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-0.5 rounded border border-fuchsia-500/20">오염된 노움 (Gnome)</span>
                        <span className="text-xs text-slate-400 font-mono">1 마나 | 2/1</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        초반 템포 공격력이 2나 되는 강도 높은 일체 유닛입니다. 상대방이 이 녀석을 성가셔하여 무참하게 짓밟아 무덤으로 밀어내는 순간, 어김없이 <strong>상대 영웅 명치에 2 피해</strong>가 강제 가산되는 완벽한 자학적 카운터 유닛입니다.
                      </p>
                    </div>
                    <span className="text-[10px] text-fuchsia-400/80 font-mono">#Deathrattle #AggroLethal</span>
                  </div>

                  {/* Card 3: Ironbeak Owl */}
                  <div className="bg-[#111219] p-5 rounded-xl border border-amber-600/10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">무쇠부리 올빼미 (Owl)</span>
                        <span className="text-xs text-slate-400 font-mono">3 마나 | 2/1</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        적의 까다로운 <strong>도발 벽, 고배율 천상의 보호막, 버프 장착 상태를 완벽하게 침묵(Silence)</strong>시켜 순수한 기본 미장 스펙으로 돌려버리는 필살 정지 요원입니다. 상대의 수호 장벽이 거대할 때 이 녀석 하나면 킬각 탄도가 열립니다.
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 font-mono">#Battlecry #Silence #TauntPiercer</span>
                  </div>

                  {/* Card 4: Deathwing */}
                  <div className="bg-[#111219] p-5 rounded-xl border border-amber-600/10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20">귀환자 데스윙 (Deathwing)</span>
                        <span className="text-xs text-slate-400 font-mono">10 마나 | 12/12</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        최고의 고코스트 절대 위엄의 용 군주입니다. 소환하는 비용은 무려 10마나 이지만, 전가하는 <strong>전투의 함성 효과로 내 전장의 적 하수인을 완전히 멸살</strong>해 파괴하는 압도적 재앙급 피날레 파괴력 세례를 내립니다!
                      </p>
                    </div>
                    <span className="text-[10px] text-red-500/80 font-mono">#GrandDestroyer #LegendaryPower</span>
                  </div>

                </div>
              </motion.div>
            )}

            {activeTab === 'tactics' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#12131a] p-6 rounded-xl border border-[#21222e] space-y-4">
                  <h3 className="text-slate-100 font-bold text-sm flex items-center gap-2">
                    <Sword className="w-5 h-5 text-amber-500" />
                    대여관의 명예로운 승률을 높이는 4가지 전략 수칙 (Tactics)
                  </h3>

                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                    
                    {/* Advice 1 */}
                    <div className="flex gap-3 pl-2 border-l-2 border-amber-500">
                      <div>
                        <span className="font-bold text-amber-400 block mb-1">1. 정교한 킬각 예측 (The Mathematics of Fatal Blow)</span>
                        <span>
                          매 턴 시작 전 내 전장의 하수인 마리 수와 공격력 총합을 더하고, 손에 쥐인 공격 주문 데미지 및 장착된 무기 데미지를 순식간에 암산하십시오. 
                          상대 영웅 체력과 비교하여 "돌진 하수인 소환 + 명치 타격"으로 확실히 끝낼 수 있다면, <strong>상대의 거대한 도발이나 몬스터들을 절대 치지 말고 오직 상대 명치(player_hero)만을 후려치십시오!</strong> 
                          우물머뭇하며 무익하게 카드를 교환하다 전술적 골든 타임을 놓치는 것이 실력 부진의 가장 큰 이유입니다.
                        </span>
                      </div>
                    </div>

                    {/* Advice 2 */}
                    <div className="flex gap-3 pl-2 border-l-2 border-emerald-500">
                      <div>
                        <span className="font-bold text-emerald-400 block mb-1">2. 이득 필드 교환비 설계 (Value Trading Ratio)</span>
                        <span>
                          킬각이나 완전한 명치 공습 기회가 아니며 전필드가 장기전 페이즈로 흐를 때에는 '무조건 명치' 대신 '이득 교환'을 해야 합니다. 
                          내 하수인이 살고 상대 하수인은 확실히 무덤으로 사장되는 일점사가 가능하거나, 내 1체력짜리 병약 졸개 하수인으로 상대의 7공격력 핵심 저격수를 같이 폭파해 버릴 수 있다면 그 공격 표적으로 고정해 파괴하십시오. 
                          내 고밸류 하수인을 보존하는 것이 전장을 틀어쥐는 왕도입니다.
                        </span>
                      </div>
                    </div>

                    {/* Advice 3 */}
                    <div className="flex gap-3 pl-2 border-l-2 border-blue-500">
                      <div>
                        <span className="font-bold text-blue-400 block mb-1">3. 동전 한 닢(The Coin) 개방의 정석</span>
                        <span>
                          0코스트 임시 마나 소지는 소지하고만 있어도 적의 두뇌를 뒤흔듧니다. 
                          동전 한 닢은 절대 아무 때나 낭비해 버리지 마시고, <span className="text-sky-300">내 손안에 현 턴 마나보다 한 등급 위인 압도적 성능의 고밸류 하수인이 준비되었을 때</span>, 패스트 템포로 마나 한도를 뛰어넘어 필드를 초장에 강박 압사시키는 용도로 투척하십시오.
                        </span>
                      </div>
                    </div>

                    {/* Advice 4 */}
                    <div className="flex gap-3 pl-2 border-l-2 border-rose-500">
                      <div>
                        <span className="font-bold text-rose-400 block mb-1">4. 무자비한 탈진(Fatigue) 유도</span>
                        <span>
                          플레이어가 극장식 완벽 방어로 승부하는 콘트롤 덱을 쥐었다면, 드로우를 과도하게 당기는 욕심을 부리다가는 상대보다 먼저 탈진 지옥에 안착할 수 있습니다. 
                          드로우를 억제하여 덱 수량을 풍부히 유지하고 버티기 기술로 눕히면, 상대가 드로우를 더 이상 취하지도 못하고 턴마다 1, 2, 3...의 영혼 손실 자멸 데미지를 입는 탈진 승의 참 교육을 이행할 수 있습니다.
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer controls */}
          <div className="px-6 py-4 bg-[#0d0e14] border-t border-[#1b1c23] flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              대여관 전용 샌드박스 대전 시뮬레이터 v1.22 • Hearthstone Sandbox Edition
            </span>
            <button
              onClick={onClose}
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold py-2 px-6 rounded-lg border border-amber-500/20 shadow-[0_2px_10px_rgba(217,119,6,0.15)] transition duration-150"
            >
              전장으로 돌아가기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
