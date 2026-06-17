type StatusPillProps = {
  state: 'ok' | 'warn' | 'error' | 'muted';
  label: string;
};

/** Отображает компактный статусный бейдж с цветовой семантикой. */
export function StatusPill({ state, label }: StatusPillProps) {
  return <span className={`status-pill status-pill--${state}`}>{label}</span>;
}
