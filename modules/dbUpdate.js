//Treat Start or End is just like a point that the tester is present
//S E S E S E S E

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


//To grab all file names in one folder only and push into an array files.
//To work with all folders later. Now focus on processing each folder first when user click on hhv001
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

//2018-05-21 03:39:32,316
//2018-05-27 06:48:18
//Time stamp rules - month starts from 0. 24hr time format.
var now = new Date(2018, 04, 27, 10, 59, 30); //hard code for checking
//var now = new Date();
var isNow = timeStamp(now);
console.log("at the moment = " + isNow)

var isDay = currentDay(isNow); //only day without time
var ds = isDay + " " + "07:00:00";
var ns = isDay + " " + "19:00:00";
console.log("today shift = " + ds)
console.log("today shift = " + ns)

var isNowMins = Math.round(Date.parse(now)/60000) //hard code for now. change to var timeInMs = Date.now();
var dsStart = Math.round(Date.parse(ds)/60000);
var nsStart = Math.round(Date.parse(ns)/60000);

var shiftStart = 0; //start of current shift in minutes
var shiftEnd = 0; //end of current shift in minutes

if (isNowMins >= dsStart && isNowMins <= nsStart){ //70:00:00 --> 19:00:00
	console.log("Today shift starts at 7AM")
	shiftStart = dsStart;
	shiftEnd = nsStart;
	//console.log("start and end shift " + shiftStart + " " + shiftEnd);
} else if (isNowMins <= dsStart) { //00:00:00 --> 06:59:59
	console.log("Today shift starts at 7PM of the day before")
	//logic to grab the day before
	shiftStart = Math.round(Date.parse(lastShift(isDay))/60000);
	shiftEnd = dsStart;
} else if (isNowMins >= nsStart) { //19:00:00 -->23:59:59
	console.log("Today shift starts at 7PM same day")
	shiftStart = nsStart;
	shiftEnd = dsStart + 24*60; //7:00 of the next day
}


//PLACEHOLDER - TO REMOVE COLLECTIONS FROM DB OF THE PREVIOUS SHIFT. time < shiftStart. No solution for now
//endTime: cell[i].endTime, need to convert to something that has date, time
// var rmvCondition = {endTime: {$lt: shiftStart}};
//Cell.remove(rmvCondition);


