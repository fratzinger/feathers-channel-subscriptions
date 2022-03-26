import { addClient, globalStores } from "../src/index";
import TestComponent from "./TestComponent.vue";
import makeTestApp from "./testapp";
import { defineComponent } from "vue";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import { mount } from "@vue/test-utils";

test("connects", async function() {
  const { createClient, app } = makeTestApp();

  const client = await createClient();

  addClient(client, "api", { subscriptionsServicePath: "subscriptions" });

  assert.ok(globalStores.api);

  const wrapper = mount(TestComponent);

  assert.ok(globalStores.api.hasService("users"));
  assert.strictEqual(globalStores.api.service("users").subscribers, 1);

  let onUsers = 0;

  client.service("users").on("created", () => {
    onUsers++;
  });

  await sleep(200);

  await app.service("users").create({ userId: 1 });

  await sleep(50);

  assert.strictEqual(onUsers, 1);

  wrapper.unmount();

  await sleep(100);

  await app.service("users").create({ userId: 2 });

  await sleep(50);

  assert.strictEqual(onUsers, 1);
});