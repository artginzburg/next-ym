import { ym } from '../ym';

const YM_MOCK = jest.fn();

beforeEach(() => {
  YM_MOCK.mockClear();
  Object.defineProperty(window, 'ym', {
    value: YM_MOCK,
    writable: true,
    configurable: true,
  });
});

describe('ym', () => {
  it('calls ym with provided parameters', () => {
    ym(444, 'hit', '/url');
    ym(444, 'reachGoal', 'goal');

    expect(YM_MOCK).toHaveBeenCalledTimes(2);
    expect(YM_MOCK).toHaveBeenNthCalledWith(1, 444, 'hit', '/url');
    expect(YM_MOCK).toHaveBeenNthCalledWith(2, 444, 'reachGoal', 'goal');
  });

  it('does not call ym if tagID is not provided', () => {
    ym(null, 'hit', '/url');
    ym(null, 'reachGoal', 'goal');

    expect(YM_MOCK).not.toHaveBeenCalled();
  });

  it('does not call ym if window.ym is falsy', () => {
    Object.defineProperty(window, 'ym', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    ym(444, 'hit', '/url');

    expect(YM_MOCK).not.toHaveBeenCalled();
  });

  it('logs an error and returns if window.ym key does not exist', () => {
    // @ts-expect-error — intentionally removing the property
    delete window.ym;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    ym(444, 'hit', '/url');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('window.ym is not defined'),
    );
    expect(YM_MOCK).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
