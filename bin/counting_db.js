#!/usr/bin/env node

"use strict";
var counting_db = require('../lib/counting_db/server');
var s = new counting_db.server();
s.run();
