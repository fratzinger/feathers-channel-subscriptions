import { tryOnScopeDispose } from "@vueuse/core";
import { globalStores } from "../globalStores";
import type { UseServiceSubscriptionOptions } from "../types";

export function useServiceSubscription(
  { serverAlias, servicePath }: UseServiceSubscriptionOptions
): void {
  const store = globalStores[serverAlias];
  if (!store) {
    throw new Error(`No subscriptions store found for serverAlias: ${serverAlias}`);
  }
  
  const service = store.listen(servicePath);
  
  tryOnScopeDispose(() => store.dispose(service));
}