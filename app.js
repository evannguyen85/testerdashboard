var fs          = require("fs"),
	bodyParser 	= require("body-parser"),
	updateDb	= require("./modules/dbUpdate.js");
	mongoose 	= require("mongoose"),
	Cell 		= require("./modules/cellVegaModel.js"),
	cellBin		= require("./modules/cellBinModel.js"),
	cellComm	= require("./modules/cellCommModel.js"),
	cellInits	= require("./modules/cellInitModel.js"),
	express 	= require("express"),
	app 		= express();

const port = process.env.PORT || 8080;

//Create and connect to the db
// mongoose.connect("mongodb://localhost/vega_db");
mongoose.connect("mongodb+srv://evan:evan123@testerdashboard-eqw6b.mongodb.net/test?retryWrites=true");
// mongodb+srv://evan:evan123@testerdashboard-eqw6b.mongodb.net/test?retryWrites=true

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));


//parse logs and update all tools before rendering charts. having problem with call back function, so use this hard code way
//var tools = ["hhv001", "hhv002", "hhv003"];

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

function parseFolder(workingTool){
	//var logPath = "./cache/" + clickedTool +"/TestEquipControllerAndInterface.log.1_demo" //hardcode for now
	//console.log("getting in here?")
	var currentFolder = "./cache/" + workingTool;
	fs.readdir(currentFolder, function(err, files){
		if(err){
			console.log("Read Dir error" + currentFolder);
		} else {
			files.forEach(function(file){
				var filenameReg = /processed/ig;
				var ignoreFileReg = /.DS_Store/ig
				if(!filenameReg.exec(file) && !ignoreFileReg.exec(file)){
					var logPath = currentFolder + "/" + file;
					updateDb(logPath, function(){
						console.log("Done Updating database: ", logPath);
					});
				}
			});
		}
	});
}


var tools = ["hhv001", "hhv002"];
for (var i =0, len = tools.length; i<len; i++) {
		parseFolder(tools[i]);
}

//RESTful" ROUTES
//Index route
app.get("/", function(req, res){
	res.redirect("about");
});

app.get("/about", function(req, res){
	res.render("about");
});


app.get("/cellSummary", function(req, res){
	res.render("cellSummary");
});

//hhv001
renderChart("hhv001");
//hhv002
renderChart("hhv002");
//hhv003
renderChart("hhv003");
//hhv004
renderChart("hhv004");

function cellSummary(vegacells){
			//process data here and render.
			//creating samples for cells and passing to vega.ejs. hardcode for now.
			var cs = []; //temp array of cellSumm. this is repeative for now.
	        var prevCellId = "";
			var prevEndTime = 0; //Starting point
			var tdownTemp = 0;
			var now = 720; //current point of the moment.
			var celldb = [];

			for (var i=0, len = vegacells.length; i<len; i = i+1) {
    			var currCell = vegacells[i].cellId;
    			celldb.push(currCell);
    			var start = vegacells[i].startTime;
    			var end = vegacells[i].endTime;
    			var gap = 0;

    			//console.log("current cell: " + currCell);
    			//check if new cell. improvement - grouping lodash. this is to change to the new cell.
				// if (currCell !== prevCellId) {
    // 				prevEndTime = 0;
    // 			}
    			//never match this one
				if ((currCell !== prevCellId) && (prevCellId !== "")) {
    				//console.log("updating cell: " + prevEndTime);
    				//duration from last point of the cell  to now.
    				var temp = {};
    				var lastEnd = now - prevEndTime;//can phai coi lai
    				temp['cellId'] = prevCellId;
					temp['tDown'] = tdownTemp + lastEnd;
					temp['cellDown'] = Math.round(tdownTemp/now*100);
					cs.push(temp);
					tdownTemp = 0;
					prevEndTime = 0;

				}

				gap = start - prevEndTime;
				if (gap > 4) {
	      	        //capture down time for the cell:
					//temp['cellId'] = currCell;
					//temp['tDown'] = gap;
					//cs.push(temp);
					tdownTemp += gap;
					//console.log("cell with gap: " + currCell);
					//console.log("gap: " + gap)

				}
				//the last cell in the vegadb - there is no comparison to trigger a new cell.
				//later will bring this one out with cellvega[len-1]
				if (i == len -1) {
					var lastEnd = 0;
					if (end == 0) {
						lastEnd = now - start; // last units to now. tinh tu start vi so la end no nhay sang log khac
					} else {
						lastEnd = now - end; // last units to now. tinh tu start vi so la end no nhay sang log khac
					}

					var temp = {};
					console.log('start: ' + start + ' ' + end);
					if (lastEnd > 4) {tdownTemp += lastEnd;}
					temp['cellId'] = currCell;
					temp['tDown'] = tdownTemp;
					temp['cellDown'] = Math.round(tdownTemp/now*100);
					cs.push(temp);
					tdownTemp = 0;
				}
	            prevEndTime = end; //update new prevTime.
	            prevCellId = currCell;
			};

			var cellLabels = ['A101','A102','A201','A202','A301','A302','A401','A402','A501','A502','B101','B102','B201','B202','B301','B302','B401','B402','B501','B502','C101','C102','C201','C202','C301','C302','C401','C402','C501','C502'];
			for (var i = 0, len = cellLabels.length; i<len; i++) {
				var found = celldb.indexOf(cellLabels[i]);
				var temp = {};
				if (found == -1) {
					//console.log("Cell not in testing:" + cellLabels[i]);
					tdownTemp = now;
					temp['cellId'] = cellLabels[i];
					temp['tDown'] = tdownTemp;
					temp['cellDown'] = Math.round(tdownTemp/now*100);
					cs.push(temp);
					tdownTemp = 0;
				} else {
					//console.log("Cell in testing:" + cellLabels[i]);
				}
			}

			return cs;
}



