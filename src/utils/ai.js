const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
export const AI_KEY_STORAGE = 'occubase_ai_key'

export function getApiKey() {
  return localStorage.getItem(AI_KEY_STORAGE) || ''
}

export async function parseDiseases(freeText, apiKey, diseases) {
  const variantList = diseases
    .flatMap(d => d.variants.map(v => `${v.id}: ${d.name} — ${v.label}`))
    .join('\n')

  const prompt = `Sen bir iş yeri hekimliği asistanısın. Aşağıda bir çalışanın hastalık/durum listesi serbest metin olarak verilmiştir.
Sana mevcut hastalık varyant listesi verilmiştir. Metinden hastalıkları tanımla, en uygun varyant ID'lerini seç.

SADECE JSON döndür, açıklama yapma. Format:
{"variants": ["ID1", "ID2"], "unmatched": ["eşleşmeyen hastalık 1"]}

Mevcut varyantlar:
${variantList}

Değerlendirilecek metin:
${freeText}`

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API hatası: ${res.status}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Yapay zekadan geçersiz yanıt alındı.')
  return JSON.parse(match[0])
}
