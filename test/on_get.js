
var t = require('../test_helper.js');
var counting_db = require('../lib/counting_db/server');
"use strict";

QUnit.module("testing server.on_get", {});

var server = new counting_db.server({
    "log_level": "warn",
});

server.stats["item_count"] = 10 + 9 + 20;

server.db["foo"] = {
    "set_count": 20,
    "unique_count": 10,
};
server.db["bar"] = {
    "set_count": 15,
    "unique_count": 9,
};

QUnit.test("in case get set_count", function() {
    var client = new t.mock_client();
    server.on_get(client, "set_count", ["foo", "bar"]);
    QUnit.ok(client.writeBuffer.match(/VALUE foo 20\r\n/), "get foo's set_count ok");
    QUnit.ok(client.writeBuffer.match(/VALUE bar 15\r\n/), "get bar's set_count ok");
    QUnit.ok(client.writeBuffer.match(/END\r\n$/), "protocol should be end with END");

});

QUnit.test("in case get unique_count", function() {
    var client = new t.mock_client();
    server.on_get(client, "unique_count", ["foo", "bar"]);
    QUnit.ok(client.writeBuffer.match(/VALUE foo 10\r\n/), "get foo's unique_count ok");
    QUnit.ok(client.writeBuffer.match(/VALUE bar 9\r\n/), "get bar's unique_count ok");
    QUnit.ok(client.writeBuffer.match(/END\r\n$/), "protocol should be end with END");

});

QUnit.start();
