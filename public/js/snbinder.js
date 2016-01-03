"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var instance = null;
var s_templates = null;

var SNBinder = (function () {
    function SNBinder() {
        var _handlers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, SNBinder);

        if (!instance) {
            this.__handlers = Object.assign(this.defalut_handler(), _handlers);
            this.__cache = {};
            instance = this;
        }
        return instance;
    }

    _createClass(SNBinder, [{
        key: "defalut_handler",
        value: function defalut_handler() {
            return {
                isDebug: function isDebug() {
                    return (/localhost:8/.test(window.location.href)
                    );
                },
                error: function error(verb, url) {
                    alert("The server is not accessible (" + verb + "):" + url);
                },
                debug: {
                    delay: 200
                },
                login: function login() {
                    alert("must be implemented by the application");
                }
            };
        }
    }, {
        key: "isDebug",
        value: function isDebug() {
            return this.__handlers.isDebug();
        }
    }, {
        key: "flush_all",
        value: function flush_all() {
            this.__cache = {};
        }
    }, {
        key: "cache",
        value: function cache(url) {
            return this.__cache[url];
        }
    }, {
        key: "set_cache",
        value: function set_cache(url, data) {
            this.__cache[url] = data;
        }
    }, {
        key: "flush",
        value: function flush(url, params) {
            url = params ? url + "?" + jQuery.param(params) : url;
            this.__cache[url] = null;
        }
    }, {
        key: "get_sections",
        value: function get_sections(url, params, callback, _options) {
            SNBinder.get(url, params, false, function (data) {
                callback(data.split('{%}'));
            }, _options);
        }
    }, {
        key: "get_named_sections",
        value: function get_named_sections(url, params, callback, _options) {
            SNBinder.get(url, params, false, function (data) {
                var sections = data.split('{%}').slice(1);
                var count = sections.length;
                var dict = {};
                for (var i = 0; i < count; i++) {
                    dict[sections[i * 2]] = sections[i * 2 + 1];
                }
                callback(dict);
            }, _options);
        }
    }, {
        key: "handlers",
        value: function handlers() {
            return this.__handlers;
        }
    }, {
        key: "get",
        value: function get(url, params, isJson, callback, _options) {
            var options = {
                bypass_cache: false,
                cache_result: true
            };
            $.extend(options, _options);

            var url = params ? url + "?" + jQuery.param(params) : url;
            if (options.bypass_cache) {
                this.__cache[url] = null;
            }
            if (this.__cache[url]) {
                var data = this.__cache[url];
                if (isJson) {
                    var json = this.evaluate(data);
                    callback(json, data);
                } else {
                    callback(data);
                }
            } else {
                (function (callback) {
                    var retry = 0;
                    var _attempt = function _attempt() {
                        if (SNBinder.handlers().debug.delay > 0 && SNBinder.handlers().isDebug()) {
                            if (retry === 0) {
                                retry++;
                                window.setTimeout(_attempt, SNBinder.handlers().debug.delay);
                                return;
                            }
                        }

                        $.ajax({
                            type: "GET",
                            url: url,
                            success: function success(data) {
                                var json = null;
                                if (isJson) {
                                    json = SNBinder.evaluate(data);
                                    if (json.login_required) {
                                        return SNBinder.handlers().login(json);
                                    }
                                }
                                if (options.cache_result) {
                                    SNBinder.set_cache(url, data);
                                }
                                if (isJson) {
                                    callback(json, data);
                                } else {
                                    callback(data);
                                }
                            },
                            error: function error() {
                                if (retry < 3) {
                                    retry++;
                                    _attempt();
                                } else {
                                    SNBinder.handlers().error("get", url);
                                }
                            }
                        });
                    };
                    _attempt();
                })(callback);
            }
        }
    }, {
        key: "post",
        value: function post(url, params, isJson, callback) {
            (function () {
                var retry = 0;
                var _attempt = function _attempt() {
                    if (SNBinder.handlers().debug.delay > 0 && SNBinder.handlers().isDebug()) {
                        if (retry === 0) {
                            retry++;
                            window.setTimeout(_attempt, SNBinder.handlers().debug.delay);
                            return;
                        }
                    }

                    $.ajax({
                        type: "POST",
                        url: url,
                        data: jQuery.param(params ? params : {}),
                        success: function success(data) {
                            var json = null;
                            if (isJson) {
                                json = SNBinder.evaluate(data);
                                if (json.login_required) {
                                    return SNBinder.handlers().login(json);
                                }
                            }
                            if (isJson) {
                                callback(json, data);
                            } else {
                                callback(data);
                            }
                        },
                        error: function error(XMLHttpRequest, textStatus, errorThrown) {
                            var json = null;
                            if (XMLHttpRequest.status == 401 && isJson) {
                                json = SNBinder.evaluate(XMLHttpRequest.responseText);
                                if (json.login_required) {
                                    return SNBinder.handlers().login(json);
                                }
                            }
                            if (retry < 3) {
                                retry++;
                                _attempt();
                            } else {
                                SNBinder.handlers().error("post", url);
                            }
                        }
                    });
                };
                _attempt();
            })();
        } // end of post

    }, {
        key: "evaluate",
        value: function evaluate(json) {
            if ((typeof json === "undefined" ? "undefined" : _typeof(json)) == 'object') {
                return json;
            }
            try {
                var obj;
                eval("obj=" + json);
                return obj;
            } catch (err) {
                alert(err + ":" + json);
            }
            return {};
        }
    }, {
        key: "compile",
        value: function compile(htm) {
            var _templatize = function _templatize(htm) {
                return '"' + htm.replace(/\"/g, "'").replace(/[\r\n]/g, " ").replace(/\$\(index\)/g, '"+index+"').replace(/\$\(\.([a-z0-9_\.]*)\)/gi, '"+SNBinder.escape(""+row.$1)+"').replace(/\$\(\+([a-z0-9_\.]*)\)/gi, '"+SNBinder.urlencode(""+row.$1)+"').replace(/\$\(\_([a-z0-9_\.]*)\)/gi, '"+row.$1+"') + '"';
            }; // "
            var _func;
            eval("_func = function(row, index) { return (" + _templatize(htm) + "); };");
            return _func;
        }
    }, {
        key: "bind",
        value: function bind(htm, data, index) {
            var _func = this.compile(htm);
            return _func(data, index);
        }
    }, {
        key: "bind_rowset",
        value: function bind_rowset(htm, rowset) {
            var rows = [];
            var _func = this.compile(htm);
            for (index in rowset) {
                rows.push(_func(rowset[index], index));
            }
            return rows.join('');
        }
    }], [{
        key: "escape",
        value: function escape(text) {
            return text.replace(/&/g, '&amp;').replace(/'/g, '&#146;') //'
            .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />');
        }
    }, {
        key: "urlencode",
        value: function urlencode(text) {
            return encodeURIComponent(text);
        }
    }, {
        key: "get_instance",
        value: function get_instance() {
            var _handlers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            if (!instance) {
                instance = new SNBinder(_handlers);
            }
            return instance;
        }
    }, {
        key: "init",
        value: function init() {
            var _handlers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            return SNBinder.get_instance(_handlers);
        }
    }, {
        key: "get_named_sections",
        value: function get_named_sections(url, params, callback, _options) {
            var snbinder = SNBinder.get_instance();
            return snbinder.get_named_sections(url, params, callback, _options);
        }
    }, {
        key: "get",
        value: function get(url, params, isJson, callback, _options) {
            var snbinder = SNBinder.get_instance();
            return snbinder.get(url, params, isJson, callback, _options);
        }
    }, {
        key: "post",
        value: function post(url, params, isJson, callback, _options) {
            var snbinder = SNBinder.get_instance();
            return snbinder.post(url, params, isJson, callback, _options);
        }
    }, {
        key: "bind",
        value: function bind(htm, data, index) {
            var snbinder = SNBinder.get_instance();
            return snbinder.bind(htm, data, index);
        }
    }, {
        key: "handlers",
        value: function handlers() {
            var snbinder = SNBinder.get_instance();
            return snbinder.handlers();
        }
    }, {
        key: "evaluate",
        value: function evaluate(json) {
            var snbinder = SNBinder.get_instance();
            return snbinder.evaluate(json);
        }
    }, {
        key: "set_cache",
        value: function set_cache(url, data) {
            var snbinder = SNBinder.get_instance();
            return snbinder.set_cache(url, data);
        }
    }]);

    return SNBinder;
})();