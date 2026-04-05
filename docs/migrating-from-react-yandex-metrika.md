# Migrating from `react-yandex-metrika`

`react-yandex-metrika` hasn't been updated since 2019 and has no App Router support. This guide walks through moving to `@artginzburg/next-ym`.

## At a glance

|                | `react-yandex-metrika`                           | `@artginzburg/next-ym`                       |
| -------------- | ------------------------------------------------ | -------------------------------------------- |
| Init component | `<YMInitializer accounts={[ID]} />`              | `<YandexMetricaProvider tagID={ID} />`       |
| Route tracking | manual `ym('hit', path)` on every navigation     | automatic                                    |
| Events         | `ym('reachGoal', name, params)` (default import) | `const { reachGoal } = useMetrica()` (typed) |
| Webvisor 2.0   | `version="2"` + `options={{ webvisor: true }}`   | `standardYMInitParameters`                   |
| Ecommerce      | not supported                                    | `useEcommerce()` hook, typed                 |
| Safari ITP     | not handled                                      | `withMetricaProxy()` first-party proxy       |
| App Router     | ❌                                               | ✅                                           |

## Install

```bash
pnpm remove react-yandex-metrika
pnpm add @artginzburg/next-ym
```

Set your tag ID via env (recommended — no hardcoded number in the provider):

```env
NEXT_PUBLIC_YANDEX_METRICA_ID=12345678
```

## Step 1 — replace the initializer

### Before

```tsx
// pages/_app.tsx
import { YMInitializer } from 'react-yandex-metrika';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <YMInitializer accounts={[12345678]} options={{ webvisor: true }} version="2" />
      <Component {...pageProps} />
    </>
  );
}
```

### After

```tsx
// pages/_app.tsx  — or app/layout.tsx for App Router
import { YandexMetricaProvider, standardYMInitParameters } from '@artginzburg/next-ym';

export default function MyApp({ Component, pageProps }) {
  return (
    <YandexMetricaProvider initParameters={standardYMInitParameters}>
      <Component {...pageProps} />
    </YandexMetricaProvider>
  );
}
```

`standardYMInitParameters` enables the same Webvisor 2.0 + ecommerce + clickmap defaults you'd set manually. If you were passing custom `options`, spread them on top:

```tsx
<YandexMetricaProvider initParameters={{ ...standardYMInitParameters, trackHash: true }}>
```

## Step 2 — delete manual route tracking

`react-yandex-metrika` requires you to call `ym('hit', ...)` on every route change yourself. Delete it — `YandexMetricaProvider` tracks SPA navigation automatically on both Pages and App routers.

### Before

```tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import ym from 'react-yandex-metrika';

export default function Layout({ children }) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url: string) => ym('hit', url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);
  return <>{children}</>;
}
```

### After

Delete the whole block. Nothing to add.

## Step 3 — swap event calls

The default-import `ym()` becomes typed methods from the `useMetrica` hook.

### Before

```tsx
import ym from 'react-yandex-metrika';

function BuyButton() {
  return <button onClick={() => ym('reachGoal', 'purchase', { price: 1500 })}>Buy</button>;
}
```

### After

```tsx
import { useMetrica } from '@artginzburg/next-ym';

function BuyButton() {
  const { reachGoal } = useMetrica();
  return <button onClick={() => reachGoal('purchase', { price: 1500 })}>Buy</button>;
}
```

`useMetrica()` exposes typed `reachGoal`, `notBounce`, `setUserID`, `userParams`, and `ymEvent` (escape hatch for arbitrary Metrica methods with overloads for every standard call).

### Calling from outside React (utility modules, stores)

If you previously imported `ym` at module scope, use the bare `ym` export:

```tsx
// before
import ym from 'react-yandex-metrika';
ym('reachGoal', 'signup');

// after
import { ym } from '@artginzburg/next-ym';
ym(12345678, 'reachGoal', 'signup'); // first arg is your tag ID
```

## Step 4 — (optional) ecommerce

`react-yandex-metrika` has no ecommerce API, so any existing ecommerce tracking was hand-rolled via raw `dataLayer` pushes. Replace with the typed hook:

```tsx
import { useEcommerce } from '@artginzburg/next-ym';

const { trackAddItemToBasket, trackPurchase } = useEcommerce({ currencyCode: 'RUB' });

trackAddItemToBasket({ product: { id: '123', name: 'T-Shirt', price: 1500, quantity: 1 } });
```

See the [Ecommerce section](https://github.com/artginzburg/next-ym#ecommerce) in the main README for the full method list.

## Step 5 — (optional) Safari ITP proxy

Safari's ITP blocks third-party scripts from `mc.yandex.ru`. Previously you'd either accept the data loss or set up a reverse proxy manually. Now it's one line:

```ts
// next.config.ts
import { withMetricaProxy } from '@artginzburg/next-ym/config';

export default withMetricaProxy({
  /* your config */
});
```

The provider auto-detects the proxy and routes the script through your own domain.

## Gotchas

- **Multiple accounts**: `react-yandex-metrika` accepted `accounts={[id1, id2]}`. `YandexMetricaProvider` currently initializes a single tag ID. If you need multiple trackers, wrap twice or [open an issue](https://github.com/artginzburg/next-ym/issues).
- **Defer option**: `react-yandex-metrika`'s `options={{ defer: true }}` delayed init until the page was idle. `YandexMetricaProvider` uses [next/script's `strategy` prop](https://nextjs.org/docs/api-reference/next/script#strategy) — pass `strategy="lazyOnload"` for similar behavior.
- **`window.ym` globalness**: both libraries still expose `window.ym` after init, so any legacy code reading `window.ym(...)` directly keeps working.
- **TypeScript**: `react-yandex-metrika` had no types. After migrating you'll get red squiggles on invalid goal names / event signatures — that's the point.

## Need help?

Open an issue at https://github.com/artginzburg/next-ym/issues with your current `react-yandex-metrika` config — happy to add missing migration cases.
