/* eslint-disable */
function Library({ initialCategory }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'all');
  const [expanded, setExpanded] = useState({ HT: true });

  const filtered = DISEASES_DATA.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory;
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.icd10.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="page">
      <PageHeader
        title="Hastalık Kütüphanesi"
        subtitle="Hastalık gruplarına göre çalışma kısıtları ve klinik öneriler"
        actions={<Button variant="secondary" icon="sort">Sırala</Button>}
      />

      <div className="lib-toolbar">
        <Input icon="search" placeholder="Hastalık adı veya ICD-10 kodu..." value={search}
               onChange={e => setSearch(e.target.value)}/>
        <Button variant="secondary" icon="filter">{filtered.length} sonuç</Button>
      </div>

      <div className="cat-tabs">
        <CatTab id="all" label="Tümü" active={activeCategory} onClick={setActiveCategory} count={DISEASES_DATA.length}/>
        {CATEGORIES.filter(c => DISEASES_DATA.some(d => d.category === c.id)).map(cat => (
          <CatTab key={cat.id} id={cat.id} label={cat.label} icon={cat.icon} color={cat.color}
                  active={activeCategory} onClick={setActiveCategory}
                  count={DISEASES_DATA.filter(d => d.category === cat.id).length}/>
        ))}
      </div>

      <div className="disease-list">
        {filtered.map(d => (
          <DiseaseRow key={d.id} disease={d} open={expanded[d.id]} onToggle={() => setExpanded(e => ({...e, [d.id]: !e[d.id]}))}/>
        ))}
      </div>
    </div>
  );
}

function CatTab({ id, label, icon, color, active, onClick, count }) {
  const isActive = active === id;
  return (
    <button onClick={() => onClick(id)} className={cx('cat-tab', isActive && 'cat-tab-active')}>
      {icon && <Icon name={icon} size={13}/>}
      <span>{label}</span>
      <span className="cat-tab-count">{count}</span>
    </button>
  );
}

function DiseaseRow({ disease, open, onToggle }) {
  const cat = CATEGORIES.find(c => c.id === disease.category);
  return (
    <Card className={cx('disease-card', open && 'is-open')}>
      <button className="disease-head" onClick={onToggle}>
        <div className="disease-head-left">
          <div className="disease-ico" style={{ background: cat.color + '18', color: cat.color }}>
            <Icon name={cat.icon} size={16}/>
          </div>
          <div>
            <div className="disease-title-row">
              <span className="disease-title">{disease.name}</span>
              <Badge tone="neutral" mono>{disease.icd10}</Badge>
            </div>
            <div className="disease-desc">{disease.description}</div>
          </div>
        </div>
        <div className="disease-head-right">
          <span className="disease-count">{disease.variants.length} senaryo</span>
          <Icon name={open ? 'chevUp' : 'chevDown'} size={16}/>
        </div>
      </button>

      {open && (
        <div className="variants">
          {disease.variants.map(v => <VariantBlock key={v.id} variant={v}/>)}
        </div>
      )}
    </Card>
  );
}

function VariantBlock({ variant }) {
  const restrEntries = Object.entries(variant.restrictions || {});
  return (
    <div className="variant">
      <div className="variant-head">
        <div>
          <div className="variant-label">{variant.label}</div>
          <div className="variant-criteria">{variant.criteria}</div>
        </div>
        <CapacityChip capacity={variant.capacity}/>
      </div>

      {variant.immediate?.length > 0 && (
        <div className="alert-box">
          <Icon name="alertTri" size={14}/>
          <div>
            <div className="alert-title">Acil önlem</div>
            {variant.immediate.map((a,i) => <div key={i} className="alert-item">{a}</div>)}
          </div>
        </div>
      )}

      <div className="restr-grid">
        {restrEntries.map(([k, v]) => {
          const meta = RESTRICTION_TONE[v];
          return (
            <div key={k} className={cx('restr-cell', `tone-${meta.tone}`)}>
              <StatusDot tone={meta.tone}/>
              <span className="restr-label">{k}</span>
              <span className="restr-value">{meta.label}</span>
            </div>
          );
        })}
      </div>

      <div className="info-row">
        <InfoBlock icon="clock" title="Periyodik muayene" items={[`Her ${variant.periodic} ayda bir`]} tone="neutral"/>
        <InfoBlock icon="flask" title="İşyeri tetkikleri" items={variant.tests} tone="info"/>
        <InfoBlock icon="steth" title="Uzman takip" items={variant.followUp} tone="brand"/>
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, items, tone }) {
  return (
    <div className={cx('info-block', `info-${tone}`)}>
      <div className="info-head">
        <Icon name={icon} size={13}/>
        <span>{title}</span>
      </div>
      <ul>
        {items?.map((it,i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

window.Library = Library;
