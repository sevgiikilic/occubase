/* eslint-disable */
// Shared primitive components for the OccuBase kit

const cx = (...xs) => xs.filter(Boolean).join(' ');

function Button({ variant='primary', size='md', icon, children, onClick, className='', type='button' }) {
  const v = {
    primary:   'btn btn-primary',
    secondary: 'btn btn-secondary',
    ghost:     'btn btn-ghost',
    danger:    'btn btn-danger',
  }[variant];
  const s = size === 'sm' ? 'btn-sm' : '';
  return (
    <button type={type} onClick={onClick} className={cx(v, s, className)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16}/>}
      {children}
    </button>
  );
}

function IconButton({ icon, label, onClick, variant='ghost' }) {
  return (
    <button className={cx('icon-btn', variant)} onClick={onClick} aria-label={label}>
      <Icon name={icon} size={16}/>
    </button>
  );
}

function Card({ children, className='', tone='surface' }) {
  return <div className={cx('card', `card-${tone}`, className)}>{children}</div>;
}

function Badge({ children, tone='neutral', icon, mono=false }) {
  return (
    <span className={cx('badge', `badge-${tone}`, mono && 'badge-mono')}>
      {icon && <Icon name={icon} size={12}/>}
      {children}
    </span>
  );
}

function CapacityChip({ capacity }) {
  const meta = CAPACITY[capacity];
  return (
    <span className={cx('capacity-chip', `tone-${meta.tone}`)}>
      <span className="capacity-letter">{meta.short}</span>
      {meta.label}
    </span>
  );
}

function StatusDot({ tone }) {
  return <span className={cx('status-dot', `dot-${tone}`)} />;
}

function Field({ label, hint, children }) {
  return (
    <div className="field-wrap">
      <label>{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function Input({ icon, ...props }) {
  return (
    <div className={cx('input-wrap', icon && 'has-icon')}>
      {icon && <Icon name={icon} size={14} className="input-icon"/>}
      <input {...props}/>
    </div>
  );
}

function Select({ children, ...props }) {
  return (
    <div className="select-wrap">
      <select {...props}>{children}</select>
      <Icon name="chevDown" size={14} className="select-arrow"/>
    </div>
  );
}

function SegControl({ options, value, onChange }) {
  return (
    <div className="seg-control">
      {options.map(o => (
        <button key={o.id}
          onClick={() => onChange(o.id === value ? '' : o.id)}
          className={cx('seg-item', o.id === value && 'seg-active', o.tone && `seg-${o.tone}`)}>
          <span>{o.label}</span>
          {o.sub && <span className="seg-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon='search', title, body }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={22}/></div>
      <div className="empty-title">{title}</div>
      <div className="empty-body">{body}</div>
    </div>
  );
}

Object.assign(window, { cx, Button, IconButton, Card, Badge, CapacityChip, StatusDot, Field, Input, Select, SegControl, EmptyState });
