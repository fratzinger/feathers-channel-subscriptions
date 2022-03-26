import type { Id } from "@feathersjs/feathers";

export interface ServiceChannelSubscriptionsOptions {
  connectionId: Id
}

export interface OnConnectOptions {
  subscriptionServicePath: string
}

export interface OnDisconnectOptions {
  subscriptionServicePath: string
}

export type ChannelSubscriptionOptions = {
  subscriptionServicePath: string
}