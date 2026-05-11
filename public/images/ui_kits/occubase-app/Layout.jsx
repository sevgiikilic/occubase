/* eslint-disable */
function Sidebar({ active, onNav, onLogout, email }) {
  const items = [
    { id: 'dashboard', label: 'Genel Bakış', icon: 'dashboard' },
    { id: 'library',   label: 'Hastalık Kütüphanesi', icon: 'book' },
    { id: 'assessment',label: 'Değerlendirme', icon: 'clipboard' },
    { id: 'settings',  label: 'Ayarlar', icon: 'settings' },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="../../assets/logo-mark.svg" width="38" height="38" alt=""/>
        <div className="brand-text">
          <div className="brand-name">OccuBase</div>
          <div className="brand-sub">İş yeri hekimliği</div>
        </div>
      </div>
      <nav className="nav">
        {items.map(it => (
          <button key={it.id} onClick={() => onNav(it.id)}
                  className={cx('nav-item', active === it.id && 'nav-active')}>
            <Icon name={it.icon} size={17}/>
            <span>{it.label}</span>
            {active === it.id && <span className="nav-dot"/>}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="session">
          <div className="avatar"><Icon name="user" size={15}/></div>
          <div className="session-meta">
            <div className="session-label">Oturum</div>
            <div className="session-email">{email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <Icon name="logout" size={15}/> Çıkış yap
        </button>
      </div>
    </aside>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

Object.assign(window, { Sidebar, PageHeader });
