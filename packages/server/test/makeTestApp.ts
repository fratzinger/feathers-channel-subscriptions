import feathers, { HookContext, ServiceAddons } from "@feathersjs/feathers";
import "@feathersjs/transport-commons";
import { Service as MemoryService } from "feathers-memory";
import express from "@feathersjs/express";
import socketioServer from "@feathersjs/socketio";
import socketioClient from "@feathersjs/socketio-client";
import io from "socket.io-client";
import getPort from "get-port";

import { configureChannels, ServiceChannelSubscriptions } from "../src";

export default async () => {
  const app = express(feathers());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Set up Plugins and providers
  app.configure(express.rest());
  app.configure(socketioServer());

  app.on("connection", (connection: unknown): void => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel("anonymous").join(connection);
  });

  const filterChannels = configureChannels(app, { subscriptionServicePath: "subscriptions" });

  app.publish((data: any, context: HookContext) => {
    return filterChannels(data, context);
  });

  const port = await getPort();

  app.listen(port);

  app.use("/test", new MemoryService({}));
  app.use("/users", new MemoryService({}));

  app.use("/subscriptions", new ServiceChannelSubscriptions(app));

  async function createClient() {
    const socket = io(`http://localhost:${port}`);
    const client = feathers<{
        test: ServiceAddons<MemoryService>
        users: ServiceAddons<MemoryService>
        subscriptions: ServiceChannelSubscriptions 
      }>();
    client.configure(socketioClient(socket));

    const testClientService = client.service("test");
    const usersClientService = client.service("users");
    const subscriptionsClientService = client.service("subscriptions");

    const p = new Promise<void>((resolve) => {
      socket.on("connect", () => resolve());
    });

    await p;

    return client;
  }

  const subscriptionsService: ServiceChannelSubscriptions = app.service("subscriptions");

  return {
    app,
    testService: app.service("test"),
    usersService: app.service("users"),
    subscriptionsService,
    createClient
  };
};