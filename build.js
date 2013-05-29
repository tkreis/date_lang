
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-debug/index.js", Function("exports, require, module",
"if ('undefined' == typeof window) {\n  module.exports = require('./lib/debug');\n} else {\n  module.exports = require('./debug');\n}\n//@ sourceURL=visionmedia-debug/index.js"
));
require.register("visionmedia-debug/debug.js", Function("exports, require, module",
"\n/**\n * Expose `debug()` as the module.\n */\n\nmodule.exports = debug;\n\n/**\n * Create a debugger with the given `name`.\n *\n * @param {String} name\n * @return {Type}\n * @api public\n */\n\nfunction debug(name) {\n  if (!debug.enabled(name)) return function(){};\n\n  return function(fmt){\n    fmt = coerce(fmt);\n\n    var curr = new Date;\n    var ms = curr - (debug[name] || curr);\n    debug[name] = curr;\n\n    fmt = name\n      + ' '\n      + fmt\n      + ' +' + debug.humanize(ms);\n\n    // This hackery is required for IE8\n    // where `console.log` doesn't have 'apply'\n    window.console\n      && console.log\n      && Function.prototype.apply.call(console.log, console, arguments);\n  }\n}\n\n/**\n * The currently active debug mode names.\n */\n\ndebug.names = [];\ndebug.skips = [];\n\n/**\n * Enables a debug mode by name. This can include modes\n * separated by a colon and wildcards.\n *\n * @param {String} name\n * @api public\n */\n\ndebug.enable = function(name) {\n  try {\n    localStorage.debug = name;\n  } catch(e){}\n\n  var split = (name || '').split(/[\\s,]+/)\n    , len = split.length;\n\n  for (var i = 0; i < len; i++) {\n    name = split[i].replace('*', '.*?');\n    if (name[0] === '-') {\n      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));\n    }\n    else {\n      debug.names.push(new RegExp('^' + name + '$'));\n    }\n  }\n};\n\n/**\n * Disable debug output.\n *\n * @api public\n */\n\ndebug.disable = function(){\n  debug.enable('');\n};\n\n/**\n * Humanize the given `ms`.\n *\n * @param {Number} m\n * @return {String}\n * @api private\n */\n\ndebug.humanize = function(ms) {\n  var sec = 1000\n    , min = 60 * 1000\n    , hour = 60 * min;\n\n  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';\n  if (ms >= min) return (ms / min).toFixed(1) + 'm';\n  if (ms >= sec) return (ms / sec | 0) + 's';\n  return ms + 'ms';\n};\n\n/**\n * Returns true if the given mode name is enabled, false otherwise.\n *\n * @param {String} name\n * @return {Boolean}\n * @api public\n */\n\ndebug.enabled = function(name) {\n  for (var i = 0, len = debug.skips.length; i < len; i++) {\n    if (debug.skips[i].test(name)) {\n      return false;\n    }\n  }\n  for (var i = 0, len = debug.names.length; i < len; i++) {\n    if (debug.names[i].test(name)) {\n      return true;\n    }\n  }\n  return false;\n};\n\n/**\n * Coerce `val`.\n */\n\nfunction coerce(val) {\n  if (val instanceof Error) return val.stack || val.message;\n  return val;\n}\n\n// persist\n\nif (window.localStorage) debug.enable(localStorage.debug);\n//@ sourceURL=visionmedia-debug/debug.js"
));
require.register("date/index.js", Function("exports, require, module",
"/**\n * Expose `Date`\n */\n\nmodule.exports = require('./lib/parser');\n//@ sourceURL=date/index.js"
));
require.register("date/lib/date.js", Function("exports, require, module",
"/**\n * Module Dependencies\n */\n\nvar debug = require('debug')('date:date');\n\n/**\n * Time constants\n */\n\nvar _second = 1000;\nvar _minute = 60 * _second;\nvar _hour = 60 * _minute;\nvar _day = 24 * _hour;\nvar _week = 7 * _day;\nvar _year = 56 * _week;\nvar _daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];\n\n/**\n * Expose `date`\n */\n\nmodule.exports = date;\n\n/**\n * Initialize `date`\n *\n * @param {Date} offset (optional)\n * @return {Date}\n * @api publics\n */\n\nfunction date(offset) {\n  if(!(this instanceof date)) return new date(offset);\n  this._changed = {};\n  this.date = new Date(offset);\n};\n\n/**\n * Clone the current date\n */\n\ndate.prototype.clone = function() {\n  return new Date(this.date);\n}\n\n/**\n * Has changed\n *\n * @param {String} str\n * @return {Boolean}\n */\n\ndate.prototype.changed = function(str) {\n  if (this._changed[str] === undefined) return false;\n  return this._changed[str];\n};\n\n/**\n * add or subtract seconds\n *\n * @param {Number} n\n * @return {date}\n */\n\ndate.prototype.second = function(n) {\n  var seconds = +n * _second;\n  this.update(seconds);\n  this._changed['seconds'] = true;\n  return this;\n}\n\n/**\n * add or subtract minutes\n *\n * @param {Number} n\n * @return {date}\n */\n\ndate.prototype.minute = function(n) {\n  var minutes = +n * _minute;\n  this.update(minutes);\n  this._changed['minutes'] = true;\n  return this;\n}\n\n/**\n * add or subtract hours\n *\n * @param {Number} n\n * @return {date}\n */\n\ndate.prototype.hour = function(n) {\n  var hours = +n * _hour;\n  this.update(hours);\n  this._changed['hours'] = true;\n  return this;\n}\n\n/**\n * add or subtract days\n *\n * @param {Number} n\n * @return {date}\n */\n\ndate.prototype.day = function(n) {\n  var days = +n * _day;\n  this.update(days);\n  this._changed['days'] = true;\n  return this;\n}\n\n/**\n * add or subtract weeks\n *\n * @param {Number} n\n * @return {date}\n */\n\ndate.prototype.week = function(n) {\n  var weeks = +n * _week;\n  this.update(weeks);\n  this._changed['weeks'] = true;\n  return this;\n}\n\n/**\n * add or subtract months\n *\n * @param {Number} n\n * @return {Date}\n */\n\ndate.prototype.month = function(n) {\n  var d = this.date;\n  var day = d.getDate();\n  d.setDate(1);\n  var month = +n + d.getMonth();\n  d.setMonth(month);\n\n  // Handle dates with less days\n  var dim = this.daysInMonth(month)\n  d.setDate(Math.min(dim, day));\n  return this;\n};\n\n/**\n * get the days in the month\n */\n\ndate.prototype.daysInMonth = function(m) {\n  var dim = _daysInMonth[m];\n  var leap = leapyear(this.date.getFullYear());\n  return (1 == m && leap) ? 29 : 28;\n};\n\n/**\n * add or subtract years\n *\n * @param {Number} n\n * @return {date}\n */\n\ndate.prototype.year = function(n) {\n  var yr = this.date.getFullYear();\n  yr += +n;\n  this.date.setFullYear(yr);\n  this._changed['years'] = true;\n  return this;\n}\n\n/**\n * Set the time\n *\n * @param {String} h\n * @param {String} m\n * @param {String} s\n * @return {date}\n */\n\ndate.prototype.time = function(h, m, s) {\n  if (h === false) {\n    h = this.date.getHours();\n  } else {\n    h = +h || 0;\n    this._changed['hours'] = h;\n  }\n\n  if (m === false) {\n    m = this.date.getMinutes();\n  } else {\n    m = +m || 0;\n    this._changed['minutes'] = m;\n  }\n\n  if (s === false) {\n    s = this.date.getSeconds();\n  } else {\n    s = +s || 0;\n    this._changed['seconds'] = s;\n  }\n\n  this.date.setHours(h, m, s);\n  return this;\n};\n\n/**\n * Dynamically create day functions (sunday(n), monday(n), etc.)\n */\n\nvar days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];\ndays.forEach(function(day, i) {\n  date.prototype[days[i]] = function(n) {\n    this._changed['days'] = true;\n    this.updateDay(i, n);\n  };\n});\n\n/**\n * go to day of week\n *\n * @param {Number} day\n * @param {Number} n\n * @return {date}\n */\n\ndate.prototype.updateDay = function(d, n) {\n  n = +(n || 1);\n  var diff = (d - this.date.getDay() + 7) % 7;\n  if (n > 0) --n;\n  diff += (7 * n);\n  this.update(diff * _day);\n  return this;\n}\n\n/**\n * Update the date\n *\n * @param {Number} ms\n * @return {Date}\n * @api private\n */\n\ndate.prototype.update = function(ms) {\n  this.date = new Date(this.date.getTime() + ms);\n  return this;\n};\n\n/**\n * leap year\n *\n * @param {Number} yr\n * @return {Boolean}\n */\n\nfunction leapyear(yr) {\n  return (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;\n}\n//@ sourceURL=date/lib/date.js"
));
require.register("date/lib/parser.js", Function("exports, require, module",
"/**\n * Module Dependencies\n */\n\nvar date = require('./date');\nvar debug = require('debug')('date:parser');\n\n\n/**\n * Expose `parser`\n */\n\nmodule.exports = parser;\n\n/**\n * Initialize `parser`\n *\n * @param {String} str\n * @return {Date}\n * @api publics\n */\n\nfunction parser(str, offset, lang) {\n\n  this.lang = lang;\n  if (typeof(this.lang) === 'undefined') {\n    this.lang = {\n\n    rMeridiem: /^(\\d{1,2})(:(\\d{1,2}))?([:.](\\d{1,2}))?\\s*([ap]m)/,\n        rHourMinute: /^(\\d{1,2})(:(\\d{1,2}))([:.](\\d{1,2}))?/,\n    rDays: /\\b(sun(day)?|mon(day)?|tues(day)?|wed(nesday)?|thur(sday|s)?|fri(day)?|sat(urday)?)s?\\b/,\n    rPast: {\n    last: /^last\\b/,\n        yesterday: /^yes(terday)?\\b/,\n        ago: /^ago\\b/,\n        all: /\\b(last|yesterday|ago)\\b/\n},\n    rFuture:{\n        tomorrow: /^tom(orrow)?\\b/\n    },\n    rDayMod: {\n        morning: /morning\\b/,\n            next: /^next\\b/,\n            tonight: /^tonight\\b/,\n            noon: /^noon\\b/,\n            afternoon: /^afternoon\\b/,\n            night: /^night\\b/,\n            evening: /^evening\\b/,\n            midnight: /^midnight\\b/,\n            all: /\\b(morning|noon|afternoon|night|evening|midnight)\\b/\n    },\n    rUnit:{\n        second: /^s(ec|econd)?s?/,\n            minute: /^m(in|inute)?s?/,\n            hour: /^h(r|our)s?/,\n            week: /^w(k|eek)s?/,\n            month: /^mon(th)?(es|s)?\\b/,\n            year: /^y(r|ear)s?/,\n            day: /^d(ay)?s?/\n    },\n    structure: [ 'space', '_next', 'last', 'ago', 'dayByName', 'yesterday', 'tomorrow', 'noon', 'midnight',\n        'night', 'afternoon', 'morning', 'tonight', 'meridiem', 'hourminute', 'week', 'month', 'year', 'second',\n        'minute', 'hour', 'day', 'number', 'string', 'other' ]\n};\n\n\n  }\n\n  if (!(this instanceof parser)) return new parser(str, offset, lang);\n  var d = offset || new Date;\n  this.date = new date(d);\n  this.original = str;\n  this.str = str.toLowerCase();\n  this.stash = [];\n  this.tokens = [];\n  while (this.advance() !== 'eos');\n  debug('tokens %j', this.tokens)\n  this.nextTime(d);\n  if (this.date.date == d) throw new Error('Invalid date');\n  return this.date.date;\n};\n\n/**\n * Advance a token\n */\n\nparser.prototype.advance = function () {\n  var tok = this.eos()\n  for (var i = 0; i < this.lang.structure.length; i++) {\n    tok = tok || this[this.lang.structure[i]]();\n  }\n\n  this.tokens.push(tok);\n  return tok;\n};\n\n/**\n * Lookahead `n` tokens.\n *\n * @param {Number} n\n * @return {Object}\n * @api private\n */\n\nparser.prototype.lookahead = function (n) {\n  var fetch = n - this.stash.length;\n  if (fetch == 0) return this.lookahead(++n);\n  while (fetch-- > 0) this.stash.push(this.advance());\n  return this.stash[--n];\n};\n\n/**\n * Lookahead a single token.\n *\n * @return {Token}\n * @api private\n */\n\nparser.prototype.peek = function () {\n  return this.lookahead(1);\n};\n\n/**\n * Fetch next token including those stashed by peek.\n *\n * @return {Token}\n * @api private\n */\n\nparser.prototype.next = function () {\n  var tok = this.stashed() || this.advance();\n  return tok;\n};\n\n/**\n * Return the next possibly stashed token.\n *\n * @return {Token}\n * @api private\n */\n\nparser.prototype.stashed = function () {\n  var stashed = this.stash.shift();\n  return stashed;\n};\n\n/**\n * Consume the given `len`.\n *\n * @param {Number|Array} len\n * @api private\n */\n\nparser.prototype.skip = function (len) {\n  this.str = this.str.substr(Array.isArray(len)\n                             ? len[0].length\n                             : len);\n};\n\n/**\n * EOS\n */\n\nparser.prototype.eos = function () {\n  if (this.str.length) return;\n  return 'eos';\n};\n\n/**\n * Space\n */\n\nparser.prototype.space = function () {\n  var captures;\n  if (captures = /^([ \\t]+)/.exec(this.str)) {\n    this.skip(captures);\n    return this.advance();\n  }\n};\n\n/**\n * Second\n */\n\nparser.prototype.second = function () {\n  var captures;\n  if (captures = this.lang.rUnit.second.exec(this.str)) {\n    this.skip(captures);\n    return 'second';\n  }\n};\n\n/**\n * Minute\n */\n\nparser.prototype.minute = function () {\n  var captures;\n  if (captures = this.lang.rUnit.minute.exec(this.str)) {\n    this.skip(captures);\n    return 'minute';\n  }\n};\n\n/**\n * Hour\n */\n\nparser.prototype.hour = function () {\n  var captures;\n  if (captures = this.lang.rUnit.hour.exec(this.str)) {\n    this.skip(captures);\n    return 'hour';\n  }\n};\n\n/**\n * Day\n */\n\nparser.prototype.day = function () {\n  var captures;\n  if (captures = this.lang.rUnit.day.exec(this.str)) {\n    this.skip(captures);\n    return 'day';\n  }\n};\n\n/**\n * Day by name\n */\n\nparser.prototype.dayByName = function () {\n  var captures;\n  var r = new RegExp('^' + this.lang.rDays.source);\n  if (captures = r.exec(this.str)) {\n    var day = captures[1];\n    this.skip(captures);\n    this.date[day](1);\n    return captures[1];\n  }\n};\n\n/**\n * Week\n */\n\nparser.prototype.week = function () {\n  var captures;\n  if (captures = this.lang.rUnit.week.exec(this.str)) {\n    this.skip(captures);\n    return 'week';\n  }\n};\n\n/**\n * Month\n */\n\nparser.prototype.month = function () {\n  var captures;\n  if (captures = this.lang.rUnit.month.exec(this.str)) {\n    this.skip(captures);\n    return 'month';\n  }\n\n};\n\n/**\n * Week\n */\n\nparser.prototype.year = function () {\n  var captures;\n  if (captures = this.lang.rUnit.year.exec(this.str)) {\n    this.skip(captures);\n    return 'year';\n  }\n};\n\n/**\n * Meridiem am/pm\n */\n\nparser.prototype.meridiem = function () {\n  var captures;\n  if (captures = this.lang.rMeridiem.exec(this.str)) {\n    this.skip(captures);\n    this.time(captures[1], captures[3], captures[5], captures[6]);\n    return 'meridiem';\n  }\n};\n\n/**\n * Hour Minute (ex. 12:30)\n */\n\nparser.prototype.hourminute = function () {\n  var captures;\n  if (captures = this.lang.rHourMinute.exec(this.str)) {\n    this.skip(captures);\n    this.time(captures[1], captures[3], captures[5]);\n    return 'hourminute';\n  }\n};\n\n/**\n * Time set helper\n */\n\nparser.prototype.time = function (h, m, s, meridiem) {\n  var d = this.date;\n  var before = d.clone();\n\n  if (meridiem) {\n    // convert to 24 hour\n    h = ('pm' == meridiem) ? +h + 12 : h; // 6pm => 18\n    h = (12 == h && 'am' == meridiem) ? 0 : h; // 12am => 0\n  }\n\n  m = (!m && d.changed('minutes')) ? false : m;\n  s = (!s && d.changed('seconds')) ? false : s;\n  d.time(h, m, s);\n};\n\n/**\n * Best attempt to pick the next time this date will occur\n *\n * TODO: place at the end of the parsing\n */\n\nparser.prototype.nextTime = function (before) {\n  var d = this.date;\n  var orig = this.original;\n\n  if (before <= d.date || this.lang.rPast.all.test(orig)) return this;\n\n  // If time is in the past, we need to guess at the next time\n  if (this.lang.rDays.test(orig)) d.day(7);\n  else d.day(1);\n\n  return this;\n};\n\n/**\n * Yesterday\n */\n\nparser.prototype.yesterday = function () {\n  var captures;\n  if (captures = this.lang.rPast.yesterday.exec(this.str)) {\n    this.skip(captures);\n    this.date.day(-1);\n    return 'yesterday';\n  }\n};\n\n/**\n * Tomorrow\n */\n\nparser.prototype.tomorrow = function () {\n  var captures;\n  if (captures = this.lang.rFuture.tomorrow.exec(this.str)) {\n    this.skip(captures);\n    this.date.day(1);\n    return 'tomorrow';\n  }\n};\n\n/**\n * Noon\n */\n\nparser.prototype.noon = function () {\n  var captures;\n  if (captures = this.lang.rDayMod.noon.exec(this.str)) {\n    this.skip(captures);\n    var before = this.date.clone();\n    this.date.date.setHours(12, 0, 0);\n    return 'noon';\n  }\n};\n\n/**\n * Midnight\n */\n\nparser.prototype.midnight = function () {\n  var captures;\n  if (captures = this.lang.rDayMod.midnight.exec(this.str)) {\n    this.skip(captures);\n    var before = this.date.clone();\n    this.date.date.setHours(0, 0, 0);\n    return 'midnight';\n  }\n};\n\n/**\n * Night (arbitrarily set at 5pm)\n */\n\nparser.prototype.night = function () {\n  var captures;\n  if (captures = this.lang.rDayMod.night.exec(this.str)) {\n    this.skip(captures);\n    this._meridiem = 'pm';\n    var before = this.date.clone();\n    this.date.date.setHours(17, 0, 0);\n    return 'night'\n  }\n};\n\n/**\n * Afternoon (arbitrarily set at 2pm)\n */\n\nparser.prototype.afternoon = function () {\n  var captures;\n  if (captures = this.lang.rDayMod.afternoon.exec(this.str)) {\n    this.skip(captures);\n    this._meridiem = 'pm';\n    var before = this.date.clone();\n\n    if (this.date.changed('hours')) return 'afternoon';\n\n    this.date.date.setHours(14, 0, 0);\n    return 'afternoon';\n  }\n};\n\n\n/**\n * Morning (arbitrarily set at 8am)\n */\n\nparser.prototype.morning = function () {\n  var captures;\n  if (captures = this.lang.rDayMod.morning.exec(this.str)) {\n    this.skip(captures);\n    this._meridiem = 'am';\n    var before = this.date.clone();\n    this.date.date.setHours(8, 0, 0);\n    return 'morning';\n  }\n};\n\n/**\n * Tonight\n */\n\nparser.prototype.tonight = function () {\n  var captures;\n  if (captures = this.lang.rDayMod.tonight.exec(this.str)) {\n    this.skip(captures);\n    this._meridiem = 'pm';\n    return 'tonight';\n  }\n};\n\n/**\n * Next time\n */\n\nparser.prototype._next = function () {\n  var captures;\n  if (captures = this.lang.rDayMod.next.exec(this.str)) {\n    this.skip(captures);\n    var d = new Date(this.date.date);\n    var mod = this.peek();\n\n    // If we have a defined modifier, then update\n    if (this.date[mod]) {\n      this.next();\n      // slight hack to modify already modified\n      this.date = date(d);\n      this.date[mod](1);\n    } else if (this.lang.rDayMod.all.test(mod)) {\n      this.date.day(1);\n    }\n\n    return 'next';\n  }\n};\n\n/**\n * Last time\n */\n\nparser.prototype.last = function () {\n  var captures;\n  if (captures = this.lang.rPast.last.exec(this.str)) {\n    this.skip(captures);\n    var d = new Date(this.date.date);\n    var mod = this.peek();\n\n    // If we have a defined modifier, then update\n    if (this.date[mod]) {\n      this.next();\n      // slight hack to modify already modified\n      this.date = date(d);\n      this.date[mod](-1);\n    } else if (this.lang.rDayMod.all.test(mod)) {\n      this.date.day(-1);\n    }\n\n    return 'last';\n  }\n};\n\n/**\n * Ago\n */\n\nparser.prototype.ago = function () {\n  var captures;\n  if (captures = this.lang.rPast.ago.exec(this.str)) {\n    this.skip(captures);\n    return 'ago';\n  }\n};\n\n/**\n * Number\n */\n\nparser.prototype.number = function () {\n  var captures;\n  if (captures = /^(\\d+)/.exec(this.str)) {\n    var n = captures[1];\n    this.skip(captures);\n    var mod = this.peek();\n\n    // If we have a defined modifier, then update\n    if (this.date[mod]) {\n      if ('ago' == this.peek()) n = -n;\n      this.date[mod](n);\n    } else if (this._meridiem) {\n      // when we don't have meridiem, possibly use context to guess\n      this.time(n, 0, 0, this._meridiem);\n      this._meridiem = null;\n    }\n\n    return 'number';\n  }\n};\n\n/**\n * String\n */\n\nparser.prototype.string = function () {\n  var captures;\n  if (captures = /^\\w+/.exec(this.str)) {\n    this.skip(captures);\n    return 'string';\n  }\n};\n\n/**\n * Other\n */\n\nparser.prototype.other = function () {\n  var captures;\n  if (captures = /^./.exec(this.str)) {\n    this.skip(captures);\n    return 'other';\n  }\n};\n//@ sourceURL=date/lib/parser.js"
));
require.alias("visionmedia-debug/index.js", "date/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "date/deps/debug/debug.js");
require.alias("visionmedia-debug/index.js", "debug/index.js");

require.alias("date/index.js", "date/index.js");

