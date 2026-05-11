const KEY = 'occubase_custom_diseases'

export function getCustomDiseases() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function saveCustomDisease(disease) {
  const existing = getCustomDiseases().filter(d => d.id !== disease.id)
  localStorage.setItem(KEY, JSON.stringify([...existing, disease]))
}

export function deleteCustomDisease(id) {
  const filtered = getCustomDiseases().filter(d => d.id !== id)
  localStorage.setItem(KEY, JSON.stringify(filtered))
}

export function isCustomDisease(id) {
  return id?.startsWith('CUSTOM_')
}
