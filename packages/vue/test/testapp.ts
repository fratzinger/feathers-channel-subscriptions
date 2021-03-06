import feathers, { HookContext, ServiceAddons } from "@feathersjs/feathers";
import "@feathersjs/transport-commons";
import { Service as MemoryService } from "feathers-memory";
import express from "@feathersjs/express";
import socketioServer from "@feathersjs/socketio";
import socketioClient from "@feathersjs/socketio-client";
import io from "socket.io-client";

// @ts-ignore
import { configureChannels, ServiceChannelSubscriptions } from "@feathers-channel-subscriptions/server";

export default () => {
  const app = express(feathers());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Set up Plugins and providers
  app.configure(express.rest());
  app.configure(socketioServer());

  app.configure(socketioServer());

  app.on("connection", (connection: unknown): void => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel("anonymous").join(connection);
  });

  const filterChannels = configureChannels(app, { subscriptionServicePath: "subscriptions" });

  app.publish((data: any, context: HookContext) => {
    const channel = filterChannels(data, context);

    return channel;
  });

  const port = 2322;

  app.listen(port);

  app.use("/test", new MemoryService({}));
  app.use("/users", new MemoryService({}));

  app.use("/subscriptions", new ServiceChannelSubscriptions(app));
  const subscriptionsService = app.service("subscriptions") as ServiceChannelSubscriptions;

  async function createClient() {
    const socket = io(`http://localhost:${port}`);
    const client = feathers<{
        test: ServiceAddons<MemoryService>
        users: ServiceAddons<MemoryService>
        subscriptions: ServiceChannelSubscriptions 
      }>();
    client.configure(socketioClient(socket));

    const p = new Promise<void>((resolve) => {
      socket.on("connect", () => resolve());
    });

    await p;

    return client;
  }

  return {
    app,
    testService: app.service("test"),
    usersService: app.service("users"),
    subscriptionsService,
    createClient
  };
};