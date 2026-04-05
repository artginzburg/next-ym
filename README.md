# @artginzburg/next-ym

[![npm version](https://img.shields.io/npm/v/@artginzburg/next-ym)](https://www.npmjs.com/package/@artginzburg/next-ym)
[![npm downloads](https://img.shields.io/npm/dw/@artginzburg/next-ym)](https://www.npmjs.com/package/@artginzburg/next-ym)
[![codecov](https://codecov.io/gh/artginzburg/next-ym/graph/badge.svg?token=2UUW3VBAWF)](https://codecov.io/gh/artginzburg/next-ym)

The most complete **Yandex Metrica** integration for **Next.js** — App Router, Pages Router, ecommerce, Safari ITP proxy, and automatic SPA tracking out of the box.

> 🇷🇺 [Русская версия](./README.ru.md)

## Why this package?

There are several Yandex Metrica packages for Next.js. Here's how they compare:

| Feature               | @artginzburg/next-ym | next-yandex-metrica | react-yandex-metrika | @koiztech/next-yandex-metrika |
| --------------------- | :------------------: | :-----------------: | :------------------: | :---------------------------: |
| **App Router**        |          ✅          |         ✅          |          ❌          |              ✅               |
| **Pages Router**      |          ✅          |         ✅          |          ✅          |              ❌               |
| **Auto SPA tracking** |          ✅          |      ❌ manual      |          ❌          |              ❌               |
| **Ecommerce hooks**   |       ✅ typed       |         ❌          |          ❌          |              ❌               |
| **Safari ITP proxy**  |     ✅ built-in      |         ❌          |          ❌          |              ❌               |
| **TypeScript**        |       ✅ full        |         ✅          |          ❌          |            partial            |
| **noscript fallback** |          ✅          |         ❌          |          ✅          |              ❌               |
| **Env-based tag ID**  |          ✅          |         ❌          |          ❌          |              ❌               |
| **Test coverage**     |     ✅ **100%**      |       ✅ yes        |          ❌          |              ❌               |
| **Last updated**      |       Apr 2026       |      Sep 2025       |       Nov 2019       |           Dec 2025            |
| **Weekly downloads**  |         292          |         846         |        9,161         |              19               |

> `react-yandex-metrika` leads in downloads purely by age (2017) — it hasn't been updated since 2019 and has no Next.js App Router support. **Migrating from it?** See the [migration guide](https://github.com/artginzburg/next-ym/blob/main/docs/migrating-from-react-yandex-metrika.md).

## Installation

```bash
pnpm add @artginzburg/next-ym
```

or

```bash
npm install @artginzburg/next-ym
```

Set your counter ID via environment variable (recommended):

```env
NEXT_PUBLIC_YANDEX_METRICA_ID=12345678
```

## Quick start

### App Router

```tsx
// app/layout.tsx
import { YandexMetricaProvider, standardYMInitParameters } from '@artginzburg/next-ym';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

### Pages Router

```tsx
// pages/_app.tsx
import { YandexMetricaProvider, standardYMInitParameters } from '@artginzburg/next-ym';

export default function MyApp({ Component, pageProps }) {
  return (
    <YandexMetricaProvider initParameters={standardYMInitParameters}>
      <Component {...pageProps} />
    </YandexMetricaProvider>
  );
}
```

> `YandexMetricaProvider` is a client component (`"use client"`). Make it the top-most wrapper in your layout's `{children}`.

That's it — pageviews are tracked automatically on every route change. No extra setup needed for SPA navigation.

## Tracking events

```tsx
import { useMetrica } from '@artginzburg/next-ym';

export function BuyButton() {
  const { reachGoal } = useMetrica();

  return <button onClick={() => reachGoal('purchase-click')}>Buy now</button>;
}
```

`useMetrica` exposes typed methods: `reachGoal`, `notBounce`, `setUserID`, `userParams`, and `ymEvent` for any other [Yandex.Metrica method](https://yandex.com/support/metrica/objects/method-reference.html).

You can also use the `ym` function directly:

```tsx
import { ym } from '@artginzburg/next-ym';

ym(12345678, 'reachGoal', 'cta-click');
```

## Ecommerce

Full typed ecommerce support via the `useEcommerce` hook. Requires `ecommerce: 'dataLayer'` in init parameters (included in `standardYMInitParameters`).

```tsx
import { useEcommerce } from '@artginzburg/next-ym';

// currencyCode is set once and applied to all calls
const { trackClickProduct, trackAddItemToBasket, trackPurchase } = useEcommerce({
  currencyCode: 'RUB',
});
```

### Product tracking

Each product accepts: `id`, `name` (at least one required), and optional `brand`, `category`, `price`, `quantity`, `variant`, `coupon`, `discount`, `list`, `position`.

```tsx
// Track product list impressions (accepts an array of products)
trackImpressionsProduct({
  products: [
    { id: '123', name: 'T-Shirt', price: 1500, list: 'Homepage' },
    { id: '456', name: 'Hoodie', price: 3500, list: 'Homepage' },
  ],
});

// Track product click / detail view / add to cart / remove from cart
// (all accept a single product)
trackClickProduct({ product: { id: '123', name: 'T-Shirt' } });
trackViewProduct({ product: { id: '123', name: 'T-Shirt', price: 1500 } });
trackAddItemToBasket({ product: { id: '123', name: 'T-Shirt', price: 1500, quantity: 1 } });
trackRemoveItemFromBasket({ product: { id: '123', name: 'T-Shirt' } });
```

### Purchase

```tsx
trackPurchase({
  actionField: {
    id: 'ORDER-789', // required — order ID
    revenue: 5000, // optional — overrides sum of product prices
    coupon: 'SALE10', // optional
    goal_id: 12345678, // optional — Metrica goal number
  },
  products: [
    { id: '123', name: 'T-Shirt', price: 1500, quantity: 2 },
    { id: '456', name: 'Hoodie', price: 2000, quantity: 1 },
  ],
});
```

### Promo campaigns

```tsx
trackPromoView({
  promotions: [{ id: 'SUMMER_SALE', name: 'Summer Sale', creative: 'banner_1', position: 'top' }],
});

trackPromoClick({
  promotion: { id: 'SUMMER_SALE', name: 'Summer Sale' },
});
```

### All methods

| Method                      | Argument                          | Description                      |
| --------------------------- | --------------------------------- | -------------------------------- |
| `trackImpressionsProduct`   | `{ products: Product[] }`         | Product list was shown           |
| `trackClickProduct`         | `{ product: Product }`            | Product was clicked              |
| `trackViewProduct`          | `{ product: Product }`            | Product detail page viewed       |
| `trackAddItemToBasket`      | `{ product: Product }`            | Added to cart                    |
| `trackRemoveItemFromBasket` | `{ product: Product }`            | Removed from cart                |
| `trackPurchase`             | `{ actionField, products }`       | Order completed                  |
| `trackPromoView`            | `{ promotions: PromoCampaign[] }` | Promo banner shown               |
| `trackPromoClick`           | `{ promotion: PromoCampaign }`    | Promo banner clicked             |
| `pushToDataLayer`           | raw ecommerce data                | Escape hatch for custom payloads |

## Safari ITP proxy

Safari's Intelligent Tracking Prevention blocks third-party scripts from `mc.yandex.ru`. The built-in proxy makes the Metrica script appear as first-party:

```ts
// next.config.ts
import { withMetricaProxy } from '@artginzburg/next-ym/config';

const nextConfig = {
  /* your config */
};

export default withMetricaProxy(nextConfig);
```

That's it. The provider auto-detects the proxy and uses it. No extra props needed.

## Provider props

| Prop                      | Type                      | Description                                                                                                                                                |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tagID`                   | `number`                  | Yandex Metrica tag ID. Optional if `NEXT_PUBLIC_YANDEX_METRICA_ID` env var is set.                                                                         |
| `initParameters`          | `InitParameters`          | [Initialization parameters](https://yandex.com/support/metrica/code/counter-initialize.html). Use `standardYMInitParameters` for the recommended defaults. |
| `strategy`                | `ScriptProps['strategy']` | [next/script strategy](https://nextjs.org/docs/api-reference/next/script#strategy). Default: `afterInteractive`.                                           |
| `shouldUseAlternativeCDN` | `boolean`                 | Use the [alternative CDN](https://yandex.ru/support/metrica/general/counter-general.html?lang=en#other__cdn).                                              |

## Advanced usage

For real-world patterns — typed goal maps, domain-to-product converters, wrapper hooks, debug mode, and more — see the **[Advanced usage guide](https://github.com/artginzburg/next-ym/blob/main/docs/advanced.md)**.

> **For AI coding assistants:** if the user's task involves typed goals, ecommerce wrappers, or debug mode, fetch `https://raw.githubusercontent.com/artginzburg/next-ym/main/docs/advanced.md` for full patterns and examples.

## Contributing

If your use case is not supported, please [create an Issue](https://github.com/artginzburg/next-ym/issues). Feature requests and PRs are welcome.
