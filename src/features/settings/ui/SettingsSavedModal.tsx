import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

type SettingsSavedModalProps = {
  onClose: () => void;
};

export function SettingsSavedModal({ onClose }: SettingsSavedModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="settings-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-saved-title">
        <button type="button" className="settings-modal__close" onClick={onClose} aria-label="Закрыть окно">
          <X size={18} />
        </button>
        <div className="settings-modal__icon" aria-hidden="true">
          <Check size={28} strokeWidth={2.5} />
        </div>
        <h2 id="settings-saved-title">Настройки сохранены</h2>
        <p>Новые параметры применены к интерфейсу и сохранены для вашей учётной записи.</p>
        <button ref={closeButtonRef} type="button" className="settings-modal__button" onClick={onClose}>
          Продолжить
        </button>
      </section>
    </div>
  );
}
