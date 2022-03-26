import _get from "lodash/get";

import type { ServiceChannelSubscriptionsOptions } from "./types";
import type { Application, Id, NullableId, Params } from "@feathersjs/feathers";

const defaultOptions: Required<ServiceChannelSubscriptionsOptions> = {
  connectionId: "id"
}

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

  async find(params: Params) {

  }

  async get(id: Id, params: Params) {
    return this.store[id];
  }

  async create(data: Data, params?: Params) {
    const { id, connection } = this.getConnectionId({params, data});
    if (!id) { return undefined; }
    this.store[id] ||= { id, connection, byPaths: {} };

    const paths = (Array.isArray(data.servicePath)) ? data.servicePath : [data.servicePath]

    for (let i = 0, n = paths.length; i < n; i++) {
      const path = paths[i];
      if (!this.app.service(path)) { return undefined; }
      this.store[id].byPaths[path] = true;
    }

    return data;
  }

  async remove(id: NullableId, params: Params) {
    const { id: connId } = this.getConnectionId({ params, id });
    if (!connId) { return; }

    const definition = this.store[connId];

    if (!definition) { return; }

    if (!params.query.servicePath) {
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

  connectionsForServicePath(servicePath: string, connections?: any): any {
    const result: any[] = [];

    const isPrefiltered = !!connections && Array.isArray(connections);

    for (const id in this.store) {
      const { byPaths, connection } = this.store[id];
      if (isPrefiltered && !connections.includes(connection)) { continue; }
      
      if (byPaths[servicePath]) {
        result.push(connection)
      }
    }

    return result;
  }

  private getConnectionId({
    params,
    data,
    id
  }: { params: Params, data?: any, id?: NullableId }): { id: Id, connection: any } | undefined {
    if (!params.connection && !data.connectionId && !id) { return undefined; }
    let connId = id || params.connection[this.options.connectionId]
    if (!connId) { connId = data?.connectionId; }
    return { id: connId, connection: params.connection };
  }
}