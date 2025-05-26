import { useCallback, useContext, useMemo } from 'react';

import { MetricaEcommerceContext } from '../components/YandexMetricaProvider';
import { dataLayerPush, DataObject, Product, Purchase, SimpleActionType } from '../lib/ecommerce';

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

  // TODO Возможные значения:
  // impressions — просмотр списка товаров;
  // click — клик по товару в списке;
  // detail — просмотр товара; // DONE
  // add — добавление товара в корзину; // DONE
  // remove — удаление товара из корзины; // DONE
  // purchase — покупка; // DONE
  // promoView — просмотр внутренней рекламы;
  // promoClick — клик по внутренней рекламе.

  return {
    trackViewProduct,
    trackAddItemToBasket,
    trackRemoveItemFromBasket,
    trackPurchase,

    pushToDataLayer,
  };
}
