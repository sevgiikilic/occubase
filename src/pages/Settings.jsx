import { useState } from 'react'
import { Key, Save, Eye, EyeOff, Trash2, CheckCircle } from 'lucide-react'
import { AI_KEY_STORAGE } from '../utils/ai'

export default function Settings() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(AI_KEY_STORAGE) || '')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasSaved = !!localStorage.getItem(AI_KEY_STORAGE)

  function handleSave() {
    if (apiKey.trim()) {
      localStorage.setItem(AI_KEY_STORAGE, apiKey.trim())
    } else {
      localStorage.removeItem(AI_KEY_STORAGE)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClear() {
    localStorage.removeItem(AI_KEY_STORAGE)
    setApiKey('')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500 mt-1">Uygulama tercihleri ve API yapılandırması</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Key size={18} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">Claude AI API Anahtarı</h2>
          {hasSaved && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Kayıtlı</span>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Serbest metin analizi için Anthropic API anahtarınızı girin.
          Anahtar yalnızca tarayıcınızda saklanır, sunucuya gönderilmez.
        </p>

        <div className="relative mb-3">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
          {hasSaved && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 size={15} />
              Sil
            </button>
          )}
        </div>

        <div className="mt-4 bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            API anahtarı almak için{' '}
            <span className="font-mono text-blue-600">console.anthropic.com</span>{' '}
            adresini ziyaret edin. Bu özellik isteğe bağlıdır; API anahtarı olmadan
            kural tabanlı değerlendirme tam olarak çalışır.
          </p>
        </div>
      </div>
    </div>
  )
}
