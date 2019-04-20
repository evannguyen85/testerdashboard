Final version:
Steps to run:
1) clean up all records in the db for all models: cellinits, cellbins, cellcomms, cells.
2) run app.js
3) run updatingDB.js --> this will detect if any new logs, then process and update db.
4) open browser and localhost to display the charts.



#V4 works for multiple tools, starting with hhv001 and hhv002.
* add index.ejs: home, without showing any tool chart.
* Change hhv001.ejs to vega.ejs - generic for all tools.
* add toolId = grab from click. current toolId

#v5:
* Write all module to parse logs
* When user click on HHV001, call the module, parse logs and update db

#next steps:
* dbUpdate.ejs: only update the latest logs - or new logs.
* click on one tool and update the db. it seems now not working 
* handle large data set (right now, >1000sets seems crashing) - how to improve performance?
* accuracy of charts. - think about the logic of updating db, and status - may refer to Huu.



group cell id first, and then loop in 
use lodash.

process data in app.js before render 
vega.ejs.


so sanh element cuoi cung cua list serie - status voi sr. va update neu giong.

vega:
1.
- id: B101
- start: 0
- end: 10
- status: up
2.
- id: 101
- start: 10
- end: 20
- status: up

1.
- id: B101
- start: 0
- end: 20
- status: up
90% time = 
2.
- id
- start: 20
- end: 30
- status: down



còn chỗ foreach thì anh thử thế này xem: phần tử đầu tiên lấy cái time + duration < time của phần tử kế tiếp thì Down ko thì up rồi nhảy tới phần tử thứ 3

for ( i = 0, l = cells.length; i < l; i +=2) { cells[i].time + duration < cells[i+1].time} then Down else UP


* Next steps:
- purge old data of the db
- improve logics to update db - reduce # of datapoints
- improve log parser to handle missing end command or start command when changing to new files.
- decouple dbupdate and log parser
- improve title of chart, having tool ID: 

for the purpose of demo, it's fine now.

** Enhancement:
- Count the number of bad bins and trigger if >3 consecutively
- Count site communication loss events: up and down for some times: intermittent --> Col trip if 50% of cell loss comm in a few hours.
- Run Diagnostics.
- a table to show cell avalability within the shift for each tool. and different shifts. and a button to retrieve infomration.
** How to implement this?
- GUI: Add an area on the right for summary report.
- Add counts.
- Add more Regex. 
User actions:
- Click on the tool.
- Appear the chart.
- Appear action panel.


** Machine Learning:
- Learn the concept.
- Learn the tool.



