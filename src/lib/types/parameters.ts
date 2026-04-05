import type { AutocompleteUnknownString } from '@artginzburg/experimental/strong-ts/typed-string';

/** Session parameters. @see https://yandex.com/support/metrica/objects/params-method.html */
export interface VisitParameters {
  /**
   * Revenue by goal. You can set the cost in currency or Yandex units.
   *
   * Type: Double
   */
  order_price?: number;
  /**
   * Use this field if you want to pass the goal cost in currency. Yandex Metrica recognizes three-letter ISO 4217 currency codes
   *
   * If a different currency is passed, null values will be sent instead of currencies and amounts.
   *
   * @example 'USD'
   */
  currency?: string;
  [key: string]: unknown;
}

export interface UserParameters {
  UserID?: number;
  [key: string]: unknown;
}

/** @see https://yandex.com/support/metrica/code/counter-initialize.html#counter-initialize__counter_params */
export interface InitParameters {
  /**
   * Accurate bounce rate
   * @default true
   */
  accurateTrackBounce?: boolean | number;
  /**
   * Whether to record iframe contents without a tag in a child window
   * @default false
   */
  childIframe?: boolean;
  /**
   * Whether to collect data for a click map
   * @default true
   */
  clickmap?: boolean;
  /**
   * Whether to disable automatically sending data during tag initialization
   * @default false
   */
  defer?: boolean;
  /**
   * `true` is inferred as `'dataLayer'`
   * @default false
   */
  ecommerce?: boolean | AutocompleteUnknownString<'dataLayer'> | unknown[];
  /**
   * Session parameters transmitted during tag initialization
   *
   * To transmit session parameters at any other time, use the [params](https://yandex.com/support/metrica/objects/params-method.html) method. */
  params?: VisitParameters | VisitParameters[];
  /**
   * Parameters of site users that are transmitted when initializing the tag
   *
   * To transmit user parameters at any other time, use the [userParams](https://yandex.com/support/metrica/objects/user-params.html) method
   */
  userParams?: UserParameters;
  /**
   * Hash tracking in the browser's address bar
   * @default false
   */
  trackHash?: boolean;
  /**
   * Track clicks on outbound links
   * @default true
   */
  trackLinks?: boolean;
  /** Indicates a trusted domain for recording the contents of a child iframe. Contains the domain address of the parent window */
  trustedDomains?: string[];
  /**
   * Tag type. 1 for YAN
   * @default 0
   */
  type?: number;
  /**
   * Whether to use Session Replay
   * @default false
   */
  webvisor?: boolean;
  /**
   * Whether to check if the tag is ready
   * @default false
   */
  triggerEvent?: boolean;
  /**
   * A technical parameter used by the ad tag.
   * Setting this to `true` apparently prevents normal counter initialization.
   * Omit or set to `false` for standard usage.
   */
  ssr?: boolean;
  /**
   * Override the referrer sent with the init hit.
   * Useful for SSR where `document.referrer` may not be available at init time.
   */
  referrer?: string;
  /**
   * Override the URL sent with the init hit.
   * Useful for SSR where `location.href` may not reflect the correct page.
   */
  url?: string;
}

export interface FirstPartyParamsParameters {
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  home_address?: string;
  street?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  yandex_cid?: number;
}
