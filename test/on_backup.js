
var t = require('../test_helper.js');
"use strict";

var counting_db = require('../lib/counting_db/server');
var fs = require('fs');

QUnit.module("testing server.on_backup", {});

QUnit.asyncTest("testing server.on_backup", 4, function() {
    var server = new counting_db.server({
        "log_level": "warn",
        "datadir": "/tmp/counting_db",
    });
    fs.mkdir("/tmp/counting_db/", null, function(err) {
        QUnit.equal( err, undefined, "mkdir tmpdir ok");
        var client = new t.mock_client();
        server.on_backup(client);
        var server_time = server.stats["server_time"];
        setTimeout(function(){
            QUnit.ok(client.writeBuffer.match(/OK\r\n$/), "reply should be OK");
            fs.unlink("/tmp/counting_db/snapshot." + server_time, function(err) {
                QUnit.equal(err, undefined, "file should be exist!!");
                fs.rmdir("/tmp/counting_db", function(err) {
                    QUnit.equal(err, undefined, "remove tmpdir complete");
                    QUnit.start();
                });
            });
        }, 10);
    });
});

QUnit.test("more test", function() {
    QUnit.ok("ok", "ok");
});

QUnit.start();
