#!/usr/bin/env node

"use strict";
require.paths.push('./lib/');
var counting_db = require('counting_db/server');
var s = new counting_db.server();
s.run();
