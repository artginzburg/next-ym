import { useCallback, useContext, useRef } from 'react';

import { MetricaTagIDContext } from '../components/YandexMetricaProvider';
import type {
  AddFileExtensionEventParameters,
  ExtLinkEventParameters,
  FileEventParameters,
  FirstPartyParamsEventParameters,
  GetClientIDEventParameters,
  HitEventParameters,
  InitEventParameters,
  NotBounceEventParameters,
  ParamsEventParameters,
  ReachGoalEventParameters,
  SetUserIDEventParameters,
  UserParamsEventParameters,
} from '../lib/types/events';
import { type NotBounceOptions } from '../lib/types/options';
import { type UserParameters, type VisitParameters } from '../lib/types/parameters';
import { ym } from '../lib/ym';

export const useMetrica = () => {
  const tagID = useContext(MetricaTagIDContext);

  const notBounce = useCallback(
    (options?: NotBounceOptions) => {
      ym(tagID, 'notBounce', options);
    },
    [tagID],
  );

  const reachGoal = useCallback(
    (
      target: string,
      /** Session parameters. @see https://yandex.com/support/metrica/objects/params-method.html */
      params?: VisitParameters,
      callback?: () => void,
    ) => {
      ym(tagID, 'reachGoal', target, params, callback);
    },
    [tagID],
  );

  // Skip redundant setUserID calls — the semantic is "set the current user",
  // so sending the same ID repeatedly is wasted work (and common, since consumers
  // often call this from an effect that re-runs on window focus, route change, etc.).
  const lastUserIDRef = useRef<string | null>(null);
  const setUserID = useCallback(
    (userID: string) => {
      if (lastUserIDRef.current === userID) return;
      lastUserIDRef.current = userID;
      ym(tagID, 'setUserID', userID);
    },
    [tagID],
  );

  const userParams = useCallback(
    (parameters: UserParameters) => {
      ym(tagID, 'userParams', parameters);
    },
    [tagID],
  );

  const ymEvent: YmEventFun = useCallback(
    (...parameters) => {
      // @ts-expect-error silly overload logic
      ym(tagID, ...parameters);
    },
    [tagID],
  );

  return { notBounce, reachGoal, setUserID, userParams, ymEvent };
};

// Overload signatures for each event type
interface YmEventFun {
  (...params: InitEventParameters): void;
}
interface YmEventFun {
  (...params: AddFileExtensionEventParameters): void;
}
interface YmEventFun {
  (...params: ExtLinkEventParameters): void;
}
interface YmEventFun {
  (...params: FileEventParameters): void;
}
interface YmEventFun {
  (...params: FirstPartyParamsEventParameters): void;
}
interface YmEventFun {
  (...params: GetClientIDEventParameters): void;
}
interface YmEventFun {
  (...params: HitEventParameters): void;
}
interface YmEventFun {
  (...params: NotBounceEventParameters): void;
}
interface YmEventFun {
  (...params: ParamsEventParameters): void;
}
interface YmEventFun {
  (...params: ReachGoalEventParameters): void;
}
interface YmEventFun {
  (...params: SetUserIDEventParameters): void;
}
interface YmEventFun {
  (...params: UserParamsEventParameters): void;
}
