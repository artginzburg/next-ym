import { renderHook } from '@testing-library/react';
import React, { FC, ReactNode } from 'react';

import { MetricaEcommerceContext } from '../../components/YandexMetricaProvider';
import { useEcommerce } from '../useEcommerce';

function makeWrapper(dataLayerName: string | null): FC<{ children: ReactNode }> {
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <MetricaEcommerceContext.Provider value={dataLayerName}>
      {children}
    </MetricaEcommerceContext.Provider>
  );
  return Wrapper;
}

describe('useEcommerce', () => {
  let layer: unknown[];

  beforeEach(() => {
    layer = [];
    (window as unknown as Record<string, unknown>).dataLayer = layer;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).dataLayer;
  });

  it('tracks product impressions with default currencyCode', () => {
    const { result } = renderHook(() => useEcommerce({ currencyCode: 'USD' }), {
      wrapper: makeWrapper('dataLayer'),
    });

    result.current.trackImpressionsProduct({
      products: [{ id: '1', name: 'T-shirt', price: 10 }],
    });

    expect(layer).toEqual([
      {
        ecommerce: {
          currencyCode: 'USD',
          impressions: [{ id: '1', name: 'T-shirt', price: 10 }],
        },
      },
    ]);
  });

  it('lets per-call currencyCode override the default', () => {
    const { result } = renderHook(() => useEcommerce({ currencyCode: 'USD' }), {
      wrapper: makeWrapper('dataLayer'),
    });

    // With defaults set, the default takes precedence over per-call value.
    result.current.trackImpressionsProduct({
      currencyCode: 'EUR',
      products: [{ id: '1', name: 'T-shirt' }],
    });

    expect(layer[0]).toMatchObject({
      ecommerce: { currencyCode: 'USD' },
    });
  });

  it('uses per-call currencyCode when no defaults are provided', () => {
    const { result } = renderHook(() => useEcommerce(), {
      wrapper: makeWrapper('dataLayer'),
    });

    result.current.trackImpressionsProduct({
      currencyCode: 'RUB',
      products: [{ id: '1', name: 'T-shirt' }],
    });

    expect(layer[0]).toMatchObject({
      ecommerce: { currencyCode: 'RUB' },
    });
  });

  it('tracks product click / view / add / remove with correct action keys', () => {
    const { result } = renderHook(() => useEcommerce({ currencyCode: 'USD' }), {
      wrapper: makeWrapper('dataLayer'),
    });

    const product = { id: '1', name: 'T-shirt' };

    result.current.trackClickProduct({ product });
    result.current.trackViewProduct({ product });
    result.current.trackAddItemToBasket({ product });
    result.current.trackRemoveItemFromBasket({ product });

    expect(layer).toEqual([
      { ecommerce: { currencyCode: 'USD', click: { products: [product] } } },
      { ecommerce: { currencyCode: 'USD', detail: { products: [product] } } },
      { ecommerce: { currencyCode: 'USD', add: { products: [product] } } },
      { ecommerce: { currencyCode: 'USD', remove: { products: [product] } } },
    ]);
  });

  it('tracks a purchase with actionField and products', () => {
    const { result } = renderHook(() => useEcommerce({ currencyCode: 'USD' }), {
      wrapper: makeWrapper('dataLayer'),
    });

    result.current.trackPurchase({
      actionField: { id: 'ORDER-1', revenue: 30 },
      products: [{ id: '1', name: 'T-shirt', price: 10, quantity: 3 }],
    });

    expect(layer).toEqual([
      {
        ecommerce: {
          currencyCode: 'USD',
          purchase: {
            actionField: { id: 'ORDER-1', revenue: 30 },
            products: [{ id: '1', name: 'T-shirt', price: 10, quantity: 3 }],
          },
        },
      },
    ]);
  });

  it('tracks promo view and promo click without currencyCode', () => {
    const { result } = renderHook(() => useEcommerce({ currencyCode: 'USD' }), {
      wrapper: makeWrapper('dataLayer'),
    });

    result.current.trackPromoView({
      promotions: [{ id: 'SUMMER', name: 'Summer Sale' }],
    });
    result.current.trackPromoClick({
      promotion: { id: 'SUMMER', name: 'Summer Sale' },
    });

    expect(layer).toEqual([
      { ecommerce: { promoView: { promotions: [{ id: 'SUMMER', name: 'Summer Sale' }] } } },
      { ecommerce: { promoClick: { promotions: [{ id: 'SUMMER', name: 'Summer Sale' }] } } },
    ]);
  });

  it('exposes pushToDataLayer as an escape hatch', () => {
    const { result } = renderHook(() => useEcommerce(), {
      wrapper: makeWrapper('dataLayer'),
    });

    result.current.pushToDataLayer({ currencyCode: 'USD', impressions: [] });

    expect(layer).toEqual([{ ecommerce: { currencyCode: 'USD', impressions: [] } }]);
  });

  it('applies per-call currencyCode in trackClickProduct without defaults', () => {
    const { result } = renderHook(() => useEcommerce(), {
      wrapper: makeWrapper('dataLayer'),
    });

    result.current.trackClickProduct({
      currencyCode: 'RUB',
      product: { id: '1', name: 'T-shirt' },
    });

    expect(layer[0]).toMatchObject({
      ecommerce: { currencyCode: 'RUB', click: { products: [{ id: '1', name: 'T-shirt' }] } },
    });
  });

  it('applies per-call currencyCode in trackPurchase without defaults', () => {
    const { result } = renderHook(() => useEcommerce(), {
      wrapper: makeWrapper('dataLayer'),
    });

    result.current.trackPurchase({
      currencyCode: 'RUB',
      actionField: { id: 'ORDER-1' },
      products: [{ id: '1', name: 'T-shirt', price: 10 }],
    });

    expect(layer[0]).toMatchObject({
      ecommerce: { currencyCode: 'RUB' },
    });
  });

  it('no-ops when no ecommerce context is available', () => {
    const { result } = renderHook(() => useEcommerce({ currencyCode: 'USD' }), {
      wrapper: makeWrapper(null),
    });

    result.current.trackImpressionsProduct({ products: [{ id: '1', name: 'T-shirt' }] });

    expect(layer).toEqual([]);
  });
});
