/*!
 * SNBinder JavaScript Library 
 *
 * Copyright (c) 2009 Satoshi Nakajima (Twitter: @snakajima, Blog:http://satoshi.blogs.com/uie)
 * Licensed under the MIT license + "keep this comment block even if you modify it".
 *
 * SNBinder-ES6
 * Copyright (c) 2016 Isamu Arimoto
 *
 * History:
 *  02-12-2010 Created for the project "Entertain LA" (http://entertainla.com)
 *  01-20-2011 Published as snbinder-0.5.3.js
 *  01-03-2016 Forked SNBinder-ES6
 *
 */


let instance = null;
let s_templates = null;

class SNBinder {

    constructor (_handlers = {}) {
	if(!instance){
	    this.__handlers = Object.assign(this.defalut_handler(), _handlers);
	    this.__cache = {};
            instance = this;
        }
	return instance;
    }

    defalut_handler () {
	return {
            isDebug: function() {
		return /localhost:8/.test(window.location.href);
            },
            error: function(verb, url) {
		alert("The server is not accessible ("+verb+"):" + url);
            },
            debug: {
		delay: 200
            },
            login: function() {
		alert("must be implemented by the application");
            }
	};
    }
    
    isDebug () {
        return this.__handlers.isDebug();
    }

    flush_all () {
        this.__cache = {};
    }
    cache (url) {
        return this.__cache[url];
    }
    set_cache(url, data){
	this.__cache[url] = data;
    }
    flush (url, params) {
        url = params ? (url + "?" + jQuery.param(params)) : url;
        this.__cache[url] = null;
    }
    get_sections (url, params, callback, _options) {
        SNBinder.get(url, params, false, function(data) {
            callback(data.split('{%}'));
        }, _options);
    }
    get_named_sections (url, params, callback, _options) {
        SNBinder.get(url, params, false, function(data) {
            var sections = data.split('{%}').slice(1);
            var count = sections.length;
            var dict = {};
            for (var i=0; i<count; i++) {
                dict[sections[i*2]] = sections[i*2+1];
            }
            callback(dict);
        }, _options);
    }
    handlers () {
	return this.__handlers;
    }
    get (url, params, isJson, callback, _options) {
        var options  = {
            bypass_cache: false,
            cache_result: true
        };
        $.extend(options, _options); 
        
        var url = params ? (url + "?" + jQuery.param(params)) : url;
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
            if (SNBinder.handlers().debug.delay > 0 && SNBinder.handlers().isDebug()) {
                window.setTimeout(_attempt, SNBinder.handlers().debug.delay);
            }
	    
            $.ajax({
                type: "GET",
                url: url,
		retry : 0,
		retryLimit: 3,
                success: function(data) {
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
                error: function (XMLHttpRequest, textStatus, errorThrown) {
		    if (textStatus == 'timeout') {
			this.retry++;
			if (this.retry < this.retryLimit) {
			    $.ajax(this);
			    return;
			}
		    }
                    SNBinder.handlers().error("get", url);
                }
            });
        }
    }
    post (url, params, isJson, callback) {
        if (SNBinder.handlers().debug.delay > 0 && SNBinder.handlers().isDebug()) {
	    window.setTimeout(_attempt, SNBinder.handlers().debug.delay);
        }
	    
        $.ajax({
	    type: "POST",
	    url: url,
	    data: jQuery.param(params ? params : {}),
	    retry : 0,
	    retryLimit: 3,
	    success: function(data) {
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
	    error: function (XMLHttpRequest, textStatus, errorThrown) {
		var json = null;
		if(XMLHttpRequest.status == 401 && isJson){
		    json = SNBinder.evaluate(XMLHttpRequest.responseText);
		    if (json.login_required) {
                        return SNBinder.handlers().login(json);
		    }
		}
		if (textStatus == 'timeout') {
		    this.retry++;
		    if (this.retry < this.retryLimit) {
			$.ajax(this);
			return;
		    }
		}
		SNBinder.handlers().error("post", url);
	    }
        });
    } // end of post

    compile (htm) {
        var _templatize = function(htm) {
            return '"' + htm.replace(/\"/g, "'")
                .replace(/[\r\n]/g, " ")
                .replace(/\$\(index\)/g, '"+index+"')
                 .replace(/\$\(\.([a-z0-9_\.]*)\)/gi, '"+SNBinder.escape(""+row.$1)+"')
                 .replace(/\$\(\+([a-z0-9_\.]*)\)/gi, '"+SNBinder.urlencode(""+row.$1)+"')
                .replace(/\$\(\_([a-z0-9_\.]*)\)/gi, '"+row.$1+"')
                +'"';
        }; // "
        var _func;
        eval("_func = function(row, index) { return (" + _templatize(htm) + "); };");
        return _func;
    }
    bind (htm, data, index) {
        var _func = this.compile(htm);
        return _func(data, index);
    }
    bind_rowset (htm, rowset) {
        var rows = [];
        var _func = this.compile(htm);
        for (index in rowset) {
            rows.push(_func(rowset[index], index));
        }
        return rows.join('');
    }
    static evaluate (json) {
        if (typeof(json) == 'object') {
            return json;
        }            
        try {
            var obj;
            eval("obj=" + json);
            return obj;
        } catch(err) {
            alert(err + ":" + json);
        }
        return {};
    }
    static escape (text) { 
        return text.replace(/&/g, '&amp;')
            .replace(/'/g, '&#146;') //'
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br />');
    }
    static urlencode (text) {
	return encodeURIComponent(text);
    }
    static handlers () {
	let snbinder = SNBinder.get_instance();
	return snbinder.handlers();
    }
    
    static get_instance(_handlers = {}) {
	if(!instance){
            instance = new SNBinder(_handlers);
        }
	return instance;
    }
    static set_cache(url, data){
	let snbinder = SNBinder.get_instance();
	return snbinder.set_cache(url, data);
    }
    // backward compatibility
    static init (_handlers = {}) {
	return SNBinder.get_instance(_handlers);
    }
    static get_named_sections(url, params, callback, _options) {
	let snbinder = SNBinder.get_instance();
	return snbinder.get_named_sections(url, params, callback, _options);
    }
    static get(url, params, isJson, callback, _options) {
	let snbinder = SNBinder.get_instance();
	return snbinder.get(url, params, isJson, callback, _options);
    }
    static post(url, params, isJson, callback, _options) {
	let snbinder = SNBinder.get_instance();
	return snbinder.post(url, params, isJson, callback, _options);
    }
    static bind(htm, data, index) {
	let snbinder = SNBinder.get_instance();
	return snbinder.bind(htm, data, index);
    }
}

