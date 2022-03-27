import type { ServiceChannelSubscriptionsOptions } from "./types";
import type { Application, Id, NullableId, Params } from "@feathersjs/feathers";
import { Forbidden, NotFound, NotImplemented } from "@feathersjs/errors";

const defaultOptions: Required<ServiceChannelSubscriptionsOptions> = {
  connectionId: "id"
};

type Data = {
  servicePath: string | string[]
  connectionId?: Id
}

type StoreItem = {
  id: Id
  connection: any
  byPaths: Record<string, boolean>
}

export class ServiceChannelSubscriptions {
  app: Application;
  options: Required<ServiceChannelSubscriptionsOptions>;
  store: Record<string, StoreItem>;

  constructor(app: Application, _options?: ServiceChannelSubscriptionsOptions) {
    this.app = app;
    this.options = Object.assign({}, defaultOptions, _options);
    this.store = {};
  }

  async _find(_params: Params) {

  }

  async _get(id: Id, params: Params) {
    const storeItem = this.store[id];
    if (!storeItem) { 
      throw new NotFound(`No connection with id ${id} found`);
    }

    return storeItem;
  }

  async _create(data: Data, params?: Params) {
    const { id, connection } = this.getConnectionId({ params, data });
    if (!id) { return undefined; }
    this.store[id] ||= { id, connection, byPaths: {} };

    const paths = (Array.isArray(data.servicePath)) ? data.servicePath : [data.servicePath];

    for (let i = 0, n = paths.length; i < n; i++) {
      const path = paths[i];
      if (!this.app.service(path)) { return undefined; }
      this.store[id].byPaths[path] = true;
    }

    return data;
  }

  async _update(id: Id, data: Data, params?: Params) {
    throw new NotImplemented("update not implemented");
  }

  async _patch(id: NullableId, data: Data, params?: Params) {
    throw new NotImplemented("patch not implemented");
  }

  async _remove(id: NullableId, params?: Params) {
    this.checkConnectionIdMatch(id, params);
    const { id: connId } = this.getConnectionId({ params, id });
    if (!connId) { return; }

    if (id && params.connection?.id && id !== params.connection.id) {
      throw new Forbidden("You can only remove yourself!");
    }

    const definition = this.store[connId];

    if (!definition) { return; }

    if (!params.query?.servicePath) {
      delete this.store[connId];
    }

    const paths = Array.isArray(params.query.servicePath) ? params.query.servicePath : [params.query.servicePath];

    for (let i = 0, n = paths.length; i < n; i++) {
      const path = paths[i];

      if (definition.byPaths[path]) {
        delete definition.byPaths[path];
      }
    }
  }

  find(_params: Params) {
    return this._find(_params);
  }

  get(id: Id, params: Params) {
    return this._get(id, params);
  }

  create(data: Data, params?: Params) {
    return this._create(data, params);
  }

  update(id: Id, data: Data, params?: Params) {
    return this._update(id, data, params);
  }

  patch(id: NullableId, data: Data, params?: Params) {
    return this._patch(id, data, params);
  }

  remove(id: NullableId, params?: Params) {
    return this._remove(id, params);
  }

  connectionsForServicePath(servicePath: string, connections?: any): any {
    const result: any[] = [];

    const isPrefiltered = !!connections && Array.isArray(connections);

    for (const id in this.store) {
      const { byPaths, connection } = this.store[id];
      if (isPrefiltered && !connections.includes(connection)) { continue; }
      
      if (byPaths[servicePath]) {
        result.push(connection);
      }
    }

    return result;
  }

  private getConnectionId({
    params,
    data,
    id
  }: { params: Params, data?: any, id?: NullableId }): { id: Id, connection: any } | undefined {
    if (!params.connection && !data?.connectionId && !id) { return undefined; }
    let connId = id || params.connection?.[this.options.connectionId];
    if (!connId) { connId = data?.connectionId; }
    return { id: connId, connection: params.connection };
  }

  private checkConnectionIdMatch(id: NullableId, params: Params) {
    if (id && params.connection?.id && id !== params.connection.id) {
      throw new Forbidden("You can only remove yourself!");
    }
  }
}