import { METRICA_SCRIPT_URL } from './constants/urls';

/** Path where the proxied Metrica script will be available. */
export const METRICA_PROXY_PATH = '/metrika-proxy.js';

/** Env variable set by withMetricaProxy so YandexMetricaProvider auto-detects the proxy. */
export const METRICA_PROXY_ENV = 'NEXT_PUBLIC_YM_PROXY_PATH';

/**
 * Wraps your Next.js config to proxy the Yandex Metrica script through your domain.
 * This makes the script appear as first-party, bypassing Safari ITP blocking.
 *
 * Usage in next.config.ts:
 * ```ts
 * import { withMetricaProxy } from '@artginzburg/next-ym/config';
 * export default withMetricaProxy(nextConfig);
 * ```
 *
 * Then pass `customScriptSrc={METRICA_PROXY_PATH}` to `YandexMetricaProvider`,
 * or import `METRICA_PROXY_PATH` from `@artginzburg/next-ym/config`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withMetricaProxy<T extends Record<string, any>>(config: T): T {
  const originalRewrites = config.rewrites;

  return {
    ...config,
    env: {
      ...config.env,
      [METRICA_PROXY_ENV]: METRICA_PROXY_PATH,
    },
    rewrites: async () => {
      const metricaRewrite = { source: METRICA_PROXY_PATH, destination: METRICA_SCRIPT_URL };

      if (!originalRewrites) {
        return [metricaRewrite];
      }

      const original = await originalRewrites();

      if (Array.isArray(original)) {
        return [...original, metricaRewrite];
      }

      return {
        ...original,
        beforeFiles: [...(original.beforeFiles ?? []), metricaRewrite],
      };
    },
  };
}
