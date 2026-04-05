# Advanced usage

Real-world patterns for building a type-safe analytics layer on top of `@artginzburg/next-ym`.

## The wrapper hook pattern

Instead of calling `useMetrica` and `useEcommerce` directly in every component, create a single `useAnalytics` hook that centralizes all tracking logic, enforces types, and maps your domain model to Yandex Metrica's format.

```tsx
// hooks/useAnalytics.ts
'use client';

import { useEcommerce, useMetrica } from '@artginzburg/next-ym';
import { useCallback } from 'react';
```

### Typed goals

Define a `GoalParams` map where every key is a goal name and every value is its expected payload (or `undefined` for goals with no params). This gives you compile-time safety — you can't send a goal with wrong params or forget a required field.

```tsx
type GoalParams = {
  // Conversions
  purchase: { itemId: string; type: string; category: string; price: number };
  item_created_free: { itemId: string; type: string };
  item_downloaded: { itemId: string };

  // Payments
  top_up: { amount: number };
  top_up_started: { amountCents: number };

  // Auth
  signup: undefined;
  login: undefined;

  // Engagement
  review_submitted: { itemId: string; rating: number };
  referral_link_copied: undefined;
  guidelines_uploaded: { fileName: string };
};

type Goal = keyof GoalParams;
```

Then wrap `reachGoal` with a generic function that enforces the mapping:

```tsx
const reachGoal = useCallback(
  <G extends Goal>(goal: G, ...args: GoalParams[G] extends undefined ? [] : [GoalParams[G]]) => {
    _reachGoal(goal, args[0] as Record<string, unknown> | undefined);
  },
  [_reachGoal],
);
```

Now TypeScript enforces correctness:

```tsx
reachGoal('signup');                          // OK — no params
reachGoal('signup', { foo: 1 });             // Error — signup takes no params
reachGoal('purchase', { itemId: '1', ... }); // OK — all fields required
reachGoal('purchase');                        // Error — params required
reachGoal('purchase', { itemId: '1' });      // Error — missing fields
```

### Domain-to-product mapping

Yandex Metrica ecommerce expects products in a specific format (`id`, `name`, `price`, `category`, `variant`, etc.). Your domain objects probably look different. Define a converter:

```tsx
interface ItemProduct {
  id: string;
  title: string;
  type: 'PREMIUM' | 'BASIC';
  category: string;
  optionCount: number;
  /** Price in cents as stored in your DB. */
  priceCents: number;
}

function toProduct(item: ItemProduct) {
  return {
    id: item.id,
    name: `${item.type === 'PREMIUM' ? 'Premium' : 'Basic'}: ${item.title}`,
    price: item.priceCents / 100, // Metrica expects the display currency
    category: item.category,
    variant: `${item.optionCount} options`,
    quantity: 1,
  };
}
```

### Ecommerce wrappers

Combine the converter with `useEcommerce` methods. Each wrapper is a single-purpose function that components can call with your domain object — no ecommerce knowledge needed at the call site.

```tsx
export function useAnalytics() {
  const { reachGoal: _reachGoal, setUserID, notBounce } = useMetrica();
  const {
    trackPurchase: _trackPurchase,
    trackViewProduct: _trackViewProduct,
    trackClickProduct: _trackClickProduct,
    trackImpressionsProduct: _trackImpressionsProduct,
  } = useEcommerce({ currencyCode: 'USD' });

  // ... reachGoal wrapper from above ...

  /** Full purchase: ecommerce event + goal. */
  const trackItemPurchase = useCallback(
    (item: ItemProduct) => {
      const product = toProduct(item);
      _trackPurchase({
        actionField: { id: item.id, revenue: product.price },
        products: [product],
      });
      reachGoal('purchase', {
        itemId: item.id,
        type: item.type,
        category: item.category,
        price: product.price,
      });
    },
    [_trackPurchase, reachGoal],
  );

  const trackItemView = useCallback(
    (item: ItemProduct) => _trackViewProduct({ product: toProduct(item) }),
    [_trackViewProduct],
  );

  const trackItemClick = useCallback(
    (item: ItemProduct) => _trackClickProduct({ product: toProduct(item) }),
    [_trackClickProduct],
  );

  /** Bulk impressions — call when a list of items renders. */
  const trackItemImpressions = useCallback(
    (items: ItemProduct[]) => {
      if (items.length === 0) return;
      _trackImpressionsProduct({ products: items.map(toProduct) });
    },
    [_trackImpressionsProduct],
  );

  const identifyUser = useCallback((userId: string) => setUserID(userId), [setUserID]);

  return {
    reachGoal,
    trackItemPurchase,
    trackItemView,
    trackItemClick,
    trackItemImpressions,
    identifyUser,
    notBounce,
  };
}
```

## Using the wrapper in components

### User identification

Call `identifyUser` once when the user session is known. This links all subsequent Webvisor sessions and segments to your internal user ID. Only send the ID — no PII.

