import { useNavigate } from 'react-router-dom'
import { DISEASES, CATEGORIES } from '../data/diseases'
import { BookOpen, ClipboardList, ArrowRight, Heart, Activity, Wind, Brain, Droplets, Bone, Star, AlertCircle } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const ICON_MAP = { Heart, Activity, Wind, Brain, Droplets, Bone, Star, AlertCircle }

const CAT_COLORS = {
  cardiovascular: '#ef4444',
  metabolic: '#f59e0b',
  respiratory: '#0ea5e9',
  neurological: '#8b5cf6',
  psychiatric: '#a855f7',
  renal: '#f97316',
  musculoskeletal: '#22c55e',
  special: '#ec4899',
}

export default function Dashboard() {
  const navigate = useNavigate()

  const totalDiseases = DISEASES.reduce((acc, d) => acc + d.variants.length, 0)

  const pieData = CATEGORIES.map(cat => ({
    name: cat.label,
    value: DISEASES.filter(d => d.category === cat.id).length,
    color: CAT_COLORS[cat.id],
  }))

  const radarData = [
    { domain: 'Kardiyovasküler', value: 90 },
    { domain: 'Metabolik', value: 85 },
    { domain: 'Solunum', value: 75 },
    { domain: 'Nörolojik', value: 70 },
    { domain: 'Psikiyatrik', value: 70 },
    { domain: 'Renal/Hepatik', value: 65 },
    { domain: 'Özel', value: 80 },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Genel Bakış</h1>
        <p className="text-slate-500 mt-1">İş yeri hekimliği değerlendirme ve başvuru sistemi</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<BookOpen size={22} className="text-blue-600" />}
          label="Hastalık Grubu"
          value={DISEASES.length}
          sub={`${totalDiseases} farklı klinik senaryo`}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<ClipboardList size={22} className="text-teal-600" />}
          label="Kısıt Kategorisi"
          value="14"
          sub="İş ortamı faktörü"
          bg="bg-teal-50"
        />
        <StatCard
          icon={<AlertCircle size={22} className="text-amber-600" />}
          label="Çalışabilirlik"
          value="4"
          sub="Kapasite kategorisi"
          bg="bg-amber-50"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ActionCard
          title="Hastalık Kütüphanesi"
          desc="Hastalık gruplarına göre çalışma kısıtları, periyodik muayene ve sevk bilgilerini inceleyin."
          icon={<BookOpen size={24} className="text-blue-600" />}
          bg="bg-blue-600"
          onClick={() => navigate('/library')}
        />
        <ActionCard
          title="Çalışan Değerlendirmesi"
          desc="Yaş, hastalık ve çalışma koşullarını girerek kombine risk değerlendirmesi ve kısıt raporu alın."
          icon={<ClipboardList size={24} className="text-teal-600" />}
          bg="bg-teal-600"
          onClick={() => navigate('/assessment')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Kütüphane Kapsam Dağılımı</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name.split('/')[0]} (${value})`} labelLine={false} fontSize={11}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} hastalık`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Kapsam Profili</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Hastalık Kategorileri</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = ICON_MAP[cat.icon] || Heart
            const count = DISEASES.filter(d => d.category === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => navigate('/library', { state: { category: cat.id } })}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: CAT_COLORS[cat.id] + '20' }}>
                  <Icon size={20} style={{ color: CAT_COLORS[cat.id] }} />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-700 leading-tight">{cat.label}</div>
                  <div className="text-xs text-slate-400">{count} hastalık</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-white`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-600 mb-1">{label}</div>
          <div className="text-3xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500 mt-1">{sub}</div>
        </div>
        <div className="bg-white rounded-xl p-2.5 shadow-sm">{icon}</div>
      </div>
    </div>
  )
}

function ActionCard({ title, desc, icon, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-6 text-left hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="bg-slate-50 rounded-xl p-3">{icon}</div>
        <ArrowRight size={18} className="text-slate-400 group-hover:text-slate-600 mt-1 transition-colors" />
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </button>
  )
}
