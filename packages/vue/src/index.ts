import { tryOnScopeDispose } from "@vueuse/core";
import _debounce from "lodash/debounce";
import { AddClientOptions, UseServiceSubscriptionsOptions } from "./types";

export let globalStores: Record<string, ServiceChannelGlobalStore> = {};

class ServiceChannelGlobalStore {
    client: any;
    subscriptionsPath: any
    services: Record<string, ServiceChannelSubscriptionsStore>;
    servicesToRegister: string[];
    sync: Function;

    constructor(client, subscriptionsPath) {
        this.client = client;
        this.subscriptionsPath = subscriptionsPath;
        this.services = {};
        this.servicesToRegister = [];

        this.sync = _debounce(async () => {
            const registeredServices = Object.keys(this.services);
            const toAdd = registeredServices.filter(servicePath => !this.servicesToRegister.includes(servicePath));
            const toRemove = this.servicesToRegister.filter(servicePath => !registeredServices.includes(servicePath));

            console.log("sync", toAdd, toRemove);

            this.servicesToRegister = registeredServices;

            await Promise.all([
              this.syncAddServices(toAdd),
              this.syncRemoveServices(toRemove)
            ]);
        }, 50);
    }

    hasService(servicePath) {
      return !!this.services[servicePath];
    }

    private async syncAddServices(services: string[]) {
        if (!services.length) {
            return;
        }

        return await this.client.service(this.subscriptionsPath).create({ servicePath: services });
    }

    private async syncRemoveServices(services: string[]) {
        return await this.client.service(this.subscriptionsPath).remove(null, { query: { servicePath: services }})
    }

    service(servicePath): ServiceChannelSubscriptionsStore {
        return this.services[servicePath];
    }

    addService(servicePath): ServiceChannelSubscriptionsStore {
        if (this.services[servicePath]) {
            return;
        }

        this.services[servicePath] = new ServiceChannelSubscriptionsStore(servicePath);

        this.sync();

        return this.services[servicePath];
    }

    removeService(servicePath) {
        if (!this.services[servicePath]) {
            return;
        }

        delete this.services[servicePath];

        this.sync();
    }

    dispose(store: ServiceChannelSubscriptionsStore) {
        const shouldRemove = store.unsubscribe();

        if (shouldRemove) {
            this.removeService(store.servicePath);
        }
    }
}

class ServiceChannelSubscriptionsStore {
  servicePath: string;
  subscribers: number;

  constructor(servicePath: string) {
    this.servicePath = servicePath;
    this.subscribers = 0;
  }

  subscribe() {
    this.subscribers++;
  }

  unsubscribe(): boolean {
    this.subscribers--;

    if (this.subscribers <= 0) {
      return true;
    }

    return false;
  }
}

export function addClient(client: any, serverAlias: string, options: AddClientOptions) {
  if (globalStores[serverAlias]) {
    throw new Error(`Client for serverAlias "${serverAlias}" already exists`);
  }

  globalStores[serverAlias] = new ServiceChannelGlobalStore(client, options.subscriptionsServicePath);
}

export function clear() {
  globalStores = {};
}

export function useServiceSubscriptions(
  { serverAlias, servicePath }: UseServiceSubscriptionsOptions
): void {
    const store = globalStores[serverAlias];
    if (!store) {
      throw new Error(`No subscriptions store found for serverAlias: ${serverAlias}`);
    }

    let service = store.service(servicePath);
    if (!service) {
        service = store.addService(servicePath)
    }

    service.subscribe();

    console.log(service);
  
    tryOnScopeDispose(() => store.dispose(service));
}