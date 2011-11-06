
var t = require('../test_helper.js');
var counting_db = require('counting_db/server');
"use strict";

QUnit.module("testing server.on_read", {});

QUnit.test("in case not support command", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_read(client, "must_not_supported_command args1 args2\r\n");
    QUnit.equal(client.writeBuffer, "ERROR\r\n", "response OK");

});

QUnit.test("in case that command is ping", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_read(client, "ping\r\n");
    QUnit.equal(client.writeBuffer, "PONG\r\n", "response OK");

});

QUnit.test("in case that command is stats", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_read(client, "stats\r\n");
    QUnit.ok(client.writeBuffer.match(/END\r\n$/), "protocol should be end with END");

});

QUnit.test("in case that command is delete", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_read(client, "delete\r\n");
    QUnit.equal(client.writeBuffer, "ERROR\r\n", "response should be error because of lack of arguments");

    var client2 = new t.mock_client();
    server.on_read(client2, "delete foo bar\r\n");
    QUnit.equal(client2.writeBuffer, "OK\r\n", "response is OK");

});

QUnit.test("in case that command is count", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_read(client, "count\r\n");
    QUnit.equal(client.writeBuffer, "ERROR\r\n", "response should be error because of lack of arguments");

    var client2 = new t.mock_client();
    server.on_read(client2, "count foo\r\n");
    QUnit.equal(client2.writeBuffer, "ERROR\r\n", "response should be error because of lack of arguments");

    var client3 = new t.mock_client();
    server.on_read(client3, "count value key1\r\n");
    QUnit.equal(client3.writeBuffer, "OK\r\n", "response is OK");

    var client4 = new t.mock_client();
    server.on_read(client4, "count value key1 key2\r\n");
    QUnit.equal(client4.writeBuffer, "OK\r\n", "response is OK");
});

QUnit.test("in case that command is get", function() {
    var server = new counting_db.server({
        "log_level": "warn",
    });

    var client = new t.mock_client();
    server.on_read(client, "get\r\n");
    QUnit.equal(client.writeBuffer, "ERROR\r\n", "response should be error because of lack of arguments");

    var client2 = new t.mock_client();
    server.on_read(client2, "get foo\r\n");
    QUnit.equal(client2.writeBuffer, "ERROR\r\n", "response should be error because of lack of arguments");

    var client3 = new t.mock_client();
    server.on_read(client3, "get not_exist_property key1\r\n");
    QUnit.equal(client3.writeBuffer, "ERROR\r\n", "response should be error because of lack of arguments");

    var client4 = new t.mock_client();
    server.on_read(client4, "get set_count foo bar\r\n");
    QUnit.equal(client4.writeBuffer, "END\r\n", "protocol should end with END");
});

QUnit.start();
