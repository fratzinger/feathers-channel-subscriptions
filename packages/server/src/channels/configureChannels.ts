import { OnConnectOptions } from "../types";
import { configureOnConnect } from "./onConnect";
import { configureOnDisconnect } from "./onDisconnect";
import { makeFilterChannels } from "./filterChannels";

export function configureChannels(
  app: any, 
  options: OnConnectOptions
) {
  configureOnConnect(app, options);
  configureOnDisconnect(app, options);
  return makeFilterChannels(app, options);
}