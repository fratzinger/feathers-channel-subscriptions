import { tryOnScopeDispose } from "@vueuse/core";
import _debounce from "lodash/debounce";
import { AddClientOptions, UseServiceSubscriptionsOptions } from "./types";

export let globalStores: Record<string, ServiceChannelGlobalStore> = {};

class ServiceChannelGlobalStore {
  client: any;
  subscriptionsPath: any;
  services: Record<string, ServiceChannelSubscriptionsStore>;
  servicesToRegister: string[];
  sync: () => void;

  constructor(client, subscriptionsPath: string) {
    this.client = client;
    this.subscriptionsPath = subscriptionsPath;
    this.services = {};
    this.servicesToRegister = [];

    this.sync = _debounce(async () => {
      const registeredServices = Object.keys(this.services);
      const toAdd = registeredServices.filter(servicePath => !this.servicesToRegister.includes(servicePath));
      const toRemove = this.servicesToRegister.filter(servicePath => !registeredServices.includes(servicePath));

      this.servicesToRegister = registeredServices;

      await Promise.all([
        this.syncAddServices(toAdd),
        this.syncRemoveServices(toRemove)
      ]);
    }, 50);
  }

  hasService(servicePath: string) {
    return !!this.services[servicePath];
  }

  private async syncAddServices(services: string[]) {
    if (!services.length) {
      return;
    }

    return await this.client.service(this.subscriptionsPath).create({ servicePath: services });
  }

  private async syncRemoveServices(services: string[]) {
    return await this.client.service(this.subscriptionsPath).remove(null, { query: { servicePath: services } });
  }

  service(servicePath: string): ServiceChannelSubscriptionsStore {
    return this.services[servicePath];
  }

  removeService(servicePath: string) {
    if (!this.services[servicePath]) {
      return;
    }

    delete this.services[servicePath];

    this.sync();
  }

  listen(servicePath: string) {
    if (!this.services[servicePath]) {
      this.services[servicePath] = new ServiceChannelSubscriptionsStore(servicePath);
    }

    this.services[servicePath].subscribe();

    this.sync();

    return this.services[servicePath];
  }

  dispose(store: ServiceChannelSubscriptionsStore) {
    const shouldRemove = store.unsubscribe();

    if (shouldRemove) {
      this.removeService(store.servicePath);
    }
  }

  async destroy() {
    return await this.client.service(this.subscriptionsPath).remove(null);
  }
}

class ServiceChannelSubscriptionsStore {
  servicePath: string;
  private _subscribers: number;

  constructor(servicePath: string) {
    this.servicePath = servicePath;
    this._subscribers = 0;
  }

  get subscribers() {
    return this._subscribers;
  }

  subscribe(): void {
    this._subscribers++;
  }

  unsubscribe(): boolean {
    this._subscribers--;

    if (this.subscribers <= 0) {
      return true;
    }

    return false;
  }
}

export function addClient (
  client: any, 
  serverAlias: string, 
  options: AddClientOptions
): void {
  if (globalStores[serverAlias]) {
    throw new Error(`Client for serverAlias "${serverAlias}" already exists`);
  }

  globalStores[serverAlias] = new ServiceChannelGlobalStore(client, options.subscriptionsServicePath);
}

export function clear(): void {
  for (const store in globalStores) {
    globalStores[store].destroy();
  }
  globalStores = {};
}

export function useServiceSubscriptions(
  { serverAlias, servicePath }: UseServiceSubscriptionsOptions
): void {
  const store = globalStores[serverAlias];
  if (!store) {
    throw new Error(`No subscriptions store found for serverAlias: ${serverAlias}`);
  }

  const service = store.listen(servicePath);

  tryOnScopeDispose(() => store.dispose(service));
}