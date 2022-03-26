import { Channel } from "@feathersjs/transport-commons/lib/channels/channel/base";
import { CombinedChannel } from "@feathersjs/transport-commons/lib/channels/channel/combined";
import { Application, HookContext } from "@feathersjs/feathers";

import "@feathersjs/transport-commons";
import { ServiceChannelSubscriptions } from "../Service";

type ChannelSubscriptionOptions = {
  subscriptionServicePath: string
}

export function makeFilterChannels (app: Application, options: ChannelSubscriptionOptions) {
  const filterChannelsBySubscriptions = (
    data: any,
    context: HookContext,
    channels?: Channel | CombinedChannel
  ): Channel => {
    channels = channels || app.channel(app.channels);

    const service: ServiceChannelSubscriptions = app.service(options.subscriptionServicePath);
    const connections = service.connectionsForServicePath(context.path, channels.connections);
    return new Channel(connections, data);
  };

  return filterChannelsBySubscriptions;
}