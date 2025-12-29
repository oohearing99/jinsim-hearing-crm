
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Normalizes user-entered test data into a structured JSON record.
 * Following 'Jinsim Hearing Center' business rules.
 */
export async function normalizeTestData(input: string) {
  // Use named parameter and direct process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
당신은 ‘진심보청기’ 센터의 청능검사 전산화 어시스턴트입니다.
목표는 상담사(사용자)가 입력한 내용을 아래 규칙에 맞는 “DB 저장용 JSON”으로 정규화하는 것입니다.

[핵심 규칙]
1) 절대 추측/보완하지 마세요. 입력에 없는 값은 null 또는 필드 생략으로 처리합니다.
2) 단위/형식을 표준화합니다.
   - 날짜: YYYY-MM-DD
   - dB: 정수(기본 -10~120 범위)
   - 주파수 키: "125","250","500","1000","2000","4000","8000"(문자열 키)
3) 값 검증:
   - 범위를 벗어나면 validation_errors에 기록합니다.
   - required 필드 누락 시 missing_fields에 기록합니다.
4) 출력은 오직 JSON만 반환합니다(설명 문장 금지).
5) 개인정보는 필요한 최소만 포함합니다(이름/연락처 등). 불필요한 민감정보는 출력하지 않습니다.

[필수 필드(required)]
- brand_id
- center_id
- counselor_name
- visit.visit_date
- customer.name 또는 customer.phone (둘 중 하나는 반드시)
- visit.visit_id, customer.customer_id는 없으면 null로 두고, 생성은 외부 시스템에서 수행한다고 가정합니다.

[출력 JSON 구조]
- data: 정규화된 레코드
- missing_fields: 누락된 필수 필드 목록
- validation_errors: 형식/범위 오류 목록
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: input,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            data: {
              type: Type.OBJECT,
              properties: {
                brand_id: { type: Type.STRING },
                center_id: { type: Type.STRING },
                counselor_name: { type: Type.STRING },
                visit: {
                  type: Type.OBJECT,
                  properties: {
                    visit_id: { type: Type.STRING },
                    visit_date: { type: Type.STRING },
                    purpose: { type: Type.ARRAY, items: { type: Type.STRING } },
                    memo: { type: Type.STRING }
                  }
                },
                customer: {
                  type: Type.OBJECT,
                  properties: {
                    customer_id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    gender: { type: Type.STRING },
                    birth_date: { type: Type.STRING }
                  }
                },
                pure_tone: {
                  type: Type.OBJECT,
                  description: "Audiometric results by frequency",
                  properties: {
                    "125": { type: Type.NUMBER },
                    "250": { type: Type.NUMBER },
                    "500": { type: Type.NUMBER },
                    "1000": { type: Type.NUMBER },
                    "2000": { type: Type.NUMBER },
                    "4000": { type: Type.NUMBER },
                    "8000": { type: Type.NUMBER }
                  }
                }
              }
            },
            missing_fields: { type: Type.ARRAY, items: { type: Type.STRING } },
            validation_errors: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    // Access the .text property directly (not a method call).
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("AI Normalization Error:", error);
    return null;
  }
}
