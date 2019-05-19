var express 	= require("express"),
	fs          = require("fs"),
	bodyParser 	= require("body-parser"),
	mongoose 	= require("mongoose"),
	Cell 		= require("./cellVegaModel.js"),
	cellBin		= require("./cellBinModel.js"),
	cellComm	= require("./cellCommModel.js"),
	cellInits	= require("./cellInitModel.js"),
	app 		= express();

//Create and connect to the db
// mongoose.connect("mongodb://localhost/vega_db");
mongoose.connect("mongodb+srv://evan:evan123@testerdashboard-eqw6b.mongodb.net/test?retryWrites=true");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

function dbUpdate(logPath, callBack){
	console.log("parsing logs and updating db ", logPath);
	callBack();

} //end of dbupdate


module.exports = dbUpdate;