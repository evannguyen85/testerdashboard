var db 			= require("./modules/dbUpdate.js");
function parseAndupdate(clickedTool) {
	db.updateDb("clickedTool");
}