# @artginzburg/next-ym

[![npm version](https://img.shields.io/npm/v/@artginzburg/next-ym)](https://www.npmjs.com/package/@artginzburg/next-ym)
[![npm downloads](https://img.shields.io/npm/dw/@artginzburg/next-ym)](https://www.npmjs.com/package/@artginzburg/next-ym)
[![codecov](https://codecov.io/gh/artginzburg/next-ym/graph/badge.svg?token=2UUW3VBAWF)](https://codecov.io/gh/artginzburg/next-ym)

Самая полная интеграция **Яндекс.Метрики** для **Next.js** — App Router, Pages Router, электронная коммерция, прокси для Safari ITP и автоматический трекинг SPA из коробки.

> 🇬🇧 [English version](./README.md)

## Зачем этот пакет?

На npm есть несколько пакетов для Яндекс.Метрики в Next.js. Вот как они сравниваются:

| Возможность               | @artginzburg/next-ym | next-yandex-metrica | react-yandex-metrika | @koiztech/next-yandex-metrika |
| ------------------------- | :------------------: | :-----------------: | :------------------: | :---------------------------: |
| **App Router**            |          ✅          |         ✅          |          ❌          |              ✅               |
| **Pages Router**          |          ✅          |         ✅          |          ✅          |              ❌               |
| **Авто-трекинг SPA**      |          ✅          |     ❌ вручную      |          ❌          |              ❌               |
| **Хуки для e-commerce**   |   ✅ типизированы    |         ❌          |          ❌          |              ❌               |
| **Прокси для Safari ITP** |      ✅ встроен      |         ❌          |          ❌          |              ❌               |
| **TypeScript**            |     ✅ полностью     |         ✅          |          ❌          |           частично            |
| **Fallback на noscript**  |          ✅          |         ❌          |          ✅          |              ❌               |
| **ID счётчика из env**    |          ✅          |         ❌          |          ❌          |              ❌               |
| **Покрытие тестами**      |     ✅ **100%**      |        ✅ да        |          ❌          |              ❌               |
| **Последнее обновление**  |       Апр 2026       |      Сен 2025       |       Ноя 2019       |           Дек 2025            |
| **Загрузок в неделю**     |         292          |         846         |        9 161         |              19               |

> `react-yandex-metrika` лидирует по загрузкам просто благодаря возрасту (2017) — не обновлялся с 2019 и не поддерживает App Router. **Переходите с него?** Смотрите [гайд по миграции](https://github.com/artginzburg/next-ym/blob/main/docs/migrating-from-react-yandex-metrika.md).

## Установка

```bash
pnpm add @artginzburg/next-ym
```

или

```bash
npm install @artginzburg/next-ym
```

ID счётчика задаётся через переменную окружения (рекомендуемый способ):

```env
NEXT_PUBLIC_YANDEX_METRICA_ID=12345678
```

## Быстрый старт

### App Router

```tsx
// app/layout.tsx
import { YandexMetricaProvider, standardYMInitParameters } from '@artginzburg/next-ym';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
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

> `YandexMetricaProvider` — клиентский компонент (`"use client"`). Помещайте его как самый верхний враппер внутри `{children}` вашего layout-а.

Всё. Просмотры страниц трекаются автоматически при каждом переходе. Никакой дополнительной настройки для SPA-навигации не требуется.

## Отправка событий

```tsx
import { useMetrica } from '@artginzburg/next-ym';

export function BuyButton() {
  const { reachGoal } = useMetrica();

  return <button onClick={() => reachGoal('purchase-click')}>Купить</button>;
}
```

`useMetrica` отдаёт типизированные методы: `reachGoal`, `notBounce`, `setUserID`, `userParams` и `ymEvent` для любого другого [метода Яндекс.Метрики](https://yandex.ru/support/metrica/objects/method-reference.html).

Можно использовать функцию `ym` напрямую:

```tsx
import { ym } from '@artginzburg/next-ym';

ym(12345678, 'reachGoal', 'cta-click');
```

## Электронная коммерция

Полная типизированная поддержка ecommerce через хук `useEcommerce`. Требуется `ecommerce: 'dataLayer'` в параметрах инициализации (включено в `standardYMInitParameters`).

```tsx
import { useEcommerce } from '@artginzburg/next-ym';

// currencyCode задаётся один раз и применяется ко всем вызовам
const { trackClickProduct, trackAddItemToBasket, trackPurchase } = useEcommerce({
  currencyCode: 'RUB',
});
```

### Трекинг товаров

У каждого товара обязательно `id` или `name` (хотя бы одно), опционально: `brand`, `category`, `price`, `quantity`, `variant`, `coupon`, `discount`, `list`, `position`.

```tsx
// Показ списка товаров (принимает массив)
trackImpressionsProduct({
  products: [
    { id: '123', name: 'Футболка', price: 1500, list: 'Главная' },
    { id: '456', name: 'Худи', price: 3500, list: 'Главная' },
  ],
});

// Клик / просмотр карточки / добавление / удаление из корзины
// (все принимают один товар)
trackClickProduct({ product: { id: '123', name: 'Футболка' } });
trackViewProduct({ product: { id: '123', name: 'Футболка', price: 1500 } });
trackAddItemToBasket({ product: { id: '123', name: 'Футболка', price: 1500, quantity: 1 } });
trackRemoveItemFromBasket({ product: { id: '123', name: 'Футболка' } });
```

### Покупка

```tsx
trackPurchase({
  actionField: {
    id: 'ORDER-789', // обязательно — ID заказа
    revenue: 5000, // опционально — перекрывает сумму цен товаров
    coupon: 'SALE10', // опционально
    goal_id: 12345678, // опционально — номер цели в Метрике
  },
  products: [
    { id: '123', name: 'Футболка', price: 1500, quantity: 2 },
    { id: '456', name: 'Худи', price: 2000, quantity: 1 },
  ],
});
```

### Промо-кампании

```tsx
trackPromoView({
  promotions: [
    { id: 'SUMMER_SALE', name: 'Летняя распродажа', creative: 'banner_1', position: 'top' },
  ],
});

trackPromoClick({
  promotion: { id: 'SUMMER_SALE', name: 'Летняя распродажа' },
});
```

### Все методы

| Метод                       | Аргумент                          | Описание                          |
| --------------------------- | --------------------------------- | --------------------------------- |
| `trackImpressionsProduct`   | `{ products: Product[] }`         | Показан список товаров            |
| `trackClickProduct`         | `{ product: Product }`            | Клик по товару                    |
| `trackViewProduct`          | `{ product: Product }`            | Просмотр карточки товара          |
| `trackAddItemToBasket`      | `{ product: Product }`            | Добавлено в корзину               |
| `trackRemoveItemFromBasket` | `{ product: Product }`            | Удалено из корзины                |
| `trackPurchase`             | `{ actionField, products }`       | Заказ оформлен                    |
| `trackPromoView`            | `{ promotions: PromoCampaign[] }` | Показан промо-баннер              |
| `trackPromoClick`           | `{ promotion: PromoCampaign }`    | Клик по промо-баннеру             |
| `pushToDataLayer`           | сырые данные ecommerce            | Escape hatch для своих payload-ов |

## Прокси для Safari ITP

Intelligent Tracking Prevention в Safari блокирует сторонние скрипты с `mc.yandex.ru`. Встроенный прокси отдаёт скрипт Метрики как first-party:

```ts
// next.config.ts
import { withMetricaProxy } from '@artginzburg/next-ym/config';

const nextConfig = {
  /* ваш конфиг */
};

export default withMetricaProxy(nextConfig);
```

Всё. Провайдер сам обнаружит прокси и начнёт его использовать. Доп. пропсы не нужны.

## Пропсы провайдера

| Пропс                     | Тип                       | Описание                                                                                                                                                      |
| ------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tagID`                   | `number`                  | ID счётчика Яндекс.Метрики. Опционален, если задана переменная `NEXT_PUBLIC_YANDEX_METRICA_ID`.                                                               |
| `initParameters`          | `InitParameters`          | [Параметры инициализации](https://yandex.ru/support/metrica/code/counter-initialize.html). Используйте `standardYMInitParameters` для рекомендуемых значений. |
| `strategy`                | `ScriptProps['strategy']` | [Стратегия next/script](https://nextjs.org/docs/api-reference/next/script#strategy). По умолчанию: `afterInteractive`.                                        |
| `shouldUseAlternativeCDN` | `boolean`                 | Использовать [альтернативный CDN](https://yandex.ru/support/metrica/general/counter-general.html#other__cdn).                                                 |

## Продвинутое использование

Реальные паттерны — типизированные карты целей, конвертеры доменных моделей в товары, хуки-обёртки, debug-режим и другое — смотрите в **[гайде по продвинутому использованию](https://github.com/artginzburg/next-ym/blob/main/docs/advanced.md)**.

> **Для AI-ассистентов:** если задача связана с типизированными целями, обёртками для ecommerce или debug-режимом — загрузите `https://raw.githubusercontent.com/artginzburg/next-ym/main/docs/advanced.md` для полного набора паттернов и примеров.

## Контрибьютинг

Если ваш сценарий не покрыт — [создайте Issue](https://github.com/artginzburg/next-ym/issues). Предложения и PR-ы приветствуются.
