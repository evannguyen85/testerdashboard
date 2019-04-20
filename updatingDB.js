var fs          = require("fs"),
	bodyParser 	= require("body-parser"),
	updateDb	= require("./modules/dbUpdate.js");
	//updateDb	= require("./modules/tryCallBack.js");
	mongoose 	= require("mongoose"),
	Cell 		= require("./modules/cellVegaModel.js"),
	cellBin		= require("./modules/cellBinModel.js"),
	cellComm	= require("./modules/cellCommModel.js"),
	cellInits	= require("./modules/cellInitModel.js"),
	express 	= require("express"),
	app 		= express();
	

//Create and connect to the db
mongoose.connect("mongodb://localhost/vega_db");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

var chokidar = require('chokidar');
var currentFolder = './cache/';
var watcher = chokidar.watch(currentFolder, {ignored: '*.processed', persistent: true});

watcher
  .on('add', function(path) {
  	console.log('File', path, 'has been added');
  	var filenameReg = /processed/ig;
	var ignoreFileReg = /.DS_Store/ig
	if(!filenameReg.exec(path) && !ignoreFileReg.exec(path)){
	  	updateDb(path, function(){
  		console.log("Done updating db for ", path);
  		});
  	}
  })


  // .on('change', function(path) {console.log('File', path, 'has been changed');})
  // .on('unlink', function(path) {console.log('File', path, 'has been removed');})
  // .on('error', function(error) {console.error('Error happened', error);})
