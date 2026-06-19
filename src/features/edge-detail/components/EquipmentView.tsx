import { useState } from 'react';
import { ToirLightIframe } from '../../../components/ToirLightIframe';

const ACTIVE_EQUIPMENT_PATH =
  '/equipment?filter=%7B%22status%22%3A%5B%22Active%22%5D%7D&displayedFilters=%7B%22status%22%3Atrue%7D';

export function EquipmentView() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <section className="equipment-section" aria-label="Активное оборудование">
      <div className="equipment-frame-shell" aria-busy={!iframeLoaded}>
        {!iframeLoaded ? (
          <div className="equipment-frame-loading" role="status" aria-live="polite">
            <span className="equipment-frame-loading__ring" aria-hidden />
            <span>Загрузка интерфейса управления оборудованием...</span>
          </div>
        ) : null}

        <ToirLightIframe
          className="equipment-frame"
          path={ACTIVE_EQUIPMENT_PATH}
          title="ТОиР light: управление активным оборудованием"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </section>
  );
}
