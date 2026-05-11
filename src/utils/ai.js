const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const AI_KEY_STORAGE = 'occubase_ai_key'

export function getApiKey() {
  // Vercel env var (baked at build time) → localStorage fallback for dev
  return import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem(AI_KEY_STORAGE) || ''
}

async function callGroq(prompt, apiKey, maxTokens = 768) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API hatası: ${res.status}`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Yapay zekadan geçersiz yanıt alındı.')
  return JSON.parse(match[0])
}

export async function parseDiseases(freeText, apiKey, diseases) {
  const variantList = diseases
    .flatMap(d => d.variants.map(v => `${v.id}: ${d.name} (${d.icd10}) — ${v.label}`))
    .join('\n')

  const prompt = `Sen bir iş yeri hekimliği asistanısın.
Aşağıda bir çalışanın hastalıkları/durumları serbest metin ile verilmiştir.
ICD-10 kodları da girilmiş olabilir (ör. E11.9, I10). Bunları da tanı.

Mevcut varyantlar listesinden en uygun ID'leri seç.

SADECE JSON döndür, açıklama yazma:
{"variants": ["ID1", "ID2"], "unmatched": ["tanınamayan madde"]}

Mevcut varyantlar:
${variantList}

Değerlendirilecek metin:
${freeText}`

  return callGroq(prompt, apiKey, 512)
}

export async function analyzeMedications(medications, diagnoses, apiKey) {
  const prompt = `Sen bir iş yeri hekimisin. Aşağıdaki ilaçları iş güvenliği açısından değerlendir.

İlaçlar: ${medications}
${diagnoses.length > 0 ? `Tanılar: ${diagnoses.join(', ')}` : ''}

Bu ilaçların iş ortamı güvenliğini etkileyebilecek YAN ETKİLERİNİ listele.
Sadece iş güvenliği açısından önemli olanları yaz:
- Uyuşukluk / konsantrasyon bozukluğu (makine, araç kullanımı)
- Hipoglisemi (ağır fiziksel iş)
- Baş dönmesi / senkop (yüksekte çalışma)
- Kardiyak etki (ağır iş)
- Görme / işitme etkisi
- Güneş hassasiyeti (dış ortam işi)
- Diğer iş güvenliği riskleri

Eğer herhangi bir yan etki iş güvenliği için önemli değilse, o ilacı YAZMA.
Eğer bilmiyorsan o ilacı yazma.

SADECE JSON döndür:
{"warnings": ["İlaç adı: kısa yan etki notu ve dikkat edilecek iş koşulu"]}`

  return callGroq(prompt, apiKey, 512)
}
