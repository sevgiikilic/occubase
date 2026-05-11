/* eslint-disable */
// Sample disease data — modernized excerpts from the OccuBase domain
const DISEASES_DATA = [
  {
    id: 'HT', name: 'Hipertansiyon', icd10: 'I10',
    description: 'Arteriyel kan basıncı yüksekliği',
    category: 'cardiovascular',
    variants: [
      { id: 'HT-1', label: 'Evre 1 · Kontrollü', criteria: '130–139/85–89 mmHg, ilaçla regüle',
        capacity: 'FULL', periodic: 12,
        restrictions: { 'Ağır fiziksel iş': 'EVALUATE', 'Vardiya': 'YES', 'Yükseklik': 'YES', 'Stresli pozisyon': 'EVALUATE' },
        tests: ['TA · iş başı ve iş sonu', 'EKG · yıllık'],
        followUp: ['Kardiyoloji · 6 ayda bir'],
      },
      { id: 'HT-2', label: 'Evre 2 · Kontrolsüz', criteria: '>160/100 mmHg veya hedef organ hasarı',
        capacity: 'RESTRICTED', periodic: 6,
        restrictions: { 'Ağır fiziksel iş': 'NO', 'Vardiya': 'NO', 'Yükseklik': 'NO', 'Stresli pozisyon': 'NO', 'Sürücülük': 'EVALUATE' },
        tests: ['TA · günlük (1 hafta)', 'EKG', 'Göz dibi'],
        followUp: ['Kardiyoloji · 3 ayda bir', 'Nefroloji konsültasyon'],
      },
    ],
  },
  {
    id: 'DM', name: 'Diabetes Mellitus Tip 2', icd10: 'E11',
    description: 'Kronik insülin direnci / yetmezliği',
    category: 'metabolic',
    variants: [
      { id: 'DM-1', label: 'Diyet/OAD ile kontrollü', criteria: 'HbA1c <%7, hipoglisemi yok',
        capacity: 'FULL', periodic: 12,
        restrictions: { 'Yükseklik': 'EVALUATE', 'Tek başına çalışma': 'EVALUATE' },
        tests: ['HbA1c', 'Açlık glukoz', 'Mikroalbümin'],
        followUp: ['Endokrinoloji · 6 ay', 'Göz dibi · yıllık'],
      },
      { id: 'DM-2', label: 'İnsülin tedavisi', criteria: 'Hipoglisemi riski mevcut',
        capacity: 'RESTRICTED', periodic: 6,
        restrictions: { 'Yükseklik': 'NO', 'Sürücülük': 'EVALUATE', 'Tek başına çalışma': 'NO', 'Vardiya': 'EVALUATE' },
        tests: ['HbA1c · 3 ay', 'Glukoz takip'],
        followUp: ['Endokrinoloji · 3 ay'],
      },
    ],
  },
  {
    id: 'KAH', name: 'Koroner Arter Hastalığı', icd10: 'I25',
    description: 'Aterosklerotik kalp hastalığı',
    category: 'cardiovascular',
    variants: [
      { id: 'KAH-1', label: 'Stabil angina · revaskülarize', criteria: 'PCI/CABG sonrası, asemptomatik',
        capacity: 'RESTRICTED', periodic: 6,
        restrictions: { 'Ağır fiziksel iş': 'NO', 'Vardiya': 'NO', 'Stresli pozisyon': 'NO', 'Sıcak ortam': 'EVALUATE' },
        tests: ['EKG', 'Efor testi · yıllık'],
        followUp: ['Kardiyoloji · 3 ay'],
        immediate: ['Anjina nüksünde acil sevk'],
      },
    ],
  },
  {
    id: 'KOAH', name: 'KOAH', icd10: 'J44',
    description: 'Kronik obstrüktif akciğer hastalığı',
    category: 'respiratory',
    variants: [
      { id: 'KOAH-1', label: 'GOLD 1-2 · Hafif-orta', criteria: 'FEV1 ≥50%',
        capacity: 'RESTRICTED', periodic: 12,
        restrictions: { 'Toz/duman maruziyeti': 'NO', 'Kimyasal maruziyet': 'NO', 'Ağır fiziksel iş': 'EVALUATE' },
        tests: ['Spirometri · yıllık', 'SpO2'],
        followUp: ['Göğüs hastalıkları · 6 ay'],
      },
    ],
  },
  {
    id: 'EPILEPSI', name: 'Epilepsi', icd10: 'G40',
    description: 'Tekrarlayan nöbet bozukluğu',
    category: 'neurological',
    variants: [
      { id: 'EP-1', label: 'Kontrollü · 2+ yıl nöbetsiz', criteria: 'Tedavi altında stabil',
        capacity: 'RESTRICTED', periodic: 12,
        restrictions: { 'Yükseklik': 'NO', 'Sürücülük': 'NO', 'Makine/dönen ekipman': 'NO', 'Tek başına çalışma': 'NO', 'Vardiya': 'EVALUATE' },
        tests: ['Nöroloji raporu'],
        followUp: ['Nöroloji · 6 ay'],
      },
    ],
  },
];

