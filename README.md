# Next.js Yandex Metrica

[![npm version](https://badge.fury.io/js/next-yandex-metrica.svg)](https://badge.fury.io/js/next-yandex-metrica)
[![codecov](https://codecov.io/gh/artginzburg/next-ym/graph/badge.svg?token=OZ8UX4NPK2)](https://codecov.io/gh/artginzburg/next-ym)

Yandex Metrica integration for Next.js v14+ (App Router)

> ### Fork reasoning
>
> The original repo had:
>
> 1. Only v13 (Pages Router) supported
> 2. No E-commerce support
> 3. Lack of focus on TypeScript autosuggestions and JSDoc comments

## Usage

### Add the provider

#### App Router

```jsx
// app/layout.tsx
import { YandexMetricaProvider, standardYMInitParameters } from '@artginzburg/next-ym';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <YandexMetricaProvider initParameters={standardYMInitParameters}>
          {children}
        </YandexMetricaProvider>
      </body>
    </html>
  );
}
```

#### Pages Router

To enable analytics, include `YandexMetricaProvider` in the custom [`_app`](https://nextjs.org/docs/advanced-features/custom-app) component.

```jsx
// pages/_app.tsx
import { YandexMetricaProvider } from '@artginzburg/next-ym';

export default function MyApp({ Component, pageProps }) {
  return (
    <YandexMetricaProvider
      tagID={12345678}
      initParameters={{ clickmap: true, trackLinks: true, accurateTrackBounce: true }}
    >
      <Component {...pageProps} />
    </YandexMetricaProvider>
  );
}
```

> **Note:** `YandexMetricaProvider` uses the `"use client"` directive.

#### `YandexMetricaProvider` Props

| Name                      | Description                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `tagID`                   | Yandex.Metrica tag ID.                                                                                                               |
| `strategy`                | [next/script](https://nextjs.org/docs/api-reference/next/script#strategy) loading strategy. Defaults to `afterInteractive`.          |
| `initParameters`          | Yandex.Metrica tag [initialization parameters](https://yandex.com/support/metrica/code/counter-initialize.html).                     |
| `shouldUseAlternativeCDN` | Use the [alternative CDN](https://yandex.ru/support/metrica/general/counter-general.html?lang=en#other__cdn) to load Yandex.Metrica. |

Yandex.Metrica tag ID is read from the `tagID` property and the `NEXT_PUBLIC_YANDEX_METRICA_ID` environment variable. If both are set, the provider property takes priority.

### Send events

`next/router` pageviews are tracked automatically.

The package provides `useMetrica` hook for sending custom analytics events.

```jsx
import { useMetrica } from 'next-yandex-metrica';

export function ActionButton() {
  const { reachGoal } = useMetrica();

  return (
    <button type="button" onClick={() => reachGoal('cta-click')}>
      CTA
    </button>
  );
}
```

The returned functions accept the same parameters as those found in the [Yandex.Metrica object methods](https://yandex.com/support/metrica/objects/method-reference.html).

All functions are automatically provided with the tag ID that is supplied to the provider or the environment variable. `useMetrica` hook exposes functions for calling `notBounce`, `reachGoal`, `setUserID`, and `userParams` without specifying the event name. Other methods can be called using the `ymEvent` function, with the event name as the first argument. In both cases, all event parameters are type-checked.

```jsx
import { useMetrica } from 'next-yandex-metrica';

export function ActionButton() {
  const { ymEvent } = useMetrica();

  const handleExternalLinkClick = () => {
    ymEvent('extLink', 'https://www.google.com');
  };

  // ...
}
```

In case if you need to use the Yandex.Metrica object directly, you can access it using the `ym` property.

```jsx
import { ym } from 'next-yandex-metrica';

export function ActionButton() {
  return (
    <button type="button" onClick={() => ym(12345678, 'reachGoal', 'cta-click')}>
      CTA
    </button>
  );
}
```

## Contributing

Things that are necessary in order to call it **the** Next.js Yandex Metrica integration are listed in [TODO.md](./docs/TODO.md)

If your use-case is not supported, please create an Issue. You'll be implementing it anyway if it's your real use-case, might as well support the community or accidentally find other adopters of that use-case.
