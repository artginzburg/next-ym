import { renderHook } from '@testing-library/react';
import React, { FC, ReactNode } from 'react';

import { MetricaTagIDContext } from '../../components/YandexMetricaProvider';
import { useMetrica } from '../useMetrica';

const YM_MOCK = jest.fn();
Object.defineProperty(window, 'ym', {
  value: YM_MOCK,
  writable: true,
});

const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  return <MetricaTagIDContext.Provider value={444}>{children}</MetricaTagIDContext.Provider>;
};

describe('useMetrica', () => {
  beforeEach(() => YM_MOCK.mockClear());

  it('calls ym methods with correct parameters', () => {
    const { result } = renderHook(() => useMetrica(), { wrapper: Providers });
    const { notBounce, reachGoal, setUserID, userParams, ymEvent } = result.current;

    notBounce();

    expect(YM_MOCK).toHaveBeenCalledWith(444, 'notBounce', undefined);

    reachGoal('test', { order_price: 999 });

    expect(YM_MOCK).toHaveBeenCalledWith(444, 'reachGoal', 'test', { order_price: 999 }, undefined);

    setUserID('12345');

    expect(YM_MOCK).toHaveBeenCalledWith(444, 'setUserID', '12345');

    userParams({ status: 'Gold', UserID: 12345 });

    expect(YM_MOCK).toHaveBeenCalledWith(444, 'userParams', { status: 'Gold', UserID: 12345 });

    ymEvent('extLink', 'https://example.com/', { title: 'Test', params: { order_price: 999 } });

    expect(YM_MOCK).toHaveBeenCalledWith(444, 'extLink', 'https://example.com/', {
      title: 'Test',
      params: { order_price: 999 },
    });

    expect(YM_MOCK).toHaveBeenCalledTimes(5);
  });

  it('skips redundant setUserID calls with the same ID', () => {
    const { result } = renderHook(() => useMetrica(), { wrapper: Providers });

    result.current.setUserID('12345');
    result.current.setUserID('12345');
    result.current.setUserID('12345');

    expect(YM_MOCK).toHaveBeenCalledTimes(1);
    expect(YM_MOCK).toHaveBeenCalledWith(444, 'setUserID', '12345');
  });

  it('sends setUserID again when the ID actually changes', () => {
    const { result } = renderHook(() => useMetrica(), { wrapper: Providers });

    result.current.setUserID('12345');
    result.current.setUserID('67890');
    result.current.setUserID('67890');
    result.current.setUserID('12345');

    expect(YM_MOCK).toHaveBeenCalledTimes(3);
    expect(YM_MOCK).toHaveBeenNthCalledWith(1, 444, 'setUserID', '12345');
    expect(YM_MOCK).toHaveBeenNthCalledWith(2, 444, 'setUserID', '67890');
    expect(YM_MOCK).toHaveBeenNthCalledWith(3, 444, 'setUserID', '12345');
  });
});
