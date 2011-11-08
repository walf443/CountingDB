
var t = require('../test_helper.js');
var counting_db = require('../lib/counting_db/server');
"use strict";

QUnit.module("testing server.on_delete", {});

QUnit.test("testing server.on_delete", function() {
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
    var client = new t.mock_client();
    server.on_delete(client, ["foo", "bar"]);
    QUnit.equal(client.writeBuffer, "OK\r\n", "response OK");

    QUnit.equal(server.db["foo"], undefined, "foo should be deleted");
    QUnit.equal(server.db["bar"], undefined, "bar should be deleted");

    QUnit.equal(server.stats["item_count"], 20, "item count should be degreed");
});

QUnit.start();