function cellStatusUpdate(vegacells){
			//process data here and render.
			//creating samples for cells and passing to vega.ejs. hardcode for now.
			var cells = [];
			var prevCellId = "";
			var prevEndTime = 0; //Starting point

			for (var i=0, len = vegacells.length; i<len; i = i+1) {
    			var currCell = vegacells[i].cellId;
    			// var start = vegacells[i].startTime - shiftStart;
    			// var end = vegacells[i].endTime - shiftStart;

    			var start = vegacells[i].startTime;
    			var end = vegacells[i].endTime;

    			var gap = 0;
    			var es = {}; //array of E-S
    			var se = {}; //array of S-E
    			//console.log(start)

    			//check if new cell. improvement - grouping lodash.
    			if (currCell !== prevCellId) {
    				prevEndTime = 0;

  				}
				gap = start - prevEndTime;
				if (gap > 4) {

		            es['color'] = 'red'; //cannot set property of color. why here got problem??
		            es['name'] = currCell;
					es['startTest'] = prevEndTime;
					es['endTest']= start;

					se['color'] = "green";
	    			se['name'] = currCell;
					se['startTest'] = start;
					se['endTest']= end;
					cells.push(es,se);

				} else { //same color green, update from prev time to end.
		            es['color'] = 'green'; //cell up
		            es['name'] = currCell;
					es['startTest'] = prevEndTime;
					es['endTest']= end;
		            cells.push(es);
				}
	            prevEndTime = end; //update new prevTime.
	            prevCellId = currCell;
			};
			return cells;
}

//now fetching bin 15 and bin31 data from db.

var cellCal = [];
function cellBinSummary(currTool){
	var query = {toolId: currTool};

	cellBin.find(query).sort({"cellId" : 1, "bin": 1}).exec(function(err, cellBinDb) {
		if(err){
			console.log("errr!!!");
		} else{
			var temp = {};
			var binCalLimit = 10;
			cellCal = compressArray(cellBinDb,binCalLimit);
			// for (var i in cellCal) {
			// 	console.log(cellCal[i].cellId + ' ' + cellCal[i].bin + ' ' + cellCal[i].count);
			// }
		}
	});
}
var cellCommLoss = [];
function cellCommSummary(currTool){
	var query = {toolId: currTool};


	cellComm.find(query).sort({"cellId" : 1}).exec(function(err, cellCommDb) {
		if(err){
			console.log("errr!!!");
		} else{
			var temp = {};
			var commLossLimit = 2;
			cellCommLoss = uniqueArray(cellCommDb,commLossLimit);
			for (var i in cellCommLoss) {
				console.log('Communication Loss: ' + cellCommLoss[i].cellId + ' ' + cellCommLoss[i].count);
			}
		}
	});
}

