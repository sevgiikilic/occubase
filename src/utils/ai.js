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

export async function generateDiseaseProfile(query, apiKey) {
  const suffix = Date.now().toString().slice(-4)
  const prompt = `Sen deneyimli bir iş yeri hekimisin. "${query}" hastalığı/durumu için mesleki çalışma kısıt profili oluştur.

SADECE aşağıdaki JSON formatında döndür, başka hiçbir şey yazma:
{
  "id": "CUSTOM_KOD_${suffix}",
  "category": "cardiovascular|metabolic|respiratory|neurological|psychiatric|renal|musculoskeletal|sensory|hematology|special (birini seç)",
  "name": "Türkçe tam hastalık adı",
  "shortName": "Kısa ad (max 10 karakter)",
  "icd10": "ICD-10 kodu",
  "description": "Kısa Türkçe açıklama",
  "variants": [
    {
      "id": "CUSTOM_KOD_${suffix}_v1",
      "label": "Varyant adı (örn: Hafif evre, Kontrollü)",
      "criteria": "Bu varyantın kriterleri",
      "workCapacity": "FULL veya RESTRICTED veya TEMP_UNFIT veya PERMANENT_UNFIT (birini seç)",
      "capacityNote": "Kapasite ile ilgili Türkçe not",
      "restrictions": {
        "nightShift": {"value": "YES veya EVALUATE veya NO", "reason": "Türkçe gerekçe veya boş string"},
        "shiftWork": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "heavyPhysical": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "moderatePhysical": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "workingAtHeight": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "operatingMachinery": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "drivingHeavyVehicle": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "chemicalExposure": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "dustExposure": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "noisyEnvironment": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "hotEnvironment": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "coldEnvironment": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "stressfulWork": {"value": "YES veya EVALUATE veya NO", "reason": ""},
        "prolongedStanding": {"value": "YES veya EVALUATE veya NO", "reason": ""}
      },
      "periodicExam": 12,
      "workplaceTests": ["Test 1", "Test 2"],
      "specialistFollowUp": ["Uzmanlık — takip notu"],
      "immediateActions": [],
      "notes": "Ek mesleki notlar"
    }
  ]
}

Kısıt değerleri: YES = kısıt yok, EVALUATE = bireysel değerlendir, NO = yapamaz.
Eğer hastalığın birden fazla evresi/şiddeti varsa variants dizisine 2 eleman ekle.`

  const result = await callGroq(prompt, apiKey, 2000)

  // id'lerin CUSTOM_ ile başladığını garantile
  if (!result.id?.startsWith('CUSTOM_')) result.id = `CUSTOM_${suffix}`
  result.variants?.forEach((v, i) => {
    if (!v.id?.startsWith('CUSTOM_')) v.id = `${result.id}_v${i + 1}`
  })

  // Her restriction key'inin mevcut olduğundan emin ol
  const requiredKeys = ['nightShift','shiftWork','heavyPhysical','moderatePhysical','workingAtHeight',
    'operatingMachinery','drivingHeavyVehicle','chemicalExposure','dustExposure','noisyEnvironment',
    'hotEnvironment','coldEnvironment','stressfulWork','prolongedStanding']
  const validValues = new Set(['YES','EVALUATE','NO'])

  result.variants?.forEach(v => {
    if (!v.restrictions) v.restrictions = {}
    requiredKeys.forEach(k => {
      if (!v.restrictions[k] || !validValues.has(v.restrictions[k].value)) {
        v.restrictions[k] = { value: 'EVALUATE', reason: '' }
      }
    })
    if (!v.periodicExam) v.periodicExam = 12
    if (!Array.isArray(v.workplaceTests)) v.workplaceTests = []
    if (!Array.isArray(v.specialistFollowUp)) v.specialistFollowUp = []
    if (!Array.isArray(v.immediateActions)) v.immediateActions = []
  })

  return result
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
