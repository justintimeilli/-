/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gen AI lazily
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * Endpoint: POST /api/game/draft-suggest
 * Suggests the best card selection among 3 drafted options based on current deck composition
 */
app.post("/api/game/draft-suggest", async (req, res) => {
  const { draftedDeck, choices, round } = req.body;

  const ai = getGenAI();
  if (!ai) {
    // If no API key, return a simple static heuristic recommendation
    const bestIndex = 0; // fallback to first card
    return res.json({
      recommendedIndex: bestIndex,
      reason: "실제 AI 비서 조언 (API 키 필요): 이 카드는 현재 마나 커브 조정에 무난합니다. (로컬 플레이 모드)"
    });
  }

  try {
    const prompt = `
당신은 하스스톤 덱 드래프트 코치이자 게임 마스터입니다. 
플레이어가 3장 중 어떤 카드를 골라야 시너지가 극대화될지 논리적으로 조언해 주세요.

현재 드래프트 라운드: ${round} / 30
이미 뽑은 덱 목록: ${JSON.stringify(draftedDeck.map((c: any) => ({ name: c.name, cost: c.cost, type: c.type })))}
현재 제시된 3개 카드 선택지:
1. ${choices[0]?.name} (비용: ${choices[0]?.cost}, 타입: ${choices[0]?.type}, 설명: ${choices[0]?.description})
2. ${choices[1]?.name} (비용: ${choices[1]?.cost}, 타입: ${choices[1]?.type}, 설명: ${choices[1]?.description})
3. ${choices[2]?.name} (비용: ${choices[2]?.cost}, 타입: ${choices[2]?.type}, 설명: ${choices[2]?.description})

출력은 반드시 한국어로 작성하며, 플레이어에게 친밀함과 전술적 분석력을 제공해야 합니다.
반드시 아래 JSON 형태로 응답하십시오.
{
  "recommendedIndex": 0, // 권장하는 카드의 인덱스 (0, 1, 2 중 하나)
  "reason": "분석 결과 설명글"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["recommendedIndex", "reason"],
          properties: {
            recommendedIndex: {
              type: Type.INTEGER,
              description: "0-based index of the recommended card (0, 1, or 2)."
            },
            reason: {
              type: Type.STRING,
              description: "Tactical reason in Korean detailing why this card is perfect for the deck."
            }
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    } else {
      throw new Error("No response text");
    }
  } catch (error: any) {
    console.error("Draft Suggestion Gemini Error:", error);
    res.json({
      recommendedIndex: 0,
      reason: "이 카드는 공수 균형이 뛰어나 덱의 빈 마나 구간을 채우기에 좋습니다."
    });
  }
});

/**
 * Endpoint: POST /api/game/ai-play
 * Main AI Decision Endpoint that uses current game state to decide AI's turn actions and generate commentary.
 */
app.post("/api/game/ai-play", async (req, res) => {
  const { playerState, aiState, turnCount } = req.body;

  const ai = getGenAI();
  if (!ai) {
    // If no API key, return offline warning so frontend does a client-side rule computation
    return res.json({
      useLocalFallback: true,
      commentary: "하하! 나의 지혜가 담긴 턴을 보아라! (로컬 AI 연산 모드)"
    });
  }

  try {
    const prompt = `
당신은 하스스톤 전설 랭크의 프로게이머 수준 지능을 지닌 베테랑 대결자이자 게임 마스터(GM)입니다.
현재 전장 현황 정보를 바탕으로, AI 플레이어로서 이번 턴에 행동할 가장 예리하고 영리한 행동들의 시퀀스(액션 리스트)를 생성하고,
이를 해학적이고 한국 하스스톤 캐스터 특유의 생동감 넘치는 어조로 중계 해설(한국어)을 해 주십시오.

[하스스톤 핵심 전투 규칙 & 프로레벨 전략 전술]
1. 마나 템포 (Tempo Max): 턴 한도 내의 마나(${aiState.mana})를 최대한 전부 알차게 털어 사용하는 카드 조합을 최우선으로 매칭하십시오. 코스트가 높고 강력한 하수인을 필드에 먼저 안착시키는 것이 필드 힘 싸움에 매우 유리합니다.
2. 치명적인 킬각 (Lethal Check): 현재 필드 전체 하수인의 공격력 총합 + 내 영웅 무기 공격력 + 손패의 피해 주문/하수인 피해를 더한 값이 적 영웅의 체력(${playerState.hp}) 이상이고, 도발 하수인이 전장에 없는 상태라면 절대 하수인 교환을 하지 말고 모든 화력을 오직 'player_hero' (적 영웅의 명치)로 집중하여 즉시 게임을 완전 승리로 종결하십시오!
3. 도발 최우선 제거 (Taunt Breaking): 상대 전장에 '도발(Taunt)' 키워드를 지닌 하수인이 있다면, 그 도발을 먼저 처치하지 않고서는 다른 유닛이나 영웅 명치를 일반 직접 타격할 수 없습니다. 도발 유닛의 생명력을 정확히 깎을 수 있게 작은 하수인이나 전투의 함성 데미지 카드를 영리하게 투입하여 제거하여 우회 길을 확보하십시오.
4. 효율적인 필드 교환 (Favorable Trading): 도발이 전장에 없고 킬각이 나지 않을 경우, 무자비한 명치 타격 대신 이득 교환을 노리십시오. 즉, '우리 하수인은 생존하고 상대 하수인은 확실히 단번에 죽는 교환'이나, 혹은 '우리의 하찮은 1/1 하수인으로 상대의 강력한 위협 카드(예: 공격력 4 이상, 체력 1)'와 동귀어진하는 교환을 계산하여 명령을 넣으십시오.
5. 전투의 함성 지망 저격: '엘프 궁수'나 주문 등 피해를 입힐 수 있는 타격 효과는 적 전장의 까다롭고 위험한 유닛을 단번에 끊는 정량 지목을 해야 합니다.

- AI는 소지한 마나 내에서만 행동해야 합니다. (현재 AI 마나: ${aiState.mana})
- 돌진(Charge) 키워드가 없는 하수인은 소환된 즉시 공격할 수 없습니다(isAsleep이 true임).
- 수면 상태(isAsleep: false)이고 공격하지 않은(hasAttackedThisTurn: false) 하수인만 공격할 수 있습니다.
- 상대방 필드에 '도발(Taunt)' 키워드를 가진 하수인이 하나라도 있다면, 다른 하수인이나 적 영웅을 수동으로 일반 타격할 수 없습니다. 무조건 도발 하수인을 먼저 공격하여 소멸시키거나 우회해야 합니다.
- 영웅의 무기가 장착되어 있는 상태에서 공격 가능 횟수가 있다면 영웅으로도 공격을 수행할 수 있습니다 (소비 마나 없음, 턴당 1회 최대).
- 영웅 능력 (Hero Power): 만약 영웅 능력 사용 상태(usedHeroPower가 false이고 남은 마나 2 이상)인 경우, 영웅 능력("type": "HERO_POWER")을 턴당 최대 한 번 시전하여 전장을 소환/피해/치유시킵니다. 직업별 영능: 마법사(Mage: 대상 1뎀), 사제(Priest: 대상 2힐), 성기사(Paladin: 1/1 신병소환), 사냥꾼(Hunter: 적영웅 2뎀), 전사(Warrior: 방어도 +2 수대).

[현재 전장 상황]
---------------------------
★ [내 상태 (AI 상대방)] HP: ${aiState.hp}/${aiState.maxHp} | 마나: ${aiState.mana}/${aiState.maxMana}
- 마구 장착된 내 무기: ${aiState.weapon ? `${aiState.weapon.name} (Atk: ${aiState.weapon.atk}, 내구도: ${aiState.weapon.durability})` : "없음"}
- 내 패 (AI 보유 카드들):
${JSON.stringify(aiState.hand.map((c: any, i: number) => ({ index: i, templateId: c.templateId, name: c.name, cost: c.cost, type: c.type, atk: c.atk, hp: c.hp, keywords: c.keywords, description: c.description })))}
- 내 전장 하수인들 (공격력/필드 체력/수면여부/공격여부):
${JSON.stringify(aiState.board.map((m: any) => ({ id: m.id, name: m.name, atk: m.atk, hp: m.currentHp, isAsleep: m.isAsleep, hasAttackedThisTurn: m.hasAttackedThisTurn, keywords: m.keywords })))}

---------------------------
★ [적의 상태 (인간 플레이어)] HP: ${playerState.hp}/${playerState.maxHp} | 패 개수: ${playerState.hand.length}장
- 장착된 적의 무기: ${playerState.weapon ? `${playerState.weapon.name} (Atk: ${playerState.weapon.atk}, 내구도: ${playerState.weapon.durability})` : "없음"}
- 적전장 하수인들 (공격력/필드 체력/도발유무):
${JSON.stringify(playerState.board.map((m: any) => ({ id: m.id, name: m.name, atk: m.atk, hp: m.currentHp, keywords: m.keywords })))}

---------------------------
제출할 액션 리스트의 종류:
1. { "type": "PLAY_CARD", "cardHandIndex": N, "cardTemplateId": "CARD_TEMPLATE_ID", "targetId": "TARGET_ID" }
   - 카드를 냅니다. cardHandIndex는 내 패의 0-based 위치입니다. cardTemplateId는 내 패 카드 내의 "templateId" 값입니다.
   - 전투의 함성(Battlecry) 또는 주문(Spell)의 처리가 필요한 경우 대상을 지정합니다. 대상은 적 하수인의 "id", 내 하수인의 "id", 또는 "player_hero" (인간 플레이어 영웅), "ai_hero" (나) 중 하나입니다. 대상 지목이 없거나 필요없을 시 "none"으로 입력합니다.
2. { "type": "ATTACK", "attackerMinionId": "내하수인_id", "targetId": "적하수인_id 또는 player_hero" }
   - 사용가능한 내 하수인으로 대상을 공격합니다. 적의 "도발(Taunt)" 하수인이 있다면 무조건 해당 도발 대상을 선타 격파하는 액션을 앞세워야 합니다!
3. { "type": "HERO_ATTACK", "targetId": "적하수인_id 또는 player_hero" }
   - 만약 내 영웅이 무기를 갖고 있고 아직 이번 턴 공격하지 않았다면 직접 적을 후려칩니다. 도발 규칙 적용됩니다.
4. { "type": "HERO_POWER", "targetId": "지정대상_id 또는 none" }
   - 소비마나 2로 내 클래스 고유 영능을 발동합니다. 성기사(Paladin)/사냥꾼(Hunter)/전사(Warrior)는 targetId가 필요없으므로 "none"을 제공하고, 마법사(Mage)/사제(Priest)는 대상 하수인 ID 또는 "player_hero" / "ai_hero" 명치를 targetId로 제공하십시오.

필요 계산이 모두 이루어지면, 최종 JSON 데이터 구조로 반환하십시오.
{
  "commentary": "하스스톤 전설 캐스터나 여관주인처럼 엄청나게 텐션 높은 해설로, AI의 이번 수와 필드 밸류 및 대격돌 상황을 실감나게 한국어로 중계하는 대사 (최대 300자, 존댓말/반말 혼용 가능 하나 흥미로워야 함)",
  "actions": [
    // 액션들이 순서대로 이곳에 배치됩니다. 턴 종료 액션은 자동으로 마지막에 처리받으니 배열에 보낼 필요 없습니다.
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["commentary", "actions"],
          properties: {
            commentary: {
              type: Type.STRING,
              description: "Dramatic gameplay commentary in Korean like a pro caster or Hearthstone innkeeper."
            },
            actions: {
              type: Type.ARRAY,
              description: "The sequence of actions to take.",
              items: {
                type: Type.OBJECT,
                required: ["type"],
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Action type: PLAY_CARD, ATTACK, HERO_ATTACK, or HERO_POWER"
                  },
                  cardHandIndex: {
                    type: Type.INTEGER,
                    description: "Hand index of the card to play. Used if type is PLAY_CARD."
                  },
                  cardTemplateId: {
                    type: Type.STRING,
                    description: "The template ID of the card being played. e.g., 'elven_archer'. Used if type is PLAY_CARD."
                  },
                  attackerMinionId: {
                    type: Type.STRING,
                    description: "ID of the AI board minion. Used if type is ATTACK."
                  },
                  targetId: {
                    type: Type.STRING,
                    description: "ID of target minion, player_hero, or ai_hero. Enter 'none' if no target required."
                  }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    } else {
      throw new Error("Empty text responses");
    }
  } catch (error: any) {
    console.error("AI turn generation Gemini Error:", error);
    res.json({
      useLocalFallback: true,
      commentary: "으하하! 내 필드의 압도적인 전사들의 매서운 공격을 받아라!"
    });
  }
});

// Configure Vite in development, static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA direct access wildcard
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Hearthstone Server] Web application is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
