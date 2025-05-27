import { useCallback, useContext, useMemo } from 'react';

import { MetricaEcommerceContext } from '../components/YandexMetricaProvider';
import {
  dataLayerPush,
  DataObject,
  Product,
  type PromoCampaign,
  Purchase,
  SimpleActionType,
  type WithPromotions,
} from '../lib/ecommerce';

export function useEcommerce<Defaults extends Pick<DataObject['ecommerce'], 'currencyCode'>>(
  defaults?: Defaults,
) {
  const dataLayerName = useContext(MetricaEcommerceContext);

  const pushToDataLayer = useCallback(
    (data: DataObject['ecommerce']) => {
      dataLayerPush(dataLayerName, { ecommerce: data });
    },
    [dataLayerName],
  );

  type StandardProductArgs = Partial<Pick<DataObject['ecommerce'], 'currencyCode'>> & {
    product: Product;
  };

  const makeStandardTrackProduct = useCallback(
    (actionType: SimpleActionType) => (data: StandardProductArgs) =>
      pushToDataLayer({
        currencyCode: defaults?.currencyCode ?? (data.currencyCode as string),
        [actionType as 'detail']: { products: [data.product] },
      }),
    [defaults?.currencyCode, pushToDataLayer],
  );

  const trackImpressionsProduct = useCallback(
    (
      data: Partial<Pick<DataObject['ecommerce'], 'currencyCode'>> & {
        products: Product[];
      },
    ) => {
      pushToDataLayer({
        currencyCode: defaults?.currencyCode ?? (data.currencyCode as string),
        impressions: data.products,
      });
    },
    [defaults?.currencyCode, pushToDataLayer],
  );

  const trackClickProduct = useMemo(
    () => makeStandardTrackProduct('click'),
    [makeStandardTrackProduct],
  );
  const trackViewProduct = useMemo(
    () => makeStandardTrackProduct('detail'),
    [makeStandardTrackProduct],
  );
  const trackAddItemToBasket = useMemo(
    () => makeStandardTrackProduct('add'),
    [makeStandardTrackProduct],
  );
  const trackRemoveItemFromBasket = useMemo(
    () => makeStandardTrackProduct('remove'),
    [makeStandardTrackProduct],
  );

  const trackPromoView = useCallback(
    (data: WithPromotions) => {
      pushToDataLayer({
        promoView: data,
      });
    },
    [pushToDataLayer],
  );
  const trackPromoClick = useCallback(
    (data: { promotion: PromoCampaign }) => {
      pushToDataLayer({
        promoClick: {
          promotions: [data.promotion],
        },
      });
    },
    [pushToDataLayer],
  );

  const trackPurchase = useCallback(
    (
      data: Partial<Pick<DataObject['ecommerce'], 'currencyCode'>> & {
        products: Product[];
      } & { actionField: Purchase['purchase']['actionField'] },
    ) => {
      pushToDataLayer({
        currencyCode: defaults?.currencyCode ?? (data.currencyCode as string),
        purchase: {
          actionField: data.actionField,
          products: data.products,
        },
      });
    },
    [defaults?.currencyCode, pushToDataLayer],
  );

  return {
    trackImpressionsProduct,
    trackClickProduct,
    trackViewProduct,
    trackAddItemToBasket,
    trackRemoveItemFromBasket,
    trackPurchase,
    trackPromoView,
    trackPromoClick,

    pushToDataLayer,
  };
}
