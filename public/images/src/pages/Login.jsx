import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../utils/auth'
import { Stethoscope, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const result = login('user@occubase', password)
      if (result.ok) {
        navigate('/dashboard')
      } else {
        setError('Şifre hatalı.')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Stethoscope size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">OccuBase</h1>
          <p className="text-slate-500 mt-1">İş Yeri Hekimliği Değerlendirme Sistemi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Giriş Yap</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Erişim Şifresi
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-800 font-semibold mb-1">Yasal Sorumluluk Reddi</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            OccuBase yalnızca iş yeri hekimleri için klinik karar destek aracıdır.
            Sunulan bilgiler genel rehber niteliğinde olup <strong>bağlayıcı tıbbi tavsiye değildir</strong>.
            Nihai çalışabilirlik kararı, bireysel muayene bulgularına dayanarak iş yeri hekimi tarafından verilmelidir.
            Sistem hasta verisi saklamaz; tüm değerlendirmeler oturum süresince geçerlidir.
          </p>
        </div>
      </div>
    </div>
  )
}
