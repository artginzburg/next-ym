import { dataLayerPush } from '../ecommerce';

describe('dataLayerPush', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    // Clean up any dataLayers we created
    delete (window as unknown as Record<string, unknown>).dataLayer;
    delete (window as unknown as Record<string, unknown>).customLayer;
  });

  it('does nothing if dataLayerName is null', () => {
    dataLayerPush(null, { ecommerce: { currencyCode: 'USD', impressions: [] } });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('logs an error if the dataLayer is not defined on window', () => {
    dataLayerPush('dataLayer', { ecommerce: { currencyCode: 'USD', impressions: [] } });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('window.dataLayer is not defined'),
    );
  });

  it('returns silently if the dataLayer key exists but is falsy', () => {
    (window as unknown as Record<string, unknown>).dataLayer = undefined;
    dataLayerPush('dataLayer', { ecommerce: { currencyCode: 'USD', impressions: [] } });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('pushes onto the dataLayer when defined', () => {
    const layer: unknown[] = [];
    (window as unknown as Record<string, unknown>).dataLayer = layer;

    const payload = { ecommerce: { currencyCode: 'USD', impressions: [] } } as const;
    dataLayerPush('dataLayer', payload);

    expect(layer).toEqual([payload]);
  });

  it('respects a custom dataLayer name', () => {
    const layer: unknown[] = [];
    (window as unknown as Record<string, unknown>).customLayer = layer;

    const payload = { ecommerce: { currencyCode: 'EUR', impressions: [] } } as const;
    dataLayerPush('customLayer', payload);

    expect(layer).toEqual([payload]);
  });

  it('pushes multiple events in one call', () => {
    const layer: unknown[] = [];
    (window as unknown as Record<string, unknown>).dataLayer = layer;

    const a = { ecommerce: { currencyCode: 'USD', impressions: [] } } as const;
    const b = { ecommerce: { currencyCode: 'USD', click: { products: [] } } } as const;
    dataLayerPush('dataLayer', a, b);

    expect(layer).toEqual([a, b]);
  });
});
