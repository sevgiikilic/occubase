import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DISEASES, RESTRICTION_LABELS } from '../data/diseases'
import { runAssessment, CAPACITY_META, RESTRICTION_META } from '../utils/engine'
import { parseDiseases, analyzeMedications, generateDiseaseProfile, getApiKey } from '../utils/ai'
import { getCustomDiseases, saveCustomDisease, isCustomDisease } from '../utils/customDiseases'
import {
  Search, X, Printer, Copy, CheckCircle, AlertTriangle, Clock,
  FlaskConical, Stethoscope, Info, ClipboardList, Sparkles, Loader2, Pill,
  ChevronDown, Building2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'

const WORKPLACE_CONTEXT_MAP = [
  { terms: ['depo','ambar','lojistik','yükleme','stok'],
    label: 'Depo / Lojistik', icon: '📦',
    domains: ['heavyPhysical','moderatePhysical','dustExposure','chemicalExposure'],
    note: 'Ağır kaldırma ve toz maruziyeti sıktır. Forklift yakınında çalışma olabilir.' },
  { terms: ['forklift','iş makinesi','vinç','operatör','excavatör','beko'],
    label: 'İş Makinesi Operatörü', icon: '🚜',
    domains: ['operatingMachinery','drivingHeavyVehicle','noisyEnvironment'],
    note: 'Makine kullanımı yoğun konsantrasyon ve hızlı refleks gerektirir. Epilepsi, görme ve ilaç etkisi kritik.' },
  { terms: ['inşaat','yapı','iskele','beton','çatı'],
    label: 'İnşaat / Yapı', icon: '🏗️',
    domains: ['workingAtHeight','heavyPhysical','dustExposure','chemicalExposure'],
    note: 'Yüksekte çalışma ve ağır fiziksel iş yüksek kaza riski taşır.' },
  { terms: ['şoför','sürücü','kamyon','otobüs','minibüs','tır'],
    label: 'Sürücü / Araç Kullanımı', icon: '🚛',
    domains: ['drivingHeavyVehicle','operatingMachinery'],
    note: 'Uzun süreli araç kullanımı; konsantrasyon, görme ve ilaç yan etkileri kritik.' },
  { terms: ['gece güvenlik','güvenlik görevlisi','bekçi','security'],
    label: 'Gece Güvenlik Görevlisi', icon: '🔒',
    domains: ['nightShift','shiftWork'],
    note: 'Gece vardiyası ve düzensiz uyku ritmi. Kardiyak ve psikiyatrik açıdan önemli.' },
  { terms: ['hemşire','ebe','sağlık personeli','bakım'],
    label: 'Sağlık Personeli', icon: '🏥',
    domains: ['nightShift','shiftWork','heavyPhysical','chemicalExposure'],
    note: 'Gece vardiyası, hasta kaldırma, dezenfektan ve ilaç maruziyeti.' },
  { terms: ['kaynakçı','kaynak','lehim','metalleri'],
    label: 'Kaynakçı', icon: '⚡',
    domains: ['chemicalExposure','dustExposure','hotEnvironment'],
    note: 'Metal dumanı, UV ve ısı maruziyeti yüksek. Solunum ve göz takibi şart.' },
  { terms: ['boyacı','boya','vernik','solvent','oto boya'],
    label: 'Boyacı / Solvent Ortamı', icon: '🎨',
    domains: ['chemicalExposure','dustExposure'],
    note: 'Solvent buharı ve kimyasal maruziyet. Karaciğer ve nörolojik etki olabilir.' },
  { terms: ['maden','ocak','yeraltı','tünel','maden işçisi'],
    label: 'Maden / Yeraltı', icon: '⛏️',
    domains: ['dustExposure','chemicalExposure','noisyEnvironment'],
    note: 'Silika tozu, gaz ve gürültü maruziyeti son derece yüksek risk.' },
  { terms: ['fabrika','imalat','atölye','sanayi','üretim'],
    label: 'Fabrika / İmalat', icon: '🏭',
    domains: ['noisyEnvironment','chemicalExposure','heavyPhysical'],
    note: 'Gürültü, kimyasal ve ağır fiziksel iş birlikteliği olabilir.' },
  { terms: ['mutfak','aşçı','şef','restoran'],
    label: 'Mutfak / Aşçı', icon: '🍳',
    domains: ['hotEnvironment','chemicalExposure','heavyPhysical'],
    note: 'Yüksek ısı, uzun süre ayakta çalışma, kimyasal (deterjan) maruziyet.' },
]

const HAZARD_CLASSES = [
  { id: 'low', label: 'Az Tehlikeli', months: 60, legal: '5 yılda bir' },
  { id: 'medium', label: 'Tehlikeli', months: 36, legal: '3 yılda bir' },
  { id: 'high', label: 'Çok Tehlikeli', months: 12, legal: 'Yılda bir' },
]

const POSITIONS = [
  { id: 'office', label: 'Ofis / Masa Başı' },
  { id: 'light', label: 'Hafif Fiziksel (ayakta, hareket)' },
  { id: 'moderate', label: 'Orta Fiziksel (10–25 kg)' },
  { id: 'heavy', label: 'Ağır Fiziksel (>25 kg, inşaat vb.)' },
  { id: 'driver', label: 'Sürücü / Araç Operatörü' },
  { id: 'height', label: 'Yüksekte Çalışma' },
  { id: 'chemical', label: 'Kimyasal Maruziyet' },
  { id: 'night', label: 'Gece / Vardiyalı Çalışma' },
]

function getAllDiseases() {
  return [...DISEASES, ...getCustomDiseases()]
}

function getDiseaseInfo(vId) {
  for (const d of getAllDiseases()) {
    const v = d.variants.find(v => v.id === vId)
    if (v) return { variant: v, disease: d }
  }
  return null
}

export default function Assessment() {
  const [form, setForm] = useState({ age: '', gender: '', position: '', hazardClass: '', medications: '', notes: '' })
  const [selectedVariants, setSelectedVariants] = useState([])
  const [result, setResult] = useState(null)
  const [medWarnings, setMedWarnings] = useState([])
  const [medLoading, setMedLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef(null)

  const hazardClass = HAZARD_CLASSES.find(h => h.id === form.hazardClass)
  const effectivePeriodic = result
    ? (hazardClass ? Math.min(hazardClass.months, result.periodicExam) : result.periodicExam)
    : null
  const periodicReason = result && hazardClass
    ? (hazardClass.months <= result.periodicExam
      ? `Yasal min: ${hazardClass.label} sınıfı (${hazardClass.legal})`
      : `Hastalık takibi (yasal min. ${hazardClass.legal})`)
    : 'Kronik hastalık takibi'

  const selectedDiseaseInfo = selectedVariants.map(vId => {
    const info = getDiseaseInfo(vId)
    return info ? { label: `${info.disease.name} — ${info.variant.label}`, icd10: info.disease.icd10 } : null
  }).filter(Boolean)

  // Workplace context detection from notes + position
  const workplaceContext = useMemo(() => {
    const text = ((form.notes || '') + ' ' + (POSITIONS.find(p => p.id === form.position)?.label || '')).toLowerCase()
    if (!text.trim()) return null
    for (const ctx of WORKPLACE_CONTEXT_MAP) {
      if (ctx.terms.some(t => text.includes(t))) {
        return ctx
      }
    }
    return null
  }, [form.notes, form.position])

  function addVariant(id) {
    if (!selectedVariants.includes(id)) {
      setSelectedVariants(v => [...v, id])
      setResult(null)
    }
  }
  function removeVariant(id) {
    setSelectedVariants(v => v.filter(x => x !== id))
    setResult(null)
  }

  async function evaluate() {
    const r = runAssessment(selectedVariants)
    setResult(r)
    setMedWarnings([])

    const apiKey = getApiKey()
    if (form.medications.trim() && apiKey) {
      setMedLoading(true)
      try {
        const names = selectedVariants.map(vid => {
          const info = getDiseaseInfo(vid)
          return info ? `${info.disease.name} (${info.variant.label})` : null
        }).filter(Boolean)
        const res = await analyzeMedications(form.medications, names, apiKey)
        setMedWarnings(res.warnings || [])
      } catch (_) { /* silent */ }
      finally { setMedLoading(false) }
    }

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function handleCopy() {
    if (!result) return
    const cap = CAPACITY_META[result.workCapacity]
    const hz = hazardClass ? `\nTehlike Sınıfı: ${hazardClass.label}` : ''
    const lines = [
      '═══════════════════════════════════════',
      'OCCUBASE — ÇALIŞAN DEĞERLENDİRME RAPORU',
      `Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
      '═══════════════════════════════════════',
      form.age ? `Yaş: ${form.age}` : '',
      form.gender ? `Cinsiyet: ${form.gender === 'M' ? 'Erkek' : 'Kadın'}` : '',
      form.position ? `Pozisyon: ${POSITIONS.find(p => p.id === form.position)?.label}` : '',
      hz,
      '',
      `ÇALIŞMA KAPASİTESİ: ${cap.label}`,
      '',
      'TANILAR:',
      ...selectedDiseaseInfo.map(d => `  • ${d.label} (${d.icd10})`),
      '',
      'KISITLAR:',
      ...result.activeRestrictions.map(([domain, info]) =>
        `  • ${RESTRICTION_LABELS[domain]}: ${RESTRICTION_META[info.value].label}${info.reason ? ' — ' + info.reason : ''}`
      ),
      '',
      `PERİYODİK MUAYENE: Her ${effectivePeriodic} ayda bir (${periodicReason})`,
      '',
      'İŞYERİ TEKKİLERİ:',
      ...(result.workplaceTests || []).map(t => `  • ${t}`),
      '',
      'UZMAN TAKİP KONTROLÜ:',
      ...(result.specialistFollowUp || []).map(s => `  • ${s}`),
      medWarnings.length ? '\nİLAÇ UYARILARI:' : '',
      ...medWarnings.map(w => `  ⚠ ${w}`),
      result.immediateActions.length ? '\nACİL ÖNLEMLER:' : '',
      ...result.immediateActions.map(a => `  ⚠ ${a}`),
      '',
      '═══════════════════════════════════════',
    ].filter(l => l !== undefined)
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Çalışan Değerlendirmesi</h1>
        <p className="text-slate-500 text-sm mt-0.5">Hastalık ve çalışma koşullarını girin; kombine risk raporu oluşturun.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 assessment-grid">
        {/* ── Form column ── */}
        <div className="lg:col-span-2 space-y-4 assessment-form-col">

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4 text-sm">Temel Bilgiler</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Yaş</label>
                <input type="number" min="16" max="75" value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  placeholder="ör. 42"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500 bg-slate-50 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cinsiyet</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500 bg-slate-50 focus:bg-white transition">
                  <option value="">Seçin</option>
                  <option value="M">Erkek</option>
                  <option value="F">Kadın</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Çalışma Pozisyonu</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500 bg-slate-50 focus:bg-white transition">
                <option value="">Pozisyon seçin</option>
                {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Building2 size={12} className="text-slate-400" />
                Tehlike Sınıfı
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {HAZARD_CLASSES.map(h => (
                  <button key={h.id}
                    onClick={() => setForm(f => ({ ...f, hazardClass: f.hazardClass === h.id ? '' : h.id }))}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                      form.hazardClass === h.id
                        ? h.id === 'low' ? 'bg-green-600 text-white border-green-600'
                          : h.id === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    <div>{h.label}</div>
                    <div className={`text-[10px] mt-0.5 ${form.hazardClass === h.id ? 'opacity-80' : 'text-slate-400'}`}>{h.legal}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Disease selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-3 text-sm">Hastalık / Durum Ekle</h2>
            <DiseaseSelector selectedVariants={selectedVariants} onAdd={addVariant} onRemove={removeVariant} />
          </div>

          {/* Medications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Pill size={15} className="text-emerald-500" />
              <h2 className="font-semibold text-slate-900 text-sm">Kullandığı İlaçlar</h2>
              {!getApiKey() && <span className="text-xs text-slate-400 ml-auto">AI analizi için anahtar gerekli</span>}
            </div>
            <p className="text-xs text-slate-500 mb-2">İlaç isimlerini girin. Değerlendirme sonrası iş güvenliği uyarıları otomatik oluşturulur.</p>
            <textarea value={form.medications}
              onChange={e => setForm(f => ({ ...f, medications: e.target.value }))}
              rows={2}
              placeholder="ör. Metformin 1000mg, Losartan 50mg, Aspirin 100mg"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-50 focus:bg-white transition" />
          </div>

          {/* AI free text */}
          <AITextCard onAddVariants={(ids) => ids.forEach(addVariant)} />

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-2 text-sm">Ek Notlar</h2>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Özel bulgular, ilaç değişimi, muayene notları..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500 resize-none bg-slate-50 focus:bg-white transition" />
          </div>

          <button onClick={evaluate} disabled={!selectedVariants.length}
            className="w-full bg-pulse-600 hover:bg-pulse-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-sm">
            Değerlendir
          </button>
        </div>

        {/* ── Result column ── */}
        <div className="lg:col-span-3" ref={resultRef}>
          {/* Screen view */}
          <div className="print:hidden">
            {!result && !selectedVariants.length && <EmptyState />}
            {!result && selectedVariants.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 shadow-sm">
                <Info size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">"Değerlendir" butonuna basarak raporu oluşturun.</p>
              </div>
            )}
            {result && (
              <ResultPanel
                result={result} form={form}
                effectivePeriodic={effectivePeriodic} periodicReason={periodicReason}
                medWarnings={medWarnings} medLoading={medLoading}
                selectedDiseaseInfo={selectedDiseaseInfo}
                workplaceContext={workplaceContext}
                onPrint={() => window.print()} onCopy={handleCopy} copied={copied}
              />
            )}
          </div>

          {/* Print view */}
          {result && (
            <div className="hidden print:block">
              <PrintReport
                result={result} form={form}
                effectivePeriodic={effectivePeriodic} periodicReason={periodicReason}
                medWarnings={medWarnings} selectedDiseaseInfo={selectedDiseaseInfo}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── DiseaseSelector ─── */
function DiseaseSelector({ selectedVariants, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [activeDisease, setActiveDisease] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPreview, setAiPreview] = useState(null)
  const [aiError, setAiError] = useState('')
  const [customList, setCustomList] = useState(() => getCustomDiseases())
  const wrapperRef = useRef(null)

  const allDiseases = useMemo(() => [...DISEASES, ...customList], [customList])

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allDiseases.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.icd10.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    ).slice(0, 7)
  }, [query, allDiseases])

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedItems = selectedVariants.map(vId => {
    for (const d of allDiseases) {
      const v = d.variants.find(v => v.id === vId)
      if (v) return { id: vId, label: v.label, diseaseName: d.name, icd10: d.icd10, isCustom: isCustomDisease(d.id) }
    }
    return null
  }).filter(Boolean)

  function selectVariant(variantId) {
    onAdd(variantId)
    setActiveDisease(null)
    setQuery('')
    setShowDropdown(false)
  }

  async function handleGenerateAI() {
    const apiKey = getApiKey()
    if (!apiKey) { setAiError('API anahtarı tanımlı değil.'); return }
    setAiLoading(true)
    setAiError('')
    setAiPreview(null)
    setShowDropdown(false)
    try {
      const profile = await generateDiseaseProfile(query.trim(), apiKey)
      setAiPreview(profile)
    } catch (e) {
      setAiError(e.message || 'AI profili oluşturulamadı.')
    } finally {
      setAiLoading(false)
    }
  }

  function handleSaveAndAdd() {
    if (!aiPreview) return
    saveCustomDisease(aiPreview)
    setCustomList(getCustomDiseases())
    setActiveDisease(aiPreview)
    setAiPreview(null)
    setQuery('')
  }

  return (
    <div>
      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedItems.map(({ id, label, diseaseName, icd10, isCustom }) => (
            <div key={id} className="flex items-center gap-1.5 bg-pulse-50 border border-pulse-200 text-pulse-800 text-xs px-2.5 py-1.5 rounded-lg">
              <span className="font-mono text-pulse-600 text-[10px]">{icd10}</span>
              <span>{diseaseName}: {label}</span>
              {isCustom && <span className="bg-amber-100 text-amber-700 px-1 rounded text-[9px] font-semibold">AI</span>}
              <button onClick={() => onRemove(id)} className="hover:text-red-500 transition-colors ml-0.5">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative" ref={wrapperRef}>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text" value={query}
          onChange={e => { setQuery(e.target.value); setActiveDisease(null); setAiPreview(null); setAiError(''); setShowDropdown(true) }}
          onFocus={() => query.trim() && setShowDropdown(true)}
          placeholder="Hastalık adı veya ICD-10 kodu (ör. I10, E11, diyabet)"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500 bg-slate-50 focus:bg-white transition"
        />

        {/* Dropdown results */}
        {showDropdown && query.trim() && searchResults.length > 0 && !activeDisease && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {searchResults.map(d => (
              <button key={d.id}
                onClick={() => { setActiveDisease(d); setShowDropdown(false) }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-left transition-colors border-b border-slate-50 last:border-0">
                <span className="text-sm font-medium text-slate-800">{d.name}</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isCustomDisease(d.id) && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">AI</span>}
                  <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{d.icd10}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results → AI generate button */}
        {showDropdown && query.trim().length >= 2 && searchResults.length === 0 && !activeDisease && !aiLoading && !aiPreview && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
            <p className="text-xs text-slate-500 mb-2">"{query}" veri tabanında bulunamadı.</p>
            <button
              onClick={handleGenerateAI}
              disabled={!getApiKey()}
              className="flex items-center gap-2 text-xs font-medium bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full">
              <Sparkles size={13} />
              AI ile "{query}" profili oluştur
            </button>
            {!getApiKey() && <p className="text-[10px] text-slate-400 mt-1">AI özelliği için Groq API anahtarı gerekli.</p>}
          </div>
        )}
      </div>

      {/* AI loading */}
      {aiLoading && (
        <div className="mt-2 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <Loader2 size={14} className="animate-spin" />
          AI mesleki profil oluşturuyor...
        </div>
      )}

      {/* AI error */}
      {aiError && (
        <div className="mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {aiError}
        </div>
      )}

      {/* AI preview */}
      {aiPreview && (
        <div className="mt-2 p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{aiPreview.name}</span>
                <span className="font-mono text-xs text-slate-400">{aiPreview.icd10}</span>
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-semibold">AI</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{aiPreview.description}</p>
            </div>
            <button onClick={() => setAiPreview(null)} className="text-slate-400 hover:text-slate-600 ml-2 shrink-0">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {aiPreview.variants?.map(v => (
              <span key={v.id} className="text-xs bg-white border border-amber-200 text-slate-700 px-2 py-1 rounded-lg">
                {v.label} — <span className="text-amber-700 font-medium">{CAPACITY_META[v.workCapacity]?.label}</span>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-amber-700 mb-3">AI tarafından oluşturulmuştur. Klinik doğrulama önerilir.</p>
          <div className="flex gap-2">
            <button
              onClick={handleSaveAndAdd}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors">
              Kaydet ve Değerlendirmeye Ekle
            </button>
            <button
              onClick={() => setAiPreview(null)}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Severity selection */}
      {activeDisease && (
        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{activeDisease.name}</span>
              <span className="text-xs font-mono text-slate-400">{activeDisease.icd10}</span>
              {isCustomDisease(activeDisease.id) && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold border border-amber-200">AI</span>
              )}
            </div>
            <button onClick={() => { setActiveDisease(null); setQuery('') }}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-2">Kontrol durumu / şiddeti seçin:</p>
          <div className="flex flex-wrap gap-2">
            {activeDisease.variants.map(v => {
              const isSelected = selectedVariants.includes(v.id)
              return (
                <button key={v.id}
                  onClick={() => !isSelected && selectVariant(v.id)}
                  disabled={isSelected}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 cursor-default'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm'
                  }`}>
                  {isSelected ? '✓ ' : ''}{v.label}
                  {v.criteria && <span className="ml-1 opacity-60">({v.criteria})</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── AI Text Card ─── */
function AITextCard({ onAddVariants }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unmatched, setUnmatched] = useState([])
  const [addedCount, setAddedCount] = useState(0)
  const timerRef = useRef(null)
  const apiKey = getApiKey()

  useEffect(() => {
    if (!text.trim() || !apiKey) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runAnalysis(), 1800)
    return () => clearTimeout(timerRef.current)
  }, [text])

  async function runAnalysis() {
    if (!text.trim() || !apiKey) return
    setLoading(true)
    setError('')
    setUnmatched([])
    setAddedCount(0)
    try {
      const result = await parseDiseases(text, apiKey, DISEASES)
      const validIds = (result.variants || []).filter(id =>
        DISEASES.some(d => d.variants.some(v => v.id === id))
      )
      onAddVariants(validIds)
      setAddedCount(validIds.length)
      setUnmatched(result.unmatched || [])
      if (validIds.length > 0) setText('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={15} className="text-violet-500" />
        <h2 className="font-semibold text-slate-900 text-sm">AI ile Serbest Metin Analizi</h2>
        {loading && <Loader2 size={13} className="animate-spin text-violet-400 ml-auto" />}
        {!apiKey && <span className="text-xs text-slate-400 ml-auto">API anahtarı gerekli</span>}
      </div>
      <p className="text-xs text-slate-500 mb-2">
        Yazarken otomatik analiz edilir{apiKey ? '' : ' (Ayarlar\'dan anahtar ekleyin)'}.
      </p>
      <textarea value={text}
        onChange={e => { setText(e.target.value); setError(''); setAddedCount(0) }}
        rows={2}
        disabled={!apiKey}
        placeholder="ör. kontrollü hipertansiyon, tip 2 diyabet, kronik bel ağrısı, E11.9"
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none bg-slate-50 focus:bg-white transition disabled:opacity-50" />

      {error && <p className="mt-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">{error}</p>}
      {unmatched.length > 0 && (
        <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
          Eşleştirilemeyen: {unmatched.join(', ')}
        </p>
      )}
      {addedCount > 0 && (
        <p className="mt-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5">
          {addedCount} durum eklendi — listeden kontrol edin.
        </p>
      )}
      {!apiKey && (
        <p className="mt-1.5 text-xs text-slate-400">
          <Link to="/settings" className="text-pulse-600 hover:underline">Ayarlar</Link> sayfasından API anahtarı ekleyin.
        </p>
      )}
    </div>
  )
}

/* ─── Result Panel (screen) ─── */
function ResultPanel({ result, form, effectivePeriodic, periodicReason, medWarnings, medLoading, selectedDiseaseInfo, workplaceContext, onPrint, onCopy, copied }) {
  const cap = CAPACITY_META[result.workCapacity]

  const chartData = [
    { name: 'Kısıtlı', value: result.activeRestrictions.filter(([, v]) => v.value === 'NO').length, color: '#ef4444' },
    { name: 'Değerlendir', value: result.activeRestrictions.filter(([, v]) => v.value === 'EVALUATE').length, color: '#f59e0b' },
    { name: 'Serbest', value: Object.keys(result.restrictions).length - result.activeRestrictions.length, color: '#22c55e' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Capacity header */}
      <div className={`${cap.bg} border-b ${cap.border} px-5 py-4`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Çalışma Kapasitesi</div>
            <div className={`text-2xl font-bold ${cap.text}`}>{cap.label}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
            <button onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm">
              <Printer size={14} />
              Yazdır
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
          {form.age && <span>Yaş: {form.age}</span>}
          {form.gender && <span>Cinsiyet: {form.gender === 'M' ? 'Erkek' : 'Kadın'}</span>}
          {form.position && <span>Pozisyon: {POSITIONS.find(p => p.id === form.position)?.label}</span>}
          {form.hazardClass && <span className="font-medium">{HAZARD_CLASSES.find(h => h.id === form.hazardClass)?.label}</span>}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Immediate actions */}
        {result.immediateActions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
              <AlertTriangle size={15} /> Acil Önlemler Gerekli
            </div>
            <ul className="space-y-1">
              {result.immediateActions.map((a, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>{a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Workplace context panel */}
        {workplaceContext && (
          <WorkplaceContextPanel ctx={workplaceContext} activeRestrictions={result.activeRestrictions} />
        )}

        {/* Synergies */}
        {result.synergies?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
              <Info size={15} /> Birden Fazla Hastalık — Ek Dikkat
            </div>
            {result.synergies.map((s, i) => <p key={i} className="text-sm text-amber-800">{s}</p>)}
          </div>
        )}

        {/* Restriction chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 text-sm">Kısıt Özeti</h3>
            <div className="flex gap-3 text-xs text-slate-500">
              {chartData.map(d => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={72}>
            <BarChart data={chartData} layout="vertical" barSize={18}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={68} />
              <Tooltip formatter={(v) => [`${v} alan`, '']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active restrictions */}
        {result.activeRestrictions.length > 0 ? (
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Çalışma Kısıtları</h3>
            <div className="space-y-2">
              {result.activeRestrictions.map(([domain, info]) => {
                const meta = RESTRICTION_META[info.value]
                return (
                  <div key={domain} className={`${meta.bg} rounded-xl px-4 py-3`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full ${meta.dot} mt-1.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${meta.color}`}>{RESTRICTION_LABELS[domain]}</span>
                          <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                        </div>
                        {info.reason && <p className="text-xs text-slate-500 mt-0.5">{info.reason}</p>}
                        {info.sources?.length > 0 && <p className="text-xs text-slate-400 mt-0.5">Kaynak: {info.sources.join(', ')}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 text-center">
            Bu hastalık kombinasyonunda belirli bir çalışma kısıtı tespit edilmedi.
          </div>
        )}

        {/* Periodic exam */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs mb-1">
            <Clock size={13} /> Periyodik Muayene
          </div>
          <div className="text-base font-bold text-slate-900">Her {effectivePeriodic} ayda bir</div>
          <div className="text-xs text-slate-500 mt-0.5">{periodicReason}</div>
        </div>

        {/* Workplace tests */}
        {result.workplaceTests?.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs mb-2">
              <FlaskConical size={13} /> İşyeri Tetkikleri
              <span className="font-normal text-blue-400 ml-1">iş yeri hekimi yapar</span>
            </div>
            <ul className="space-y-1">
              {result.workplaceTests.map((t, i) => (
                <li key={i} className="text-xs text-blue-800 flex items-start gap-1.5">
                  <span className="text-blue-400 mt-0.5">•</span>{t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specialist follow-up */}
        {result.specialistFollowUp?.length > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-violet-800 font-semibold text-xs mb-2">
              <Stethoscope size={13} /> Uzman Takip Kontrolü
              <span className="font-normal text-violet-400 ml-1">uzman yapıyor mu?</span>
            </div>
            <ul className="space-y-1">
              {result.specialistFollowUp.map((s, i) => (
                <li key={i} className="text-xs text-violet-800 flex items-start gap-1.5">
                  <span className="text-violet-400 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Medication warnings */}
        {(medLoading || medWarnings.length > 0) && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-800 font-semibold text-xs mb-2">
              <Pill size={13} /> İlaç Uyarıları
              {medLoading && <Loader2 size={12} className="animate-spin ml-1" />}
            </div>
            {medLoading && <p className="text-xs text-orange-600">İlaçlar analiz ediliyor...</p>}
            {medWarnings.map((w, i) => (
              <div key={i} className="text-xs text-orange-800 flex items-start gap-1.5 mt-1">
                <span className="text-orange-400 mt-0.5">⚠</span>{w}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {result.notes?.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Notlar</h3>
            {result.notes.map((note, i) => (
              <p key={i} className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 mb-2">{note}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          Klinik karar destek amacıyla oluşturulmuştur. Nihai uygunluk kararı iş yeri hekimine aittir. OccuBase hasta verisi saklamaz.
        </p>
      </div>
    </div>
  )
}

/* ─── Print Report ─── */
function PrintReport({ result, form, effectivePeriodic, periodicReason, medWarnings, selectedDiseaseInfo }) {
  const cap = CAPACITY_META[result.workCapacity]
  const hz = HAZARD_CLASSES.find(h => h.id === form.hazardClass)
  const pos = POSITIONS.find(p => p.id === form.position)

  const noRestrictions = result.activeRestrictions.filter(([, v]) => v.value === 'NO')
  const evalRestrictions = result.activeRestrictions.filter(([, v]) => v.value === 'EVALUATE')

  return (
    <div className="print-report text-black font-sans text-[10pt] leading-snug">
      {/* Header */}
      <div className="text-center mb-5 pb-4 border-b-2 border-black">
        <div className="text-[14pt] font-bold uppercase tracking-wide">İş Yeri Hekimliği</div>
        <div className="text-[12pt] font-bold uppercase tracking-wide">Çalışan Uygunluk Raporu</div>
        <div className="text-[9pt] text-gray-600 mt-1">OccuBase Klinik Karar Destek Sistemi</div>
        <div className="text-[9pt] mt-1">Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
      </div>

      {/* Capacity box */}
      <div className="border-2 border-black px-4 py-2 mb-4 text-center">
        <div className="text-[8pt] uppercase tracking-widest text-gray-600">ÇALIŞMA KAPASİTESİ</div>
        <div className="text-[16pt] font-bold mt-0.5">{cap.label.toUpperCase()}</div>
      </div>

      {/* Patient info */}
      <div className="print-section-title">ÇALIŞAN BİLGİLERİ</div>
      <table className="print-table mb-4">
        <tbody>
          <tr>
            <th>Yaş</th><td>{form.age || '—'}</td>
            <th>Cinsiyet</th><td>{form.gender === 'M' ? 'Erkek' : form.gender === 'F' ? 'Kadın' : '—'}</td>
          </tr>
          <tr>
            <th>Çalışma Pozisyonu</th>
            <td colSpan={3}>{pos?.label || '—'}</td>
          </tr>
          {hz && (
            <tr>
              <th>Tehlike Sınıfı</th>
              <td colSpan={3}>{hz.label} ({hz.legal})</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Diagnoses */}
      {selectedDiseaseInfo.length > 0 && (
        <>
          <div className="print-section-title">TANILAR</div>
          <div className="mb-4 px-2">
            {selectedDiseaseInfo.map((d, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="font-mono text-gray-500 text-[8pt] shrink-0">{d.icd10}</span>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Medications */}
      {form.medications.trim() && (
        <>
          <div className="print-section-title">KULLANILAN İLAÇLAR</div>
          <div className="mb-4 px-2 text-[9pt]">{form.medications}</div>
        </>
      )}

      {/* Restrictions */}
      {result.activeRestrictions.length > 0 && (
        <>
          <div className="print-section-title">ÇALIŞMA KISITLARI</div>
          <div className="mb-4">
            {noRestrictions.length > 0 && (
              <div className="mb-2">
                <div className="font-bold text-[9pt] px-2 py-1 bg-gray-100">KISITLI (Uygun Değil)</div>
                {noRestrictions.map(([domain, info]) => (
                  <div key={domain} className="flex items-start gap-2 px-2 py-1 border-b border-gray-100 text-[9pt]">
                    <span className="shrink-0">•</span>
                    <span><strong>{RESTRICTION_LABELS[domain]}</strong>{info.reason ? ` — ${info.reason}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
            {evalRestrictions.length > 0 && (
              <div>
                <div className="font-bold text-[9pt] px-2 py-1 bg-gray-100">BİREYSEL DEĞERLENDİR</div>
                {evalRestrictions.map(([domain, info]) => (
                  <div key={domain} className="flex items-start gap-2 px-2 py-1 border-b border-gray-100 text-[9pt]">
                    <span className="shrink-0">•</span>
                    <span><strong>{RESTRICTION_LABELS[domain]}</strong>{info.reason ? ` — ${info.reason}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Immediate actions */}
      {result.immediateActions.length > 0 && (
        <>
          <div className="print-section-title">ACİL ÖNLEMLER</div>
          <div className="mb-4 px-2">
            {result.immediateActions.map((a, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5 text-[9pt]">
                <span className="shrink-0">⚠</span><span>{a}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Periodic exam */}
      <div className="print-section-title">PERİYODİK MUAYENE</div>
      <div className="mb-4 px-2 text-[9pt]">
        Her <strong>{effectivePeriodic} ayda bir</strong> — {periodicReason}
      </div>

      {/* Two-column tests */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {result.workplaceTests?.length > 0 && (
          <div>
            <div className="print-section-title">İŞYERİ TEKKİLERİ</div>
            <div className="px-2">
              {result.workplaceTests.map((t, i) => (
                <div key={i} className="flex items-start gap-1.5 py-0.5 text-[9pt]">
                  <span className="shrink-0 text-gray-400">•</span><span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {result.specialistFollowUp?.length > 0 && (
          <div>
            <div className="print-section-title">UZMAN TAKİP KONTROLÜ</div>
            <div className="px-2">
              {result.specialistFollowUp.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5 py-0.5 text-[9pt]">
                  <span className="shrink-0 text-gray-400">•</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Medication warnings */}
      {medWarnings.length > 0 && (
        <>
          <div className="print-section-title">İLAÇ UYARILARI</div>
          <div className="mb-4 px-2">
            {medWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5 text-[9pt]">
                <span className="shrink-0">⚠</span><span>{w}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Notes */}
      {result.notes?.length > 0 && (
        <>
          <div className="print-section-title">NOTLAR</div>
          <div className="mb-4 px-2 text-[9pt]">
            {result.notes.map((n, i) => <p key={i}>{n}</p>)}
          </div>
        </>
      )}
      {form.notes?.trim() && (
        <>
          <div className="print-section-title">HEKİM NOTU</div>
          <div className="mb-4 px-2 text-[9pt]">{form.notes}</div>
        </>
      )}

      {/* Signature */}
      <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-8">
        <div className="text-[9pt]">
          <div className="mb-8">İş Yeri Hekimi:</div>
          <div className="border-b border-black w-full">&nbsp;</div>
          <div className="text-[8pt] text-gray-500 mt-1">Ad Soyad / Kaşe</div>
        </div>
        <div className="text-[9pt]">
          <div className="mb-8">İmza:</div>
          <div className="border-b border-black w-full">&nbsp;</div>
          <div className="text-[8pt] text-gray-500 mt-1">Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 text-[8pt] text-gray-400 text-center">
        Bu rapor OccuBase klinik karar destek sistemi ile oluşturulmuştur. Bağlayıcı tıbbi tavsiye değildir.
        Nihai uygunluk değerlendirmesi iş yeri hekimine aittir.
      </div>
    </div>
  )
}

/* ─── Workplace Context Panel ─── */
function WorkplaceContextPanel({ ctx, activeRestrictions }) {
  const relevantRestrictions = activeRestrictions.filter(([domain]) => ctx.domains.includes(domain))
  const hasRelevant = relevantRestrictions.length > 0

  return (
    <div className="rounded-xl border p-4" style={{ background: '#effaf8', borderColor: '#ace3dc' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{ctx.icon}</span>
        <span className="text-sm font-semibold" style={{ color: '#0c625e' }}>{ctx.label} — Bağlam Analizi</span>
      </div>
      <p className="text-xs mb-3" style={{ color: '#0d4f4c' }}>{ctx.note}</p>

      {hasRelevant ? (
        <div>
          <div className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#0f7a74' }}>
            Bu çalışma ortamında kritik kısıtlar:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relevantRestrictions.map(([domain, info]) => (
              <span key={domain}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  info.value === 'NO'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                {RESTRICTION_LABELS[domain]}: {info.value === 'NO' ? 'Yapamaz ⚠' : 'Değerlendir'}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs" style={{ color: '#1f968d' }}>
          Bu çalışma ortamı için hastalıktan kaynaklanan özel çakışan kısıt tespit edilmedi.
          Genel iş güvenliği kuralları geçerli.
        </p>
      )}
    </div>
  )
}

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
      <ClipboardList size={40} className="mx-auto text-slate-300 mb-4" />
      <h3 className="font-medium text-slate-500 mb-2">Değerlendirme Hazır</h3>
      <p className="text-sm text-slate-400 max-w-xs mx-auto">
        Sol taraftan hastalık/durumu ekleyin ve "Değerlendir" butonuna basın.
      </p>
    </div>
  )
}