function dbUpdate(logPath, callBack){
	//cache/hhv001/TestEquipControllerAndInterface.log.20
	var clickedTool = '';
	var matchPathReg = /cache\/hhv(\w{3})\/TestEquipControllerAndInterface/g;
	console.log("log being processed: ", logPath);

	var matchPath = matchPathReg.exec(logPath);
	if (matchPath != null) {
		clickedTool = 'hhv' + matchPath[1];
	}
	console.log('current tool: ', clickedTool);

	var filenameReg = /processed/ig;
	var ignoreFileReg = /.DS_Store/ig
	if(!filenameReg.exec(logPath) && !ignoreFileReg.exec(logPath)){

		//Now process fresh file. parse log file
		read(logPath, function(teciLines) { //Read file line by line and store into teciline without end of sentence
			var cell = [];
			var cellCalib = [];
			var cellCommLoss = [];
			var cellInit = [];
			for(var i in teciLines){ //temp is iteration of line by line.
				//console.log("getting here???");
			    //StartTest: 2016-12-06 12:11:56,595 [16] INFO  [StartTest Event Received for Actual SiteB101]
			  	//EndTest: 2016-12-06 12:11:50,272 [19] INFO  [EndTest Event Received for Actual SiteB101]
				var myRegexp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).+?(\w+Test)\s.+?Site([ABC]\d{3})/g;
				match = myRegexp.exec(teciLines[i]);
				while (match != null) {
					// matched text: match[0]
					// match start: match.index
					// capturing group n: match[n]
					//console.log("matching??????");

					var timeStamp = Math.round(Date.parse(match[1])/60000); //minutes
					//now, only store information for the current shift, starting 7:00

					//first - defining the shift start: date, time based on the NOW
					var time = timeStamp - shiftStart;
					var command = match[2];
					var tempCell = {};
					var currCell = match[3];
					tempCell['cellId'] = currCell;
					tempCell['endTime'] = time;
					// console.log("start and end shift " + shiftStart + " " + shiftEnd);
					// console.log("timeStamp " + timeStamp);
					//check if logs generated in the current shift
					if ( timeStamp >= shiftStart && timeStamp <= shiftEnd ) {//7-->19: only care logs within shift
						//matching starttest
						if (command == 'StartTest') {
							tempCell['startTime'] = time;
							cell.push(tempCell); //cellId, startTime or endTime
						} else if (command == 'EndTest') {

							var isCell = cell.map(item => item.cellId === currCell).lastIndexOf(true);
							//console.log(isCell);
							//isCell = -1?? teci file starting with end command first
							if (isCell>=0) { //how not to check all the time.
								cell[isCell].endTime = time; //update endTime.
							}
						} else {
							//throw err
							console.log("Errrrrrrrr");
						}
			    	}
			    	match = myRegexp.exec(teciLines[i]);
			    }


				//2014-12-23 05:45:14,377 [8] INFO  [Details of Event sent to CIMConnect EventName = EndTest SITEID = A502 HardBin = 1 SoftBin = 118 DFFInfo =  EFUSEID = N4431410_572_-4_8 ThermalCardID = unknown TIUID = unknown UnitTestStatus = PASS VisualID = 3T448008A07735 GoldenUnitStatus = 0 HandlerUniqueID = U452A0870034-4-12 LOTID = U452A087]
				//Match bin 15 and bin 31 for preventive action - cal and diag
				var binRegexp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).+?SITEID = ([ABC]\d{3})\s+?HardBin = (15|31)/g; //match either 15 or 31
				binMatch = binRegexp.exec(teciLines[i]);

				while (binMatch != null) {
					var timeStamp = Math.round(Date.parse(binMatch[1])/60000); //minutes
					var site = binMatch[2];
					var bin  = binMatch[3];
					var temp = {};
					temp['cellId'] = site;
					temp['bin'] = bin;
					if ( timeStamp >= shiftStart && timeStamp <= shiftEnd ) {//7-->19
						// console.log(site);
						// console.log(bin);
						cellCalib.push(temp);
					}
					binMatch = binRegexp.exec(teciLines[i]);
				}


				//2018-05-21 03:45:07,874 [13] WARN  [New Obj Start SITEID:C201; EventName:AlarmCleared; TimeStamp:2018052103450782; AlarmID:30000; AlarmText:Site Communication Loss; Source:Operator; ]
				//Detecting comm loss
				var commRegexp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).+?SITEID:([ABC]\d{3}).+?AlarmText:Site Communication Loss; Source:Operator;/g; //match either 15 or 31
				commMatch = commRegexp.exec(teciLines[i]);

				while (commMatch != null) {
					var timeStamp = Math.round(Date.parse(commMatch[1])/60000); //minutes
					var site = commMatch[2];
					var alarm = 'Site Communication Loss';
					var temp = {};

					temp['cellId'] = site;
					temp['timeStamp'] = timeStamp;
					temp['alarm'] = alarm;
					if ( timeStamp >= shiftStart && timeStamp <= shiftEnd ) {//7-->19
						//console.log(site);
						//console.log(alarm);
						cellCommLoss.push(temp);
					}

					commMatch = commRegexp.exec(teciLines[i]);
				}


				//2018-05-21 03:52:18,996 [22] INFO  [LotStartAuto200_InitLotFilesStarted Event Received from Actual Site [C201]]
				//Detecting INIT
				var initRegexp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).+?LotStartAuto200_InitLotDataStarted Event Received from Actual Site\s\W([ABC]\d{3})]/g; //match either 15 or 31
				initMatch = initRegexp.exec(teciLines[i]);

				while (initMatch != null) {
					var timeStamp = Math.round(Date.parse(initMatch[1])/60000); //minutes
					var site = initMatch[2];
					var text = 'InitLotDataStarted';
					var temp = {};

					temp['cellId'] = site;
					temp['timeStamp'] = timeStamp;
					temp['text'] = text;
					if ( timeStamp >= shiftStart && timeStamp <= shiftEnd ) {//7-->19
					//	console.log(site);
					//	console.log(text);
						cellInit.push(temp);
					}

					initMatch = initRegexp.exec(teciLines[i]);
				}

			} //end of parsing one file one log

			//NOW UPDATING TO THE DB

			for(var i in cell)	{
				Cell.create({
					cellId: cell[i].cellId,
					startTime: cell[i].startTime,
					endTime: cell[i].endTime,
					toolId: clickedTool

				}, function(err, newVega){
					if(err){
						console.log("Errrrr");
					} else {
						//console.log("created successfully");
						pareLogSuccess = true;
					}
				});
			}

			for(var i in cellCalib)	{
				//updating db for b15 and b31
				cellBin.create({
					cellId: cellCalib[i].cellId,
					bin: cellCalib[i].bin,
					toolId: clickedTool

				}, function(err, newVega){
					if(err){
						console.log("Errrrr");
					} else {
						//console.log("created bin 15 and b31 successfully");
					}
				});
			}


			for(var i in cellCommLoss)	{
				//updating db for site comm loss
				cellComm.create({
					cellId: cellCommLoss[i].cellId,
					timeStamp: cellCommLoss[i].timeStamp,
					alarm: cellCommLoss[i].alarm,
					toolId: clickedTool

				}, function(err, newVega){
					if(err){
						console.log("Errrrr");
					} else {
						//console.log("created site with comm loss successfully");
					}
				});
			}

			for(var i in cellInit)	{
				//updating db for site comm loss
				cellInits.create({
					cellId: cellInit[i].cellId,
					timeStamp: cellInit[i].timeStamp,
					text: cellInit[i].text,
					toolId: clickedTool

				}, function(err, newVega){
					if(err){
						console.log("Errrrr");
					} else {
						//console.log("created init sites successfully");
					}
				});
			}
		//console.log("\nCompleted Updating DB\n");
		}); //END OF READFILE

		//Commented out for now. Rename processed file to be ignored next time.
		var logPathProcessed = logPath + ".processed";
		fs.rename(logPath, logPathProcessed, function(err) {
		    if ( err ) console.log('ERROR: ' + err);
		});
	} //end of if not processed.
	else {
		console.log("file already processed: " + logPath);
	}
	callBack();
} //end of dbupdate


module.exports = dbUpdate;

//function to return previous shift
function lastShift(isDay){
	var date = new Date(isDay); //today without time.
	var yesterday = new Date(date.getTime());
	yesterday.setDate(date.getDate() - 1);

	var prevShift = currentDay(timeStamp(yesterday)) + " " + "19:00:00";
	//console.log("prevShift shift = " + prevShift)
	return prevShift;
}

function currentDay(isNow) {
	var myRegexp = /(\d{4}-\d{2}-\d{2})/g;
	match = myRegexp.exec(isNow);
	var shift = match[1];
	return shift;

}


function timeStamp(now) {

// Create an array with the current month, day and time
  var date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];

// Create an array with the current hour, minute and second
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

// If months and dates are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( date[i] < 10 ) {
      date[i] = "0" + date[i];
    }
  }

// If hours, seconds and minutes are less than 10, add a zero
  for ( var i = 0; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }

// Return the formatted string
  //return date.join("/") + " " + time.join(":") + " " + suffix;
  return date.join("-") + " " + time.join(":");
}


