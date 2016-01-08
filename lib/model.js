"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * SNModel JavaScript Library 
 *
 * Copyright (c) 2016 Isamu Arimoto ( https://about.me/isamu )
 * Licensed under the MIT license + "keep this comment block even if you modify it".
 *
 */

var SNModel = (function () {
	function SNModel(data) {
		var is_new = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

		_classCallCheck(this, SNModel);

		this.is_deleted = false;
		this.is_new = is_new;
		this.data = data;
	}

	_createClass(SNModel, [{
		key: "save",
		value: function save(callback) {
			var _model = this;
			if (this.is_new) {
				this.constructor.create(this.data, function (model, template) {
					_model.data = model.data;
					_model.is_new = false;
					callback(model, template);
				});
			} else {
				update(callback);
			}
		}
	}, {
		key: "update",
		value: function update(callback) {
			var _this = this;

			if (this.is_new) {
				save();
			} else {
				(function () {
					var url = _this.constructor.urls().update;
					url = url + "/" + _this.data[_this.constructor.defined().key];
					var model = _this;

					_this.constructor.template(function (section) {
						$.ajax({
							type: "POST",
							url: url,
							data: model.data,
							retry: 0,
							retryLimit: 3,
							success: function success(data) {
								var json = SNBinder.evaluate(data);
								if (json.login_required) {
									return SNBinder.handlers().login(json);
								}
								model.data = json.data;
								model.is_new = false;
								var template = SNBinder.bind(section["update"], json.data, 0);

								callback(model, template);
							},
							error: function error(XMLHttpRequest, textStatus, errorThrown) {
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
					});
				})();
			}
		}
	}, {
		key: "destroy",
		value: function destroy() {
			var callback = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

			var url = this.constructor.urls().delete;
			url = url + "/" + this.data[this.constructor.defined().key];
			var model = this;
			var model_data = this.data;
			this.constructor.template(function (section) {
				$.ajax({
					type: "DELETE",
					url: url,
					retry: 0,
					retryLimit: 3,
					success: function success(data) {
						var json = SNBinder.evaluate(data);
						if (json.login_required) {
							return SNBinder.handlers().login(json);
						}
						model.is_deleted = true;
						model.data = null;
						if (callback) {
							callback(model_data);
						}
					},
					error: function error(XMLHttpRequest, textStatus, errorThrown) {
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
			});
		}

		// template file is get from config.

	}], [{
		key: "set_template_file",
		value: function set_template_file(template_file) {
			this.template_file = template_file;
		}
	}, {
		key: "template",
		value: function template(callback) {
			if (this.s_sections == null) {
				this.set_template(function (sections) {
					callback(sections);
				});
			} else {
				callback(this.s_sections);
			}
		}
	}, {
		key: "set_template",
		value: function set_template(callback) {
			var _this2 = this;

			if (this.s_sections) {
				callback(this.s_sections);
			} else {
				SNBinder.get_named_sections(this.template_file, null, function (sections) {
					_this2.s_sections = sections;
					callback(sections);
				});
			}
		}
	}, {
		key: "urls",
		value: function urls() {
			var _defined = this.defined();
			return _defined.urls;
		}
	}, {
		key: "find",
		value: function find(cond, callback) {
			var url = this.urls().find;
			var model = this;
			this.template(function (section) {
				$.ajax({
					type: "GET",
					url: url,
					retry: 0,
					retryLimit: 3,
					success: function success(data) {
						var json = SNBinder.evaluate(data);
						if (json.login_required) {
							return SNBinder.handlers().login(json);
						}
						var objects = [];
						var rows = json.data.map(function (item, key) {
							objects.push(new model(item, false));
							return SNBinder.bind(section["find"], item, 0);
						});
						callback(objects, rows);
					},
					error: function error(XMLHttpRequest, textStatus, errorThrown) {
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
			});
		}
	}, {
		key: "create",
		value: function create(data, callback) {
			var url = this.urls().create;
			var model = this;
			this.template(function (section) {
				$.ajax({
					type: "PUT",
					url: url,
					data: data,
					retry: 0,
					retryLimit: 3,
					success: function success(data) {
						var json = SNBinder.evaluate(data);
						if (json.login_required) {
							return SNBinder.handlers().login(json);
						}
						model.data = json.data;
						var template = SNBinder.bind(section["create"], json.data, 0);

						callback(model, template);
					},
					error: function error(XMLHttpRequest, textStatus, errorThrown) {
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
			});
		}
	}]);

	return SNModel;
})();