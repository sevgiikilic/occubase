import { useState, useRef } from 'react'
import { DISEASES, CATEGORIES, RESTRICTION_LABELS } from '../data/diseases'
import { runAssessment, CAPACITY_META, RESTRICTION_META } from '../utils/engine'
import {
  Plus, X, Printer, Copy, CheckCircle, AlertTriangle,
  Clock, FlaskConical, UserCheck, ChevronDown, Info, ClipboardList,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'

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

export default function Assessment() {
  const [form, setForm] = useState({ age: '', gender: '', position: '', notes: '' })
  const [selectedVariants, setSelectedVariants] = useState([])
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef(null)

  function addVariant(variantId) {
    if (!selectedVariants.includes(variantId)) {
      setSelectedVariants(v => [...v, variantId])
      setResult(null)
    }
  }

  function removeVariant(variantId) {
    setSelectedVariants(v => v.filter(id => id !== variantId))
    setResult(null)
  }

  function evaluate() {
    const r = runAssessment(selectedVariants)
    setResult(r)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function handlePrint() {
    window.print()
  }

  function handleCopy() {
    if (!result) return
    const cap = CAPACITY_META[result.workCapacity]
    const lines = [
      '═══════════════════════════════════════',
      'OCCUBASE — ÇALIŞAN DEĞERLENDİRME RAPORU',
      '═══════════════════════════════════════',
      `Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
      form.age ? `Yaş: ${form.age}` : '',
      form.gender ? `Cinsiyet: ${form.gender === 'M' ? 'Erkek' : 'Kadın'}` : '',
      form.position ? `Pozisyon: ${POSITIONS.find(p => p.id === form.position)?.label}` : '',
      '',
      `ÇALIŞMA KAPASİTESİ: ${cap.label}`,
      '',
      'KISITLAR:',
      ...result.activeRestrictions.map(([domain, info]) =>
        `  • ${RESTRICTION_LABELS[domain]}: ${RESTRICTION_META[info.value].label}${info.reason ? ' — ' + info.reason : ''}`
      ),
      '',
      `PERİYODİK MUAYENE: Her ${result.periodicExam} ayda bir`,
      '',
      'İSTENEN TETKİKLER:',
      ...result.labTests.map(t => `  • ${t}`),
      '',
      'UZMAN SEVKİ:',
      ...result.specialistReferrals.map(s => `  • ${s}`),
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Çalışan Değerlendirmesi</h1>
        <p className="text-slate-500 mt-1">Hastalık ve çalışma koşullarını girin; kombine risk raporu oluşturun.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form — left */}
        <div className="lg:col-span-2 space-y-4">

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Temel Bilgiler</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Yaş</label>
                <input
                  type="number"
                  min="16" max="75"
                  value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  placeholder="ör. 42"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cinsiyet</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seçin</option>
                  <option value="M">Erkek</option>
                  <option value="F">Kadın</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Çalışma Pozisyonu</label>
              <select
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Pozisyon seçin</option>
                {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Disease selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Hastalık / Durum Ekle</h2>
            <DiseaseSelector
              selectedVariants={selectedVariants}
              onAdd={addVariant}
              onRemove={removeVariant}
            />
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Ek Notlar</h2>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="İlaç tedavisi, ek bulgular, özel koşullar..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            onClick={evaluate}
            disabled={!selectedVariants.length}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
          >
            Değerlendir
          </button>
        </div>

        {/* Result — right */}
        <div className="lg:col-span-3" ref={resultRef}>
          {!result && !selectedVariants.length && (
            <EmptyState />
          )}
          {!result && selectedVariants.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <Info size={32} className="mx-auto mb-3" />
              <p className="text-sm">"Değerlendir" butonuna basarak raporu oluşturun.</p>
            </div>
          )}
          {result && (
            <ResultPanel result={result} form={form} onPrint={handlePrint} onCopy={handleCopy} copied={copied} />
          )}
        </div>
      </div>
    </div>
  )
}

function DiseaseSelector({ selectedVariants, onAdd, onRemove }) {
  const [openCategory, setOpenCategory] = useState(null)

  const selectedLabels = selectedVariants.map(vId => {
    for (const d of DISEASES) {
      const v = d.variants.find(v => v.id === vId)
      if (v) return { id: vId, label: v.label, diseaseName: d.name }
    }
    return null
  }).filter(Boolean)

  return (
    <div>
      {/* Selected chips */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedLabels.map(({ id, label, diseaseName }) => (
            <div key={id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2.5 py-1.5 rounded-lg">
              <span>{diseaseName}: {label}</span>
              <button onClick={() => onRemove(id)} className="hover:text-blue-900">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category accordion */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {CATEGORIES.map(cat => {
          const catDiseases = DISEASES.filter(d => d.category === cat.id)
          const isOpen = openCategory === cat.id
          return (
            <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
              >
                <span className="text-sm font-medium text-slate-700">{cat.label}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="p-2 space-y-1">
                  {catDiseases.map(disease => (
                    <div key={disease.id}>
                      <div className="text-xs font-medium text-slate-500 px-2 py-1">{disease.name}</div>
                      {disease.variants.map(variant => {
                        const isSelected = selectedVariants.includes(variant.id)
                        return (
                          <button
                            key={variant.id}
                            onClick={() => isSelected ? onRemove(variant.id) : onAdd(variant.id)}
                            className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span>{variant.label}</span>
                            {isSelected
                              ? <CheckCircle size={13} className="text-blue-600" />
                              : <Plus size={13} className="text-slate-400" />
                            }
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResultPanel({ result, form, onPrint, onCopy, copied }) {
  const cap = CAPACITY_META[result.workCapacity]

  const restrictionChartData = [
    { name: 'Kısıtlı', value: result.activeRestrictions.filter(([, v]) => v.value === 'NO').length, color: '#ef4444' },
    { name: 'Değerlendir', value: result.activeRestrictions.filter(([, v]) => v.value === 'EVALUATE').length, color: '#f59e0b' },
    { name: 'Serbest', value: Object.keys(result.restrictions).length - result.activeRestrictions.length, color: '#22c55e' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Print header */}
      <div className="hidden print-only p-4 border-b">
        <strong>OccuBase — Çalışan Değerlendirme Raporu</strong>
        <br />{new Date().toLocaleDateString('tr-TR')}
      </div>

      {/* Header bar */}
      <div className={`${cap.bg} ${cap.border} border-b px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Çalışma Kapasitesi</div>
            <div className={`text-xl font-bold ${cap.text}`}>{cap.label}</div>
          </div>
          <div className="flex gap-2 no-print">
            <button
              onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              <Printer size={14} />
              Yazdır
            </button>
          </div>
        </div>
        {(form.age || form.position) && (
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
            {form.age && <span>Yaş: {form.age}</span>}
            {form.gender && <span>Cinsiyet: {form.gender === 'M' ? 'Erkek' : 'Kadın'}</span>}
            {form.position && <span>Pozisyon: {POSITIONS.find(p => p.id === form.position)?.label}</span>}
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Immediate actions */}
        {result.immediateActions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
              <AlertTriangle size={16} />
              Acil Önlemler Gerekli
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

        {/* Synergies */}
        {result.synergies?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
              <Info size={16} />
              Birden Fazla Hastalık — Ek Dikkat
            </div>
            {result.synergies.map((s, i) => (
              <p key={i} className="text-sm text-amber-800 mb-1">{s}</p>
            ))}
          </div>
        )}

        {/* Restriction chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 text-sm">Kısıt Özeti</h3>
            <div className="flex gap-3 text-xs text-slate-500">
              {restrictionChartData.map(d => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={restrictionChartData} layout="vertical" barSize={20}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(v) => [`${v} alan`, '']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {restrictionChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active restrictions */}
        {result.activeRestrictions.length > 0 && (
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
                        {info.reason && (
                          <p className="text-xs text-slate-500 mt-0.5">{info.reason}</p>
                        )}
                        {info.sources?.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">Kaynak: {info.sources.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {result.activeRestrictions.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 text-center">
            Bu hastalık kombinasyonunda belirli bir çalışma kısıtı tespit edilmedi.
          </div>
        )}

        {/* Periodic exam + tests + referrals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoBlock icon={<Clock size={14} />} title="Periyodik Muayene" items={[`Her ${result.periodicExam} ayda bir`]} />
          <InfoBlock icon={<FlaskConical size={14} />} title="Tetkikler" items={result.labTests} />
          <InfoBlock icon={<UserCheck size={14} />} title="Uzman Sevk" items={result.specialistReferrals} />
        </div>

        {/* Notes */}
        {result.notes?.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Notlar</h3>
            {result.notes.map((note, i) => (
              <p key={i} className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 mb-2">{note}</p>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          Bu değerlendirme klinik karar destek amacı taşır. Nihai uygunluk kararı iş yeri hekimince bireysel olarak verilmelidir.
          OccuBase hasta verisi saklamaz.
        </p>
      </div>
    </div>
  )
}

function InfoBlock({ icon, title, items }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs mb-2">
        {icon}{title}
      </div>
      <ul className="space-y-1">
        {items?.map((item, i) => (
          <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
            <span className="text-slate-400 mt-0.5">•</span>{item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
      <ClipboardList size={40} className="mx-auto text-slate-300 mb-4" />
      <h3 className="font-medium text-slate-500 mb-2">Değerlendirme Hazır</h3>
      <p className="text-sm text-slate-400 max-w-xs mx-auto">
        Sol taraftan hastalık/durumu ekleyin ve "Değerlendir" butonuna basın.
      </p>
    </div>
  )
}

