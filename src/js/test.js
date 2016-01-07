TestModel.set_template_file("/templates.htm");

var debug;
    
TestModel.find({}, function(objects, templates){
    $("#find").html(templates.join(""));
    debug = objects;
    
    objects[0].data.name = "updated name"
    objects[0].update((model, template) => {
	$("#item1").html(template);

	TestModel.create({name: "created"}, (model, template) => {
	    $("#find").append(template);
	});
			
    });
});

