exports = module.exports = global;

QUnit = require("qunit-tap/vendor/qunit/qunit/qunit").QUnit;
var qunitTap = require('qunit-tap').qunitTap;
qunitTap(QUnit, require('util').puts, { noPlan: true });
QUnit.init();

exports.assert = QUnit;

var mock_client = function() {
};
mock_client.prototype.writeBuffer = "";
mock_client.prototype.write = function(msg) {
    this.writeBuffer += msg;
};

exports.mock_client = mock_client;
