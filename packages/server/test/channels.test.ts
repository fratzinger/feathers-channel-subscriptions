import assert from "assert";
import makeTestApp from "./testApp";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("channels.test.ts", function() {
  it("tests", async function() {
    const { app, subscriptionsService, testService, usersService, createClient } = await makeTestApp();

    const client1 = await createClient();

    let onTestCount = 0;
    let onUsersCount = 0;

    client1.service("test").on("created", (val) => {
      onTestCount++;
    });

    client1.service("users").on("created", (val) => {
      onUsersCount++;
    });

    await app.service("test").create({ test: 1 });
    await app.service("users").create({ userId: 1 });

    await sleep(20);
    assert.strictEqual(onTestCount, 0);
    assert.strictEqual(onUsersCount, 0);

    await client1.service("subscriptions").create({ servicePath: "test" });

    await app.service("test").create({ test: 2 });
    await app.service("users").create({ userId: 2 });

    await sleep(20);
    assert.strictEqual(onTestCount, 1);
    assert.strictEqual(onUsersCount, 0);

    await client1.service("subscriptions").create({ servicePath: "users" });

    await app.service("test").create({ test: 3 });
    await app.service("users").create({ userId: 3 });

    await sleep(20);
    assert.strictEqual(onTestCount, 2);
    assert.strictEqual(onUsersCount, 1);

    await client1.service("subscriptions").remove(null, { query: { servicePath: "test" } });

    await app.service("test").create({ test: 4 });
    await app.service("users").create({ userId: 4 });

    await sleep(20);
    assert.strictEqual(onTestCount, 2);
    assert.strictEqual(onUsersCount, 2);

    await client1.service("subscriptions").remove(null, { query: { servicePath: "users" } });

    await app.service("test").create({ test: 5 });
    await app.service("users").create({ userId: 5 });

    await sleep(20);
    assert.strictEqual(onTestCount, 2);
    assert.strictEqual(onUsersCount, 2);

    await client1.service("subscriptions").create({ servicePath: ["test", "users"] });

    await app.service("test").create({ test: 6 });
    await app.service("users").create({ userId: 6 });

    await sleep(20);
    assert.strictEqual(onTestCount, 3);
    assert.strictEqual(onUsersCount, 3);

    await client1.service("subscriptions").remove(null, { query: { servicePath: ["test", "users"] } });

    await app.service("test").create({ test: 7 });
    await app.service("users").create({ userId: 7 });

    await sleep(20);
    assert.strictEqual(onTestCount, 3);
    assert.strictEqual(onUsersCount, 3);
  });

  it("removes on disconnect", async function() {
    const { app, subscriptionsService, testService, usersService, createClient } = await makeTestApp();

    const client1 = await createClient();

    await client1.service("subscriptions").create({ servicePath: "test" });
    await client1.service("subscriptions").create({ servicePath: "users" });

    assert.strictEqual(Object.keys(subscriptionsService.store).length, 1);

    // @ts-ignore
    await client1.io.disconnect();

    await sleep(20);

    assert.strictEqual(Object.keys(subscriptionsService.store).length, 0);
  });

  it("client can only remove itself, not another client", async function() {
    const { app, subscriptionsService, testService, usersService, createClient } = await makeTestApp();

    const client1 = await createClient();
    const client2 = await createClient();

    await client1.service("subscriptions").create({ servicePath: "test" });

    let connectionIds = Object.keys(subscriptionsService.store);

    assert.strictEqual(connectionIds.length, 1);

    const client1Id = connectionIds[0];

    await client2.service("subscriptions").create({ servicePath: "test" });

    connectionIds = Object.keys(subscriptionsService.store);

    assert.strictEqual(connectionIds.length, 2);

    const client2Id = connectionIds.find(x => x !== client1Id);

    await assert.rejects(
      () => client1.service("subscriptions").remove(client2Id),
      (err: any) => err.message === "You can only remove yourself!"
    );

    assert.strictEqual(Object.keys(subscriptionsService.store).length, 2);
  });
});