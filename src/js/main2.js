let snbinder = SNBinder.get_instance({
    login: function(){
    }
});

snbinder.get_named_sections("/templates.htm", null, function(sections) {
    s_templates = sections;
    snbinder.get('/api/test', { v:Date.now() }, true, function(json, data) {
	$("#snbind").html(SNBinder.bind(s_templates['test'], json, 0));
    });
    snbinder.post('/api/test', { v:Date.now() }, true, function(json, data) {
	$("#snbind2").html(SNBinder.bind(s_templates['test'], json, 0));
    });

});