var cellInit = [];
function cellInitsSummary(currTool){
	var query = {toolId: currTool};


	cellInits.find(query).sort({"cellId" : 1}).exec(function(err, cellInitDb) {
		if(err){
			console.log("errr!!!");
		} else{
			var temp = {};
			var initLimit = 5;
			cellInit = uniqueArray(cellInitDb,initLimit);
			for (var i in cellInit) {
				console.log('Cells doing init: ' + cellInit[i].cellId + ' ' + cellInit[i].count);
			}
		}
	});
}

function renderChart(activeTool) {
	var reqtool = "/" + activeTool;
	var currentTool = activeTool;
	app.get(reqtool, function(req, res){
		var query = {toolId: activeTool};
		Cell.find(query).sort({"cellId" : 1, "startTime": 1}).exec(function(err, vegacellsDb) {
			if(err){
				console.log("errr!!!");
			} else{
				var cells = [];

				cells = cellStatusUpdate(vegacellsDb);
				if (cells === undefined || cells.length == 0) {
    				// array empty or does not exist
    				console.log("cells empty");
    				res.render("emptyRecord", {currentTool: currentTool});

				}

				else {
					var cellSumm = [];
					var cellAlarm = [];
					// var celldb = [];
					cellSumm = cellSummary(vegacellsDb);
					//console.log("return cellSummary " + cellSumm);

					for (var i=0, len = cellSumm.length; i<len; i = i+1) {
						var temp = {};
						//only pass the alarming cells to ejs
						if (cellSumm[i].cellDown > 30) {
							temp['cellId'] = cellSumm[i].cellId;
							temp['tDown'] = cellSumm[i].tDown;
							temp['cellDown'] = cellSumm[i].cellDown;
							cellAlarm.push(temp);
						}
					}
					cellBinSummary(activeTool);
					cellCommSummary(activeTool);
					cellInitsSummary(activeTool);

					res.render("vega", {currentTool: currentTool , cells: cells, cellAlarm: cellAlarm, cellCal: cellCal, cellCommLoss: cellCommLoss, cellInit: cellInit}); //passing 2 variables
						//console.log("successfully?? " + cells);
				}
			}
		})
	});

}

//one bin for now
function compressArray(original,limit) {

	var compressed = [];
	//copy into another array
	var copy = original.slice();

	for (var i = 0; i < original.length; i++) {
 		var myCount = 0;
		//	console.log(original[i].cellId);
		// loop over every element in the copy and see if it's the same
		//var j = 0;
		for (var w = 0; w < copy.length; w++) {
			//this.isEqual(object, other);
			if ((original[i].cellId == copy[w].cellId) && (original[i].bin == copy[w].bin)) {
				// increase amount of times duplicate is found
				//console.log(copy[w].cellId);
				myCount = myCount + 1;
				//console.log(myCount);
				// sets item to undefined
				//delete copy[w].cellId;
				//delete copy[w].bin;
				copy.splice(w,1);
				w = w - 1;

			}
		}

		if (myCount > limit) {
			var a = new Object();
			a.cellId = original[i].cellId;
			a.bin = original[i].bin;
			a.count = myCount;
			compressed.push(a);

		}

	}


	return compressed;
};


function uniqueArray(original, limit) {

	var compressed = [];
	//copy into another array
	var copy = original.slice();

	for (var i = 0; i < original.length; i++) {
 		var myCount = 0;
		//	console.log(original[i].cellId);
		// loop over every element in the copy and see if it's the same
		//var j = 0;
		for (var w = 0; w < copy.length; w++) {
			//this.isEqual(object, other);
			if (original[i].cellId == copy[w].cellId) {
				// increase amount of times duplicate is found
				//console.log(copy[w].cellId);
				myCount = myCount + 1;
				//console.log(myCount);
				// sets item to undefined
				//delete copy[w].cellId;
				//delete copy[w].bin;
				copy.splice(w,1);
				w = w - 1;

			}
		}

		if (myCount > limit) {
			var a = new Object();
			a.cellId = original[i].cellId;
			a.count = myCount;
			compressed.push(a);

		}

	}


	return compressed;
};

//Listen
// app.listen(3000, function(){
// 	console.log("SERVER HAS STARTED");
// });

app.listen(port, ()=> {console.log('server is running')});
