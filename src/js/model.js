/*!
 * SNModel JavaScript Library 
 *
 * Copyright (c) 2016 Isamu Arimoto ( https://about.me/isamu )
 * Licensed under the MIT license + "keep this comment block even if you modify it".
 *
 */

class SNModel {
    constructor(data, is_new = true) {
	this.is_deleted = false
	this.is_new = is_new;
	this.data = data;
    }
    save(callback) {
	let _model = this;
	if (this.is_new) {
	    this.constructor.create(this.data, (model, template) => {
		_model.data = model.data;
		_model.is_new = false;
		callback(model, template);
	    });
	} else {
	    update(callback);
	}
    }

    update(callback) {
	if (this.is_new) {
	    save();
	} else {
	    let url = this.constructor.urls().update;
	    url = url + "/" + this.data[this.constructor.defined().key];
	    let model = this;

	    this.constructor.template((section) => {
		$.ajax({
		    type: "POST",
		    url: url,
		    data: model.data,
		    retry : 0,
		    retryLimit: 3,
		    success: function(data) {
			let json = SNBinder.evaluate(data);
			if (json.login_required) {
			    return SNBinder.handlers().login(json);
			}
			model.data = json.data;
			model.is_new = false
			let template =  SNBinder.bind(section["update"], json.data, 0);
			
			callback(model, template);
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
		})
	    });
	}
    }

    destroy (callback = null) {
	let url = this.constructor.urls().delete;
	url = url + "/" + this.data[this.constructor.defined().key];
	let model = this;
	let model_data = this.data;
	this.constructor.template((section) => {
	    $.ajax({
		type: "DELETE",
		url: url,
		retry : 0,
		retryLimit: 3,
		success: function(data) {
		    let json = SNBinder.evaluate(data);
		    if (json.login_required) {
			return SNBinder.handlers().login(json);
		    }
		    model.is_deleted = true;
		    model.data = null;
		    if (callback) {
			callback(model_data);
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
	    })
	});
    }
    
    // template file is get from config.
    static set_template_file(template_file) {
	this.template_file = template_file;
    }
    static template(callback){
	if (this.s_sections == null){
	    this.set_template((sections) => {
		callback(sections);
	    });
	} else {
	    callback(this.s_sections);
	}

    }

    static set_template(callback){
	if (this.s_sections) {
	    callback(this.s_sections);
	} else {
	    SNBinder.get_named_sections(this.template_file, null, (sections) => {
		this.s_sections = sections;
		callback(sections);
	    });
	}
    }

    static urls() {
	let _defined = this.defined();
	return _defined.urls;
    }
    static find(cond=null, callback) {
	let url = this.urls().find;
	let model = this;
	this.template((section) => {
	    SNBinder.get(url, cond, true, (json, data) => {
		if (json.login_required) {
		    return SNBinder.handlers().login(json);
                }
		var objects = [];
                var rows = json.data.map(function(item, key) {
		    objects.push(new model(item, false));
		    return SNBinder.bind(section["find"], item, 0);
		});
                callback(objects, rows);
	    });
	});
    }
    static create(data, callback) {
	let url = this.urls().create;
	let model = this;
	this.template((section) => {
            $.ajax({
		type: "PUT",
		url: url,
		data: data,
		retry : 0,
		retryLimit: 3,
		success: function(data) {
		    let json = SNBinder.evaluate(data);
		    if (json.login_required) {
			return SNBinder.handlers().login(json);
		    }
		    model.data = json.data;
		    let template =  SNBinder.bind(section["create"], json.data, 0);
		    
		    callback(model, template);
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
	    })
	});
    }

}

