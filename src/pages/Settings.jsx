import { useState } from 'react'
import { Lock, CheckCircle, Eye, EyeOff, Key } from 'lucide-react'
import { changePassword } from '../utils/auth'

export default function Settings() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'ok'|'error', msg }

  function handleSubmit(e) {
    e.preventDefault()
    if (next !== confirm) return setStatus({ type: 'error', msg: 'Yeni şifreler eşleşmiyor.' })
    if (next.length < 6) return setStatus({ type: 'error', msg: 'Yeni şifre en az 6 karakter olmalı.' })
    const result = changePassword(current, next)
    if (result.ok) {
      setStatus({ type: 'ok', msg: 'Şifre başarıyla değiştirildi.' })
      setCurrent(''); setNext(''); setConfirm('')
    } else {
      setStatus({ type: 'error', msg: result.error })
    }
  }

  const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500 mt-1 text-sm">Uygulama yapılandırması</p>
      </div>

      {/* AI key status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Key size={16} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">AI API Anahtarı</h2>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${hasApiKey ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {hasApiKey ? 'Aktif' : 'Tanımlı değil'}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {hasApiKey
            ? 'Groq API anahtarı sistem yöneticisi tarafından yapılandırılmış. AI özellikleri aktif.'
            : 'AI özellikleri (serbest metin analizi, ilaç uyarıları) şu an pasif. Sistem yöneticisine danışın.'}
        </p>
        {!hasApiKey && (
          <p className="text-xs text-slate-400 mt-2">
            Vercel üzerinde <span className="font-mono">VITE_GROQ_API_KEY</span> değişkeni tanımlanarak etkinleştirilebilir.
          </p>
        )}
      </div>

      {/* Password change */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">Şifre Değiştir</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <PasswordField
            label="Mevcut Şifre" value={current}
            onChange={setCurrent} show={showCurrent}
            onToggle={() => setShowCurrent(s => !s)}
          />
          <PasswordField
            label="Yeni Şifre" value={next}
            onChange={setNext} show={showNext}
            onToggle={() => setShowNext(s => !s)}
            placeholder="En az 6 karakter"
          />
          <PasswordField
            label="Yeni Şifre (Tekrar)" value={confirm}
            onChange={setConfirm} show={showNext}
            onToggle={() => setShowNext(s => !s)}
          />

          {status && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
              status.type === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {status.type === 'ok' && <CheckCircle size={15} />}
              {status.msg}
            </div>
          )}

          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Şifreyi Güncelle
          </button>
        </form>
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          placeholder={placeholder || '••••••••'}
          className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}
