var express 	= require("express"),
	mongoose 	= require("mongoose");

//how to resolve Cannot overwrite 'users' model once compiled.
//intantiate the schema once, and then have a globale object call it when needs it.

var binSchema = new mongoose.Schema({
	cellId: String,
	bin: String,
	toolId: String
});

//Export function to create "Cell" model class, then this will be a global model used by others.
module.exports = mongoose.model("cellBin",binSchema);