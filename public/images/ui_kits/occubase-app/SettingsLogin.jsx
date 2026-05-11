/* eslint-disable */
function Settings() {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="page">
      <PageHeader title="Ayarlar" subtitle="Uygulama yapılandırması ve hesap"/>

      <Card>
        <div className="settings-head">
          <div className="settings-ico"><Icon name="key" size={16}/></div>
          <div>
            <h3>AI API Anahtarı</h3>
            <p className="meta">Groq API anahtarı sistem yöneticisi tarafından yapılandırılmış. AI özellikleri aktif.</p>
          </div>
          <Badge tone="ok" icon="check">Aktif</Badge>
        </div>
      </Card>

      <Card>
        <div className="settings-head">
          <div className="settings-ico"><Icon name="lock" size={16}/></div>
          <h3>Şifre değiştir</h3>
        </div>
        <div className="pw-form">
          <Field label="Mevcut şifre">
            <div className="pw-input">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={pw.current} onChange={e => setPw(p => ({...p, current: e.target.value}))}/>
              <button className="pw-toggle" onClick={() => setShowPw(s => !s)} aria-label="Toggle"><Icon name={showPw ? 'eyeOff' : 'eye'} size={14}/></button>
            </div>
          </Field>
          <Field label="Yeni şifre" hint="En az 6 karakter">
            <div className="pw-input">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={pw.next} onChange={e => setPw(p => ({...p, next: e.target.value}))}/>
            </div>
          </Field>
          <Field label="Yeni şifre (tekrar)">
            <div className="pw-input">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={pw.confirm} onChange={e => setPw(p => ({...p, confirm: e.target.value}))}/>
            </div>
          </Field>
          <Button variant="primary">Şifreyi güncelle</Button>
        </div>
      </Card>

      <Card>
        <div className="settings-head">
          <div className="settings-ico"><Icon name="moon" size={16}/></div>
          <h3>Görünüm</h3>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-name">Açık tema</div>
            <div className="meta">Sistem ayarına göre otomatik geçiş yakında.</div>
          </div>
          <span className="toggle on"><span className="toggle-dot"/></span>
        </div>
      </Card>
    </div>
  );
}

function Login({ onLogin }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  return (
    <div className="login-screen">
      <div className="login-bg"/>
      <div className="login-card">
        <img src="../../assets/logo-mark.svg" width="56" height="56" alt=""/>
        <h1 className="login-title">OccuBase</h1>
        <p className="login-sub">İş yeri hekimliği değerlendirme sistemi</p>
        <Card className="login-form">
          <h3 style={{marginBottom: 16}}>Giriş yap</h3>
          <Field label="Erişim şifresi">
            <div className="pw-input">
              <input type={show ? 'text' : 'password'} placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)}/>
              <button className="pw-toggle" onClick={() => setShow(s => !s)} aria-label="Toggle"><Icon name={show ? 'eyeOff' : 'eye'} size={14}/></button>
            </div>
          </Field>
          <Button variant="primary" onClick={onLogin} className="login-btn">Giriş yap</Button>
        </Card>
        <div className="login-disclaim">
          <Icon name="alert" size={13}/>
          <div>
            <strong>Yasal sorumluluk reddi.</strong> OccuBase klinik karar destek aracıdır. Sunulan bilgiler bağlayıcı tıbbi tavsiye değildir.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Settings, Login });
