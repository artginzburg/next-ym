import { InitParameters } from '../lib/types/parameters';

/** The standard init parameters that are suggested when you create a new Metrica tag */
export const standardYMInitParameters = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  ecommerce: true,
} satisfies InitParameters;
