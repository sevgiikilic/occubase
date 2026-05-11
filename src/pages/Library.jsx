import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DISEASES, CATEGORIES, RESTRICTION_LABELS } from '../data/diseases'
import { CAPACITY_META, RESTRICTION_META } from '../utils/engine'
import { getCustomDiseases, deleteCustomDisease, isCustomDisease } from '../utils/customDiseases'
import { Search, ChevronDown, ChevronUp, Clock, FlaskConical, Stethoscope, AlertTriangle, FileText, Trash2 } from 'lucide-react'

export default function Library() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(location.state?.category || 'all')
  const [expanded, setExpanded] = useState({})
  const [customDiseases, setCustomDiseases] = useState(() => getCustomDiseases())

  const allDiseases = [...DISEASES, ...customDiseases]

  function handleDeleteCustom(id) {
    if (!window.confirm('Bu AI hastalık profilini silmek istediğinize emin misiniz?')) return
    deleteCustomDisease(id)
    setCustomDiseases(getCustomDiseases())
  }

  const filtered = allDiseases.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.shortName.toLowerCase().includes(search.toLowerCase()) ||
      d.icd10.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  function toggle(key) {
    setExpanded(e => ({ ...e, [key]: !e[key] }))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Hastalık Kütüphanesi</h1>
        <p className="text-slate-500 mt-1">Hastalık gruplarına göre çalışma kısıtları ve öneriler</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hastalık adı veya ICD-10 kodu ara..."
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500 bg-white"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <CategoryTab id="all" label="Tümü" active={activeCategory} onClick={setActiveCategory} count={allDiseases.length} />
        {CATEGORIES.map(cat => (
          <CategoryTab
            key={cat.id}
            id={cat.id}
            label={cat.label}
            active={activeCategory}
            onClick={setActiveCategory}
            count={allDiseases.filter(d => d.category === cat.id).length}
          />
        ))}
      </div>

      {/* Disease list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">Sonuç bulunamadı.</div>
        )}
        {filtered.map(disease => (
          <DiseaseGroup
            key={disease.id}
            disease={disease}
            expanded={expanded}
            onToggle={toggle}
            onDelete={isCustomDisease(disease.id) ? handleDeleteCustom : null}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryTab({ id, label, active, onClick, count }) {
  const isActive = active === id
  return (
    <button
      onClick={() => onClick(id)}
      className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-pulse-600 text-white'
          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label} <span className={`ml-1 text-xs ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>({count})</span>
    </button>
  )
}

function DiseaseGroup({ disease, expanded, onToggle, onDelete }) {
  const isOpen = expanded[disease.id]
  const isAI = isCustomDisease(disease.id)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isAI ? 'border-amber-200' : 'border-slate-200'}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => onToggle(disease.id)}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">{disease.name}</span>
              <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{disease.icd10}</span>
              {isAI && (
                <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  AI Destekli
                </span>
              )}
            </div>
            <span className="text-sm text-slate-500 mt-0.5">{disease.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <span className="text-xs text-slate-400">{disease.variants.length} senaryo</span>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(disease.id) }}
              className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded"
              title="Bu AI profilini sil">
              <Trash2 size={14} />
            </button>
          )}
          {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className={`border-t divide-y ${isAI ? 'border-amber-100 divide-amber-50' : 'border-slate-100 divide-slate-100'}`}>
          {isAI && (
            <div className="px-5 py-2 bg-amber-50 text-[11px] text-amber-700">
              Bu profil AI tarafından oluşturulmuştur. Klinik kullanımdan önce doğrulama önerilir.
            </div>
          )}
          {disease.variants.map(variant => (
            <VariantDetail key={variant.id} variant={variant} disease={disease} />
          ))}
        </div>
      )}
    </div>
  )
}

function VariantDetail({ variant, disease }) {
  const [showAll, setShowAll] = useState(false)
  const cap = CAPACITY_META[variant.workCapacity]

  const activeRestrictions = Object.entries(variant.restrictions || {})
    .filter(([, v]) => v.value !== 'YES')
    .sort((a, b) => {
      const p = { NO: 2, EVALUATE: 1, YES: 0 }
      return p[b[1].value] - p[a[1].value]
    })

  const allRestrictions = Object.entries(variant.restrictions || {})

  const displayRestrictions = showAll ? allRestrictions : activeRestrictions

  return (
    <div className="px-5 py-5">
      {/* Variant header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-medium text-slate-800">{variant.label}</div>
          {variant.criteria && (
            <div className="text-xs text-slate-500 mt-0.5">{variant.criteria}</div>
          )}
        </div>
        <span className={`shrink-0 ml-4 text-xs font-semibold px-3 py-1.5 rounded-full border ${cap.bg} ${cap.text} ${cap.border}`}>
          {cap.label}
        </span>
      </div>

      {variant.capacityNote && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700">
          {variant.capacityNote}
        </div>
      )}

      {/* Immediate actions */}
      {variant.immediateActions?.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
            <AlertTriangle size={14} />
            Acil Önlem
          </div>
          <ul className="space-y-1">
            {variant.immediateActions.map((action, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5">•</span>{action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Restrictions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Çalışma Kısıtları</div>
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-xs text-pulse-600 hover:underline"
          >
            {showAll ? 'Sadece kısıtları göster' : 'Tümünü göster'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayRestrictions.map(([domain, info]) => {
            const meta = RESTRICTION_META[info.value]
            return (
              <div key={domain} className={`${meta.bg} rounded-lg px-3 py-2.5 border border-transparent`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium ${meta.color}`}>
                      {RESTRICTION_LABELS[domain]}
                    </div>
                    {info.reason && (
                      <div className="text-xs text-slate-500 mt-0.5 leading-tight">{info.reason}</div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${meta.color} shrink-0`}>{meta.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom info row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <InfoBlock
          icon={<Clock size={14} />}
          title="Periyodik Muayene"
          items={[`Her ${variant.periodicExam} ayda bir`]}
          color="slate"
        />
        <InfoBlock
          icon={<FlaskConical size={14} />}
          title="İşyeri Tetkikleri"
          subtitle="(İYH yapar)"
          items={variant.workplaceTests}
          color="blue"
        />
        <InfoBlock
          icon={<Stethoscope size={14} />}
          title="Uzman Takip"
          subtitle="(Uzman yapıyor mu?)"
          items={variant.specialistFollowUp}
          color="violet"
        />
      </div>

      {variant.notes && (
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
          <FileText size={13} className="mt-0.5 shrink-0" />
          {variant.notes}
        </div>
      )}
    </div>
  )
}

function InfoBlock({ icon, title, subtitle, items, color = 'slate' }) {
  const styles = {
    slate: { bg: 'bg-slate-50', header: 'text-slate-600', body: 'text-slate-600', dot: 'text-slate-400' },
    blue: { bg: 'bg-pulse-50', header: 'text-pulse-700', body: 'text-pulse-800', dot: 'text-blue-400' },
    violet: { bg: 'bg-violet-50', header: 'text-violet-700', body: 'text-violet-800', dot: 'text-violet-400' },
  }
  const s = styles[color]
  return (
    <div className={`${s.bg} rounded-xl p-3`}>
      <div className={`flex items-center gap-1.5 font-medium text-xs mb-0.5 ${s.header}`}>
        {icon}
        {title}
      </div>
      {subtitle && <div className={`text-xs mb-2 ${s.header} opacity-70`}>{subtitle}</div>}
      {!subtitle && <div className="mb-2" />}
      <ul className="space-y-1">
        {items?.map((item, i) => (
          <li key={i} className={`text-xs flex items-start gap-1 ${s.body}`}>
            <span className={`mt-0.5 ${s.dot}`}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
