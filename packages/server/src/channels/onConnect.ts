import { nanoid } from "nanoid";

import { ServiceChannelSubscriptions } from "../Service";
import { OnConnectOptions } from "../types";

export function configureOnConnect(
  app: any, 
  options: OnConnectOptions
): void {
  app.on("connection", connection => {
    if (connection.id) { return; }
    connection.id = nanoid();
  });
}