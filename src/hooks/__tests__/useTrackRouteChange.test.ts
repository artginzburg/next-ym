import { renderHook } from '@testing-library/react';
import { Router } from 'next/router';

import { useTrackRouteChange } from '../useTrackRouteChange';

const YM_MOCK = jest.fn();
Object.defineProperty(window, 'ym', {
  value: YM_MOCK,
  writable: true,
});

describe('useTrackRouteChange (Pages Router)', () => {
  beforeEach(() => YM_MOCK.mockClear());

  it('handles route change', () => {
    renderHook(() => useTrackRouteChange({ tagID: 444 }));

    Router.events.emit('routeChangeStart');
    expect(YM_MOCK).not.toHaveBeenCalled();

    Router.events.emit('routeChangeComplete', 'https://test.com/');
    expect(YM_MOCK).toHaveBeenCalledTimes(1);
    expect(YM_MOCK).toHaveBeenCalledWith(444, 'hit', 'https://test.com/');
  });

  it('logs verbose output when verbose=true', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    renderHook(() => useTrackRouteChange({ tagID: 444, verbose: true }));

    Router.events.emit('routeChangeComplete', 'https://test.com/page');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Sending "hit"'),
      'https://test.com/page',
    );
    consoleLogSpy.mockRestore();
  });
});

describe('useTrackRouteChange (App Router)', () => {
  // In the App Router branch (NODE_ENV !== 'test' AND no Pages Router),
  // the hook overrides history.pushState/replaceState. Jest auto-sets
  // NODE_ENV='test', so we temporarily override it here.
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  beforeAll(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: ORIGINAL_NODE_ENV,
      configurable: true,
    });
  });

  beforeEach(() => {
    YM_MOCK.mockClear();
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });

  it('tracks route change via pushState', () => {
    renderHook(() => useTrackRouteChange({ tagID: 444 }));

    history.pushState(null, '', '/about');

    expect(YM_MOCK).toHaveBeenCalledTimes(1);
    expect(YM_MOCK).toHaveBeenCalledWith(444, 'hit', '/about');
  });

  it('tracks route change via replaceState', () => {
    renderHook(() => useTrackRouteChange({ tagID: 444 }));

    history.replaceState(null, '', '/profile');

    expect(YM_MOCK).toHaveBeenCalledTimes(1);
    expect(YM_MOCK).toHaveBeenCalledWith(444, 'hit', '/profile');
  });

  it('skips urls starting with "?" (App Router replaces them, causing duplicates)', () => {
    renderHook(() => useTrackRouteChange({ tagID: 444 }));

    history.pushState(null, '', '?page=2');

    expect(YM_MOCK).not.toHaveBeenCalled();
  });

  it('ignores null/undefined urls', () => {
    renderHook(() => useTrackRouteChange({ tagID: 444 }));

    history.pushState(null, '', null);
    history.pushState(null, '');

    expect(YM_MOCK).not.toHaveBeenCalled();
  });

  it('logs verbose message when skipping "?" urls', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    renderHook(() => useTrackRouteChange({ tagID: 444, verbose: true }));

    history.pushState(null, '', '?page=2');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Skipping "hit"'),
      '?page=2',
    );
    consoleLogSpy.mockRestore();
  });

  it('restores original pushState/replaceState on unmount', () => {
    const { unmount } = renderHook(() => useTrackRouteChange({ tagID: 444 }));

    expect(history.pushState).not.toBe(originalPushState);
    expect(history.replaceState).not.toBe(originalReplaceState);

    unmount();

    expect(history.pushState).toBe(originalPushState);
    expect(history.replaceState).toBe(originalReplaceState);
  });
});
