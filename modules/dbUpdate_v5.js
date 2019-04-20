

var express 	= require("express"),
	fs          = require("fs"),
	bodyParser 	= require("body-parser"),
	mongoose 	= require("mongoose"),
	Cell 		= require("./cellVegaModel.js"),
	app 		= express();
	


//Create and connect to the db
mongoose.connect("mongodb://localhost/vega_db");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



var toolList = ["hhv001", "hhv002"];

function updateDb(clickedTool){

	//New version - only look for new file. the files parsed will be marked as processed.
	toolList.forEach(function(tool){
		var logFolder = "./cache/" + tool;
		fs.readdir(logFolder, function(err, files){
	  		if(err){
	  			console.log("Read Dir error");
	  		} else {
	  			console.log("all files" + files);	
	  		}

	  		
	  	})
	});


	//Working with file. Parse logs from cache folder
	function read(file, cb) {
		fs.readFile(file, "utf-8", function(err, data) {
	    if (!err) {
	        cb(data.toString().split('\n'));
	    } else {
	        console.log(err);
	    }
	  });
	}
	var logPath = "./cache/" + clickedTool +"/TestEquipControllerAndInterface_B101.log";
	var vegaSegment = []; //cell id, start, end, status
	read(logPath, function(teciLine) {
		var cell = [];
	  	//var vegaSegment = []; //cell id, start, end, status

	  
	for(var i in teciLine){ //temp is iteration of line by line.
	    //StartTest: 2016-12-06 12:11:56,595 [16] INFO  [StartTest Event Received for Actual SiteB101]
	  	//EndTest: 2016-12-06 12:11:50,272 [19] INFO  [EndTest Event Received for Actual SiteB101]
		var myRegexp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).+?(\w+Test)\s.+?Site([ABC]\d{3})/g;
		match = myRegexp.exec(teciLine[i]);
		while (match != null) {
			// matched text: match[0]
			// match start: match.index
			// capturing group n: match[n]
			var date = new Date(Date.parse(match[1]));
			var command = match[2];
			var cellId = match[3];
			
	    	cell.push([cellId,command,date]);
	    	match = myRegexp.exec(teciLine[i]);
	    }

	}
	//console.log("all data: " + cell);
	//Add the beginning of shift - 2016-12-06 07:00:00  hardcode for now. Will think about a logic
	//to determine how to start a shift - 7:00 or 19:00
	var shift = new Date("2016-12-06 07:00:00");
	//console.log("shift start with: " + shift);
	//assume all cells are up in the beggning of shift
	var prevState = 0;
	for(var i in cell){
		if (i==0) {
	    	//console.log("first unit");
	    	var start = Math.round((Date.parse(cell[0][2]) - Date.parse(shift))/60000); //minutes
	    	var end = start; //minutes	    	
	    	prevState = end;
	    	vegaSegment.push([cell[0][0],"UP",start,end]);
	    }
	    else {
	    	
	    	//console.log("time in miliseconds: " + cell[i][2]);
	    	//new command - prev command
	    	var timeDiff = Math.round((Date.parse(cell[i][2]) - Date.parse(cell[i-1][2]))/60000); //milliseconds
	    	//console.log("time difference: " + timeDiff/1000); //seconds
	    	
	    	var cellId = cell[i][0];
	    	var start = prevState; //milliseconds
	    	var end = Math.round((Date.parse(cell[i][2]) - Date.parse(shift))/60000); //minutes
	    	
	    	var status = "";
	    	if (timeDiff > 0.3) {
	    		status = "DOWN";
	    	}
	    	else {
	    		status = "UP";
	    	}
	    	vegaSegment.push([cellId, status, start, end]);
	    	prevState = end;
	    }
	    //console.log("\nVegaSegment displayed: " + [cellId, status, start, end]);
	}
	//console.log("this is new blog: + " + vegaSegment);
	//your 'loop' logic goes here, y = cell
  	//console.log("VegaSegment displayed: " + vegaSegment);
  	//update to DB

 			for(var i in vegaSegment)	{
				Cell.create({
					cellId: vegaSegment[i][0],
					cellStatus: vegaSegment[i][1],
					startTime: vegaSegment[i][2],
					endTime: vegaSegment[i][3],
					toolId: clickedTool

				}, function(err, newVega){
					if(err){
						console.log("Errrrr");
					} else {
						console.log("created successfully");
					}
				});

			}
			//console.log("\nCompleted Updating DB\n");

	});

}

module.exports = updateDb;