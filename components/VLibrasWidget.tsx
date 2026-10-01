'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
  }
}

declare module 'react' {
  // O parametro precisa manter o mesmo nome da declaracao original do React.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    vw?: string;
    'vw-access-button'?: string;
    'vw-plugin-wrapper'?: string;
  }
}

export default function VLibrasWidget() {
  useEffect(() => {
    const initializeWidget = () => {
      if (!window.VLibras || document.documentElement.dataset.vlibrasInitialized === 'true') return;
      new window.VLibras.Widget('https://vlibras.gov.br/app');
      document.documentElement.dataset.vlibrasInitialized = 'true';
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-vlibras-script]');
    if (existingScript) {
      if (window.VLibras) initializeWidget();
      else existingScript.addEventListener('load', initializeWidget, { once: true });
      return () => existingScript.removeEventListener('load', initializeWidget);
    }

    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    script.dataset.vlibrasScript = 'true';
    script.addEventListener('load', initializeWidget, { once: true });
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', initializeWidget);
    };
  }, []);

  return (
    <div vw="true" className="enabled">
      <div vw-access-button="true" className="active"></div>
      <div vw-plugin-wrapper="true">
        <div className="vw-plugin-top-wrapper"></div>
      </div>
    </div>
  );
}
