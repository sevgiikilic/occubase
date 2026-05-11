/* eslint-disable */
function Assessment() {
  const [form, setForm] = useState({ age: '42', gender: 'M', position: '', hazard: 'medium', meds: '' });
  const [selected, setSelected] = useState(['HT-1', 'DM-1']);
  const [picker, setPicker] = useState(false);
  const [result, setResult] = useState(null);

  function evaluate() {
    const variants = selected.map(id => {
      for (const d of DISEASES_DATA) {
        const v = d.variants.find(v => v.id === id);
        if (v) return { ...v, _disease: d };
      }
      return null;
    }).filter(Boolean);

    // Merge capacity
    const priority = { FULL: 0, RESTRICTED: 1, TEMP_UNFIT: 2, PERMANENT_UNFIT: 3 };
    const cap = variants.reduce((a, v) => priority[v.capacity] > priority[a] ? v.capacity : a, 'FULL');

    // Merge restrictions
    const rPrio = { YES: 0, EVALUATE: 1, NO: 2 };
    const restrictions = {};
    for (const v of variants) {
      for (const [k, val] of Object.entries(v.restrictions || {})) {
        if (!restrictions[k] || rPrio[val] > rPrio[restrictions[k]]) restrictions[k] = val;
      }
    }

    const periodic = Math.min(...variants.map(v => v.periodic));
    const tests = [...new Set(variants.flatMap(v => v.tests || []))];
    const followUp = [...new Set(variants.flatMap(v => v.followUp || []))];
    const immediate = [...new Set(variants.flatMap(v => v.immediate || []))];

    setResult({ cap, restrictions, periodic, tests, followUp, immediate, variants });
  }

  const selectedInfo = selected.map(id => {
    for (const d of DISEASES_DATA) {
      const v = d.variants.find(v => v.id === id);
      if (v) return { id, label: `${d.name} — ${v.label}`, icd10: d.icd10 };
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="page">
      <PageHeader
        title="Çalışan Değerlendirmesi"
        subtitle="Tanı + iş koşulu → kombine kısıt raporu"
        actions={result && <>
          <Button variant="secondary" icon="copy">Rapor kopyala</Button>
          <Button variant="primary" icon="print">PDF</Button>
        </>}
      />

      <div className="assess-grid">
        {/* ── Form ── */}
        <div className="assess-form">
          <Card>
            <h3 className="block-title">Temel bilgiler</h3>
            <div className="grid-2">
              <Field label="Yaş">
                <Input type="number" value={form.age} onChange={e => setForm(f => ({...f, age: e.target.value}))}/>
              </Field>
              <Field label="Cinsiyet">
                <Select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                  <option value="">Seçin</option>
                  <option value="M">Erkek</option>
                  <option value="F">Kadın</option>
                </Select>
              </Field>
            </div>
            <Field label="Çalışma pozisyonu">
              <Select value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))}>
                <option value="">Pozisyon seçin</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Tehlike sınıfı" hint="Yasal periyodik muayene aralığını belirler">
              <SegControl
                value={form.hazard}
                onChange={(v) => setForm(f => ({...f, hazard: v}))}
                options={HAZARD_CLASSES.map(h => ({
                  id: h.id, label: h.label, sub: h.legal,
                  tone: h.id === 'low' ? 'ok' : h.id === 'medium' ? 'warn' : 'risk'
                }))}
              />
            </Field>
          </Card>

          <Card>
            <div className="block-title-row">
              <h3 className="block-title">Tanılar</h3>
              <Button variant="ghost" size="sm" icon="plus" onClick={() => setPicker(p => !p)}>
                Tanı ekle
              </Button>
            </div>

            {picker && (
              <div className="picker">
                {DISEASES_DATA.flatMap(d => d.variants.map(v => ({d, v})))
                  .filter(({v}) => !selected.includes(v.id))
                  .map(({d, v}) => (
                    <button key={v.id} className="picker-item" onClick={() => {
                      setSelected(s => [...s, v.id]); setPicker(false);
                    }}>
                      <Badge tone="neutral" mono>{d.icd10}</Badge>
                      <span className="picker-name">{d.name} — {v.label}</span>
                      <Icon name="plus" size={13}/>
                    </button>
                  ))}
              </div>
            )}

            {selectedInfo.length === 0 ? (
              <div className="muted-empty">Henüz tanı eklenmedi.</div>
            ) : (
              <div className="dx-list">
                {selectedInfo.map(s => (
                  <div key={s.id} className="dx-row">
                    <Badge tone="neutral" mono>{s.icd10}</Badge>
                    <span className="dx-label">{s.label}</span>
                    <button className="dx-remove" onClick={() => setSelected(sel => sel.filter(x => x !== s.id))} aria-label="Kaldır">
                      <Icon name="x" size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="block-title">İlaç notları <span className="opt-tag">opsiyonel</span></h3>
            <textarea className="textarea" rows="3" placeholder="ör. Metformin 1000 mg 2x1, Amlodipin 10 mg..."
                      value={form.meds} onChange={e => setForm(f => ({...f, meds: e.target.value}))}/>
          </Card>

          <Button variant="primary" icon="sparkle" onClick={evaluate} className="evaluate-btn">
            Değerlendir
          </Button>
        </div>

        {/* ── Result ── */}
        <div className="assess-result">
          {!result ? (
            <Card className="result-empty">
              <div className="result-empty-ico"><Icon name="clipboard" size={26}/></div>
              <h3>Henüz değerlendirme yok</h3>
              <p>Tanı ve iş koşullarını girip <strong>Değerlendir</strong>'e basın.</p>
            </Card>
          ) : (
            <ResultPanel result={result} hazard={HAZARD_CLASSES.find(h => h.id === form.hazard)}/>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, hazard }) {
  const capMeta = CAPACITY[result.cap];
  const effectivePeriodic = hazard ? Math.min(hazard.months, result.periodic) : result.periodic;
  const periodicLimited = hazard && hazard.months < result.periodic;

  return (
    <>
      <Card className={cx('result-hero', `tone-${capMeta.tone}`)}>
        <div className="result-hero-left">
          <div className="eyebrow">Çalışma kapasitesi</div>
          <div className="result-cap">{capMeta.label}</div>
          <div className="result-cap-sub">{result.variants.length} tanı birleştirildi</div>
        </div>
        <div className="result-letter">{capMeta.short}</div>
      </Card>

      <Card>
        <h3 className="block-title">Kısıtlar</h3>
        <div className="restr-grid">
          {Object.entries(result.restrictions).map(([k, v]) => {
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
      </Card>

      <div className="grid-2">
        <Card>
          <div className="card-head">
            <h3>Periyodik muayene</h3>
            <Icon name="clock" size={16}/>
          </div>
          <div className="periodic-big">Her {effectivePeriodic} ay</div>
          <div className="periodic-sub">
            {periodicLimited
              ? `Yasal sınır (${hazard.label}: ${hazard.legal}) hastalık takibinden daha sıkı.`
              : 'Hastalık takibine göre belirlendi.'}
          </div>
        </Card>
        <Card>
          <div className="card-head">
            <h3>Tetkikler</h3>
            <Icon name="flask" size={16}/>
          </div>
          <ul className="check-list">
            {result.tests.map((t,i) => <li key={i}><Icon name="check" size={12}/> {t}</li>)}
          </ul>
        </Card>
      </div>

      {result.immediate.length > 0 && (
        <Card className="alert-card">
          <div className="alert-card-head">
            <Icon name="alertTri" size={14}/>
            <h3>Acil önlemler</h3>
          </div>
          <ul>
            {result.immediate.map((a,i) => <li key={i}>{a}</li>)}
          </ul>
        </Card>
      )}

      <Card>
        <div className="card-head">
          <h3>Uzman takip</h3>
          <Icon name="steth" size={16}/>
        </div>
        <div className="tag-row">
          {result.followUp.map((f,i) => <Badge key={i} tone="brand">{f}</Badge>)}
        </div>
      </Card>
    </>
  );
}

window.Assessment = Assessment;
