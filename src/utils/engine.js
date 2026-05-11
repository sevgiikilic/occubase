import { DISEASES, RESTRICTION_LABELS } from '../data/diseases'
import { getCustomDiseases } from './customDiseases'

const CAPACITY_PRIORITY = { PERMANENT_UNFIT: 3, TEMP_UNFIT: 2, RESTRICTED: 1, FULL: 0 }
const RESTRICTION_PRIORITY = { NO: 2, EVALUATE: 1, YES: 0 }

export const CAPACITY_META = {
  FULL: { label: 'Tam Uygun', color: 'green', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  RESTRICTED: { label: 'Kısıtla Uygun', color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  TEMP_UNFIT: { label: 'Geçici Uygun Değil', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  PERMANENT_UNFIT: { label: 'Kalıcı Uygun Değil', color: 'red', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
}

export const RESTRICTION_META = {
  YES:      { label: 'Kısıt Yok',   color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  EVALUATE: { label: 'Değerlendir', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  NO:       { label: 'Yapamaz',     color: 'text-red-700',   bg: 'bg-red-50',   dot: 'bg-red-500' },
}

export function runAssessment(selectedVariants) {
  if (!selectedVariants.length) return null

  const rules = selectedVariants.map(variantId => findVariant(variantId)).filter(Boolean)
  if (!rules.length) return null

  const workCapacity = mergeCapacity(rules.map(r => r.workCapacity))
  const restrictions = mergeRestrictions(rules)
  const riskFactors = [...new Set(rules.flatMap(r => r.riskFactors || []))]
  const workplaceTests = [...new Set(rules.flatMap(r => r.workplaceTests || []))]
  const specialistFollowUp = [...new Set(rules.flatMap(r => r.specialistFollowUp || []))]
  const immediateActions = [...new Set(rules.flatMap(r => r.immediateActions || []))]
  const notes = rules.map(r => r.notes).filter(Boolean)
  const periodicExam = Math.min(...rules.map(r => r.periodicExam).filter(Boolean))

  const activeRestrictions = Object.entries(restrictions)
    .filter(([, v]) => v.value !== 'YES')
    .sort((a, b) => RESTRICTION_PRIORITY[b[1].value] - RESTRICTION_PRIORITY[a[1].value])

  const synergies = detectSynergies(rules)

  return {
    workCapacity,
    restrictions,
    activeRestrictions,
    riskFactors,
    workplaceTests,
    specialistFollowUp,
    immediateActions,
    notes,
    periodicExam,
    synergies,
    diseaseCount: rules.length,
  }
}

function findVariant(variantId) {
  for (const disease of [...DISEASES, ...getCustomDiseases()]) {
    const variant = disease.variants.find(v => v.id === variantId)
    if (variant) return { ...variant, diseaseName: disease.name }
  }
  return null
}

function mergeCapacity(capacities) {
  return capacities.reduce((acc, cap) =>
    CAPACITY_PRIORITY[cap] > CAPACITY_PRIORITY[acc] ? cap : acc, 'FULL')
}

function mergeRestrictions(rules) {
  const merged = {}
  const domains = Object.keys(RESTRICTION_LABELS)

  for (const domain of domains) {
    let best = { value: 'YES', reason: '', sources: [] }
    for (const rule of rules) {
      const r = rule.restrictions?.[domain]
      if (!r) continue
      if (RESTRICTION_PRIORITY[r.value] > RESTRICTION_PRIORITY[best.value]) {
        best = { value: r.value, reason: r.reason, sources: [rule.diseaseName] }
      } else if (r.value === best.value && r.reason) {
        best.sources.push(rule.diseaseName)
      }
    }
    merged[domain] = best
  }
  return merged
}

function detectSynergies(rules) {
  const synergies = []
  const ids = rules.map(r => r.id)

  if (ids.some(id => id.startsWith('HT')) && ids.some(id => id.startsWith('DM')))
    synergies.push('HT + DM birlikteliği kardiyovasküler riski katlayarak artırır. Yüklü pozisyonlar ve stresli iş için ek dikkat gerekir.')

  if (ids.some(id => id.startsWith('DM')) && ids.some(id => id.startsWith('KBH')))
    synergies.push('DM + KBH birlikteliği: Nefropati riski yüksek. Nefrotoksik kimyasal maruziyetinden kesinlikle kaçınılmalı.')

  if (ids.some(id => id.startsWith('KAH')) && ids.some(id => id.startsWith('HT')))
    synergies.push('KAH + HT: Kardiyak olay riski çok yüksek; ağır fiziksel iş ve stresli ortam için kardiyoloji onayı şarttır.')

  if (ids.some(id => id.startsWith('PSIKOZ') || id.startsWith('DEP_ANK')) && ids.some(id => id.startsWith('EPILEPSI')))
    synergies.push('Psikiyatrik hastalık + Epilepsi: Uyku düzeni kritik; gece çalışması kesinlikle uygun değil.')

  if (ids.some(id => id.startsWith('GEBELIK') || id.startsWith('RISKLI')) && ids.some(id => id.startsWith('HT') || id.startsWith('DM')))
    synergies.push('Gebelik + Kronik hastalık birlikteliği: Perinatoloji ve ilgili uzman iş birliği zorunludur.')

  return synergies
}
