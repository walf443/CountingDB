
var t = require('../test_helper.js');
var counting_db = require('../lib/counting_db/server');
"use strict";

QUnit.module("testing server.on_count", {});

QUnit.test("testing server.on_count", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_count(client, "12345", ["daily20111106", "weekly201130", "monthly201111"]);

    QUnit.equal(client.writeBuffer, "OK\r\n", "response OK");
    QUnit.equal(server.db["daily20111106"]["set_count"], 1, "set_count should be updated");
    QUnit.equal(server.db["weekly201130"]["set_count"], 1, "set_count should be updated");
    QUnit.equal(server.db["monthly201111"]["set_count"], 1, "set_count should be updated");

    QUnit.equal(server.db["daily20111106"]["unique_count"], 1, "unique_count should be updated");
    QUnit.equal(server.db["weekly201130"]["unique_count"], 1, "unique_count should be updated");
    QUnit.equal(server.db["monthly201111"]["unique_count"], 1, "unique_count should be updated");

    QUnit.equal(server.stats["item_count"], 3, "item_count should be updated");

    // retry
    client.writeBuffer = "";
    server.on_count(client, "12345", ["daily20111106", "weekly201130", "monthly201111"]);
    QUnit.equal(client.writeBuffer, "OK\r\n", "response OK");

    QUnit.equal(server.db["daily20111106"]["set_count"], 2, "set_count should be updated");
    QUnit.equal(server.db["weekly201130"]["set_count"], 2, "set_count should be updated");
    QUnit.equal(server.db["monthly201111"]["set_count"], 2, "set_count should be updated");

    QUnit.equal(server.db["daily20111106"]["unique_count"], 1, "unique_count should not be updated");
    QUnit.equal(server.db["weekly201130"]["unique_count"], 1, "unique_count should not be updated");
    QUnit.equal(server.db["monthly201111"]["unique_count"], 1, "unique_count should not be updated");

    QUnit.equal(server.stats["item_count"], 3, "item_count should not be updated");
});

QUnit.start();