const CATEGORIES = [
  { id: 'cardiovascular', label: 'Kardiyovasküler', icon: 'heart', color: 'var(--cat-cardio)' },
  { id: 'metabolic',      label: 'Metabolik',       icon: 'activity', color: 'var(--cat-metabolic)' },
  { id: 'respiratory',    label: 'Solunum',         icon: 'wind',   color: 'var(--cat-resp)' },
  { id: 'neurological',   label: 'Nörolojik',       icon: 'brain',  color: 'var(--cat-neuro)' },
  { id: 'psychiatric',    label: 'Psikiyatrik',     icon: 'star',   color: 'var(--cat-psych)' },
  { id: 'renal',          label: 'Renal/Hepatik',   icon: 'droplet',color: 'var(--cat-renal)' },
  { id: 'musculoskeletal',label: 'Kas-İskelet',     icon: 'bone',   color: 'var(--cat-musc)' },
  { id: 'special',        label: 'Özel Durumlar',   icon: 'alert',  color: 'var(--cat-special)' },
];

const CAPACITY = {
  FULL:        { label: 'Tam Uygun',           tone: 'ok',   short: 'A' },
  RESTRICTED:  { label: 'Kısıtla Uygun',       tone: 'warn', short: 'B' },
  TEMP_UNFIT:  { label: 'Geçici Uygun Değil',  tone: 'risk', short: 'C' },
  PERMANENT_UNFIT: { label: 'Kalıcı Uygun Değil', tone: 'risk', short: 'D' },
};

const RESTRICTION_TONE = {
  YES:      { tone: 'ok',   label: 'Kısıt Yok' },
  EVALUATE: { tone: 'warn', label: 'Değerlendir' },
  NO:       { tone: 'risk', label: 'Kısıtlı' },
};

const HAZARD_CLASSES = [
  { id: 'low',    label: 'Az Tehlikeli',  legal: '5 yılda bir', months: 60 },
  { id: 'medium', label: 'Tehlikeli',     legal: '3 yılda bir', months: 36 },
  { id: 'high',   label: 'Çok Tehlikeli', legal: 'Yılda bir',   months: 12 },
];

const POSITIONS = [
  'Ofis / Masa Başı', 'Hafif Fiziksel', 'Orta Fiziksel (10–25 kg)',
  'Ağır Fiziksel (>25 kg)', 'Sürücü / Araç Operatörü',
  'Yüksekte Çalışma', 'Kimyasal Maruziyet', 'Gece / Vardiyalı Çalışma',
];

Object.assign(window, { DISEASES_DATA, CATEGORIES, CAPACITY, RESTRICTION_TONE, HAZARD_CLASSES, POSITIONS });
