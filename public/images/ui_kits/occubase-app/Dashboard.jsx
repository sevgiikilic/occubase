/* eslint-disable */
function Dashboard({ onNav }) {
  const totalScenarios = DISEASES_DATA.reduce((acc, d) => acc + d.variants.length, 0);
  return (
    <div className="page">
      <PageHeader
        title="Genel Bakış"
        subtitle="İş yeri hekimliği değerlendirme ve başvuru sistemi"
        actions={<>
          <Button variant="secondary" icon="print">Rapor</Button>
          <Button variant="primary" icon="plus" onClick={() => onNav('assessment')}>Yeni değerlendirme</Button>
        </>}
      />

      <section className="stat-row">
        <StatCard label="Hastalık Grubu" value={DISEASES_DATA.length} sub={`${totalScenarios} klinik senaryo`} icon="book"/>
        <StatCard label="Kısıt Kategorisi" value="14" sub="İş ortamı faktörü" icon="filter"/>
        <StatCard label="Çalışabilirlik" value="4" sub="Tam → Kalıcı uygun değil" icon="activity"/>
        <BrandCard onClick={() => onNav('assessment')}/>
      </section>

      <section className="grid-2">
        <Card>
          <div className="card-head">
            <h3>Kütüphane Kapsamı</h3>
            <Badge tone="neutral">8 kategori</Badge>
          </div>
          <CoverageBars/>
        </Card>
        <Card>
          <div className="card-head">
            <h3>Son Değerlendirmeler</h3>
            <button className="link-btn">Tümünü gör <Icon name="arrowRight" size={12}/></button>
          </div>
          <RecentList/>
        </Card>
      </section>

      <section>
        <Card>
          <div className="card-head">
            <h3>Hastalık Kategorileri</h3>
            <span className="meta">Kategoriye tıkla, kütüphaneye git</span>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map(cat => {
              const count = DISEASES_DATA.filter(d => d.category === cat.id).length;
              return (
                <button key={cat.id} className="cat-tile" onClick={() => onNav('library', cat.id)}>
                  <div className="cat-tile-ico" style={{ background: cat.color + '18', color: cat.color }}>
                    <Icon name={cat.icon} size={20}/>
                  </div>
                  <div className="cat-tile-label">{cat.label}</div>
                  <div className="cat-tile-meta">{count} hastalık</div>
                </button>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, icon }) {
  return (
    <Card className="stat-card">
      <div className="stat-row-head">
        <div className="eyebrow">{label}</div>
        <div className="stat-ico"><Icon name={icon} size={16}/></div>
      </div>
      <div className="stat-val">{value}</div>
      <div className="stat-sub">{sub}</div>
    </Card>
  );
}

function BrandCard({ onClick }) {
  return (
    <button className="brand-card" onClick={onClick}>
      <div className="brand-card-ico"><Icon name="sparkle" size={18}/></div>
      <div className="brand-card-title">Hızlı değerlendirme</div>
      <div className="brand-card-sub">Tanı + iş koşulu → kombine rapor</div>
      <Icon name="arrowRight" size={16} className="brand-card-arrow"/>
    </button>
  );
}

function CoverageBars() {
  const data = CATEGORIES.map(cat => ({
    ...cat,
    count: DISEASES_DATA.filter(d => d.category === cat.id).length || 0,
    cap: [3, 4, 5, 4, 3, 3, 5, 4][CATEGORIES.indexOf(cat)],
  }));
  const max = Math.max(...data.map(d => d.cap));
  return (
    <div className="bar-list">
      {data.map(d => (
        <div key={d.id} className="bar-row">
          <div className="bar-row-label" style={{ color: d.color }}>{d.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: (d.count / max * 100) + '%', background: d.color }}/>
          </div>
          <div className="bar-row-value">{d.count || '—'}</div>
        </div>
      ))}
    </div>
  );
}

function RecentList() {
  const items = [
    { id: 1, name: 'Çalışan #41872', dx: 'HT + DM kontrolsüz', tone: 'risk', cap: 'Kısıtla Uygun', date: 'Bugün, 14:22' },
    { id: 2, name: 'Çalışan #41869', dx: 'Hipertansiyon evre 1', tone: 'warn', cap: 'Tam Uygun', date: 'Bugün, 11:08' },
    { id: 3, name: 'Çalışan #41865', dx: 'KOAH GOLD 2', tone: 'warn', cap: 'Kısıtla Uygun', date: 'Dün, 16:44' },
    { id: 4, name: 'Çalışan #41861', dx: 'Sağlıklı', tone: 'ok', cap: 'Tam Uygun', date: 'Dün, 09:30' },
  ];
  return (
    <div className="recent-list">
      {items.map(it => (
        <div key={it.id} className="recent-row">
          <StatusDot tone={it.tone}/>
          <div className="recent-meta">
            <div className="recent-name">{it.name}</div>
            <div className="recent-dx">{it.dx}</div>
          </div>
          <div className="recent-cap">{it.cap}</div>
          <div className="recent-date">{it.date}</div>
        </div>
      ))}
    </div>
  );
}

window.Dashboard = Dashboard;
