import { ServiceChannelSubscriptions } from "../Service";
import { OnDisconnectOptions } from "../types";

export function configureOnDisconnect(
  app: any, 
  options: OnDisconnectOptions
): void {
  app.on("disconnect", async connection => {
    if (!connection.id) { return; }

    const subscriptions = app.service(options.subscriptionServicePath) as ServiceChannelSubscriptions;

    await subscriptions.remove(connection.id);
  });
}