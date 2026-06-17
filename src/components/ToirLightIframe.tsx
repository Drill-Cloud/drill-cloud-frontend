import { useCallback, useEffect, useMemo, useRef } from 'react';
import { buildToirLightUrl, getToirLightPostMessageTarget } from '../integrations/toir';

type ToirLightIframeProps = {
  path: string;
  title: string;
  className?: string;
  onLoad?: () => void;
};

/** Встраивает TOиР light в iframe и синхронизирует с ним темную тему приложения. */
export function ToirLightIframe({ path, title, className, onLoad }: ToirLightIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const src = useMemo(() => buildToirLightUrl(path, 'dark'), [path]);
  const targetOrigin = useMemo(() => getToirLightPostMessageTarget(), []);

  /** Отправляет тему в iframe после загрузки и при пересоздании URL. */
  const sendTheme = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'greact-theme', theme: 'dark' }, targetOrigin);
  }, [targetOrigin]);

  useEffect(() => {
    sendTheme();
  }, [sendTheme, src]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={() => {
        sendTheme();
        onLoad?.();
      }}
    />
  );
}
