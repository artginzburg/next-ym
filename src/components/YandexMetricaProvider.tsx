'use client';
import Script, { ScriptProps } from 'next/script';
import { createContext, FC, ReactNode, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { standardYMInitParameters } from '../constants/defaults';
import { useTrackRouteChange } from '../hooks/useTrackRouteChange';
import { InitParameters } from '../lib/types/parameters';
import { MetricaPixel } from './MetricaPixel';

export const MetricaTagIDContext = createContext<number | null>(null);
export const MetricaEcommerceContext = createContext<string | null>(null);

export interface YandexMetricaProviderProps {
  children: ReactNode;
  /** Can be omitted if `NEXT_PUBLIC_YANDEX_METRICA_ID` is specified in the environment variables (which is recommended) */
  tagID?: number;
  /**
   * You can, but you should not need an alternative strategy. As the docs say: "Some examples of scripts that are good candidates for afterInteractive include: - Tag managers; - Analytics" (https://nextjs.org/docs/app/api-reference/components/script#afterinteractive)
   * @default 'afterInteractive'
   */
  strategy?: ScriptProps['strategy'];
  /** Tip: You can import {@link standardYMInitParameters `standardYMInitParameters`} from next-ym.  */
  initParameters?: InitParameters;
  shouldUseAlternativeCDN?: boolean;
  experimental?: {
    nextJsNativeLoading?: boolean;
  };
}

/** Caveat: make it the top-most wrapper of your layout's `{children}`. Otherwise some issues might occur, e.g. I've tried to have it lower in the tree than 'zustand' store provider and 'swr' config provider, and this caused 'nextjs-toploader' to indefinitely show a loading state. */
export const YandexMetricaProvider: FC<YandexMetricaProviderProps> = ({
  children,
  tagID,
  strategy = 'afterInteractive',
  initParameters,
  shouldUseAlternativeCDN = false,
  experimental,
}) => {
  const YANDEX_METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;
  const id = useMemo(
    () => tagID ?? (YANDEX_METRICA_ID ? Number(YANDEX_METRICA_ID) : null),
    [YANDEX_METRICA_ID, tagID],
  );

  useTrackRouteChange({ tagID: id });

  if (!id) {
    console.warn('[next-yandex-metrica] Yandex.Metrica tag ID is not defined');

    return <>{children}</>;
  }

  const scriptSrc = shouldUseAlternativeCDN
    ? 'https://cdn.jsdelivr.net/npm/yandex-metrica-watch/tag.js'
    : 'https://mc.yandex.ru/metrika/tag.js';

  const sharedInit = `
    ym(${id}, "init", ${JSON.stringify(initParameters ?? {})});
    ${initEcommerce(initParameters?.ecommerce)}
  `;

  return (
    <>
      {experimental?.nextJsNativeLoading ? (
        <>
          {/* Initialize the Yandex Metrika queue before the external script loads */}
          <Script id="yandex-metrika-init" strategy="beforeInteractive">
            {`
              window.ym = window.ym || function() {
                (window.ym.a = window.ym.a || []).push(arguments);
              };
              window.ym.l = 1 * new Date();
              ${sharedInit}
            `}
          </Script>

          {/* Insert the external Yandex Metrika script */}
          <Script src={scriptSrc} strategy={strategy} async />
        </>
      ) : (
        <Script id="yandex-metrica" strategy={strategy}>
          {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "${scriptSrc}", "ym");
          ${sharedInit}
        `}
        </Script>
      )}
      <noscript id="yandex-metrica-pixel">
        <MetricaPixel tagID={id} />
      </noscript>
      <MetricaTagIDContext.Provider value={id}>
        {initParameters?.ecommerce ? (
          <MetricaEcommerceContext.Provider
            value={
              typeof initParameters?.ecommerce === 'string'
                ? initParameters?.ecommerce
                : 'dataLayer'
            }
          >
            {children}
          </MetricaEcommerceContext.Provider>
        ) : (
          children
        )}
      </MetricaTagIDContext.Provider>
    </>
  );
};

function initEcommerce(paramEcommerce: InitParameters['ecommerce']) {
  if (!paramEcommerce) return '';

  const dataLayerName = typeof paramEcommerce === 'string' ? paramEcommerce : 'dataLayer';
  return `window.${dataLayerName} = window.${dataLayerName} || [];`;
}
