import assert from "assert";
import makeTestApp from "./testapp";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("channels.test.ts", function() {
  it("tests", async function() {
    const { app, subscriptionsService, testService, usersService, createClient } = makeTestApp();

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
});