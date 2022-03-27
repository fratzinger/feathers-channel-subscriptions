import assert from "assert";
import { ServiceChannelSubscriptions } from "../src";

describe("service.test.ts", function() {
  describe("general", function() {
    it("has internal and external functions", function() {
      const service = new ServiceChannelSubscriptions(null);
      const internalMethods = ["_find", "_get", "_create", "_update", "_patch", "_remove"];
      const externalMethods = ["find", "get", "create", "update", "patch", "remove"];

      internalMethods.forEach(method => {
        assert.ok(method in service, `method '${method}' is in service`);
      });

      externalMethods.forEach(method => {
        assert.ok(method in service, `method '${method}' is in service`);
      });
    });
  });
});