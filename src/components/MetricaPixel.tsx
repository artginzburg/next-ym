import { FC } from 'react';

interface MetricaPixelProps {
  tagID: number;
}

/** @todo shouldUseAlternativeCDN */
export const MetricaPixel: FC<MetricaPixelProps> = ({ tagID }) => (
  <div>
    <img
      src={`https://mc.yandex.ru/watch/${tagID}`}
      style={{ position: 'absolute', left: -9999 }}
      alt=""
    />
  </div>
);