```tsx
// components/DashboardLayout.tsx
const { identifyUser } = useAnalytics();
const user = useUser();

useEffect(() => {
  if (user?.id) identifyUser(user.id);
}, [user?.id, identifyUser]);
```

### Impressions on list render

Track impressions when a product list is displayed. Use the list length as a dependency — not the array reference — to avoid re-firing on every render (arrays get new references on each render even if the data hasn't changed).

```tsx
// components/ItemList.tsx
const { trackItemImpressions, trackItemClick } = useAnalytics();

useEffect(() => {
  trackItemImpressions(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the list size changes, not on every new array reference
}, [items.length, trackItemImpressions]);

return items.map((item) => (
  <div key={item.id} onClick={() => trackItemClick(item)}>
    {item.title}
  </div>
));
```

### Detail page view

Fire a product view event when the detail page mounts. Guard against empty data. Similar to impressions, use a stable primitive (`item?.id`) as the dependency to avoid re-firing when the object reference changes but the item is the same.

```tsx
// components/ItemDetail.tsx
const { trackItemView } = useAnalytics();

useEffect(() => {
  if (item) trackItemView(item);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- track once per item, not on every object reference change
}, [item?.id, trackItemView]);
```

### Purchase with dual tracking

A purchase fires both an ecommerce event (for revenue reports) and a goal (for conversion funnels). The wrapper does this in one call:

```tsx
// After successful payment
const { trackItemPurchase } = useAnalytics();
trackItemPurchase(item);
// This sends both:
//   1. ecommerce purchase with actionField + products
//   2. reachGoal('purchase', { ... })
```

### Bounce prevention on landing pages

> **Note:** If you already have `accurateTrackBounce: true` in your init parameters (included in `standardYMInitParameters`), Metrica automatically sends a "not bounce" signal after 15 seconds. The manual approach below is only useful if you need a **different threshold per page** or want to tie it to a specific user action (scroll depth, button click, etc.) instead of a timer.

```tsx
// components/LandingPage.tsx
const { notBounce } = useAnalytics();

// Example: mark as engaged after 30s (overriding the global 15s default)
useEffect(() => {
  const timer = setTimeout(notBounce, 30000);
  return () => clearTimeout(timer);
}, [notBounce]);
```

## Verifying the Safari ITP proxy works

After setting up `withMetricaProxy` in `next.config.ts`, check that the Metrica script actually loads through your own domain instead of `mc.yandex.ru`:

1. Open the site in **Safari** with DevTools → Network tab.
2. Reload the page.
3. Look for the script request. With the proxy enabled, the request URL should be your own origin: `https://your-site.com/metrika-proxy.js`. If you still see `https://mc.yandex.ru/metrika/tag.js`, the proxy isn't being picked up.

If the proxy isn't detected, check that `withMetricaProxy(nextConfig)` is actually the default export of `next.config.ts` — `export default withMetricaProxy(nextConfig)` is the correct form. That's all the setup the proxy needs; `withMetricaProxy` wires both the rewrite and the env var automatically.

Only the tag script (`tag.js`) is proxied — telemetry beacons and the `watch/<tagID>` pixel still go to `mc.yandex.ru` directly. Routing the script through your domain is enough to let Metrica set first-party cookies and satisfy Safari ITP.

## Debug mode

Toggle Yandex Metrica's built-in debug overlay. Enabling sets `_ym_debug` as a query parameter; Metrica then persists it as a cookie. To disable, you must clear the cookie — removing the query parameter alone is not enough.

```tsx
async function toggleYmDebug() {
  const cookie = await cookieStore.get('_ym_debug');

  if (cookie?.value === '1') {
    // Metrica sets the cookie on ".example.com" (with leading dot).
    // cookieStore.set/delete cannot target that domain, so use document.cookie.
    document.cookie = `_ym_debug=0; domain=.${location.hostname}; path=/`;
    const params = new URLSearchParams(location.search);
    params.delete('_ym_debug');
    location.search = params.toString();
  } else {
    const params = new URLSearchParams(location.search);
    params.set('_ym_debug', '2');
    location.search = params.toString();
  }
}
```

This reloads the page with Metrica's real-time event inspector — invaluable for verifying ecommerce payloads during development.

## Summary

| Pattern                    | Why                                                                |
| -------------------------- | ------------------------------------------------------------------ |
| Single `useAnalytics` hook | One import, consistent types, no ecommerce details leaking into UI |
| `GoalParams` type map      | Compile-time safety for every goal + payload                       |
| `toProduct` converter      | Domain model stays decoupled from Metrica's format                 |
| Dual tracking on purchase  | Revenue data in ecommerce reports + conversion in goal funnels     |
| `identifyUser` on mount    | Webvisor replays are linked to your user IDs                       |
| `notBounce` on timer       | Landing page engagement isn't lost to bounce metrics               |
| `_ym_debug` cookie toggle  | Quick ecommerce payload verification in dev                        |
