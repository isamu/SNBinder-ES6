class TestModel extends SNModel {
    static defined() {
	let _defined = {
	    columns :
	    {
		id: "number",
		name: "string"
	    },
	    key: "id",
	    urls: {
		create: "/api/test/create",
		find: "/api/test/find",
		update: "/api/test/update",
		delete: "/api/test/delete"
	    }
	}
	return _defined;
    }
}
