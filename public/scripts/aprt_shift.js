var aprt = [];
function PrepareGraph()
{
	    aprt=
		{
		    chart: {
		        type: 'boxplot'
		    },

		    title: {
		        text: 'HDMT APRT Tracking'
		    },

		    legend: {
		        enabled: false
		    },

		    xAxis: {
		        categories: ['1', '2', '3', '4', '5'],
		        title: {
		            text: 'Shifts'
		        }
		    },

		    yAxis: {
		        title: {
		            text: 'Aprt'
		        },
		        plotLines: [{
		            value: 932,
		            color: 'red',
		            width: 1,
		            label: {
		                text: 'Theoretical mean: 932',
		                align: 'center',
		                style: {
		                    color: 'gray'
		                }
		            }
		        }]
		    },

		    series: [{
		        name: 'Aprt',
		        data: [
                    [760, 801, 848, 895, 965],
                    [733, 853, 939, 980, 1080],
                    [714, 762, 817, 870, 918],
                    [724, 802, 806, 871, 950],
                    [834, 836, 864, 882, 910]
		        ],
		        tooltip: {
		            headerFormat: '<em>Lot {point.key}</em><br/>'
		        }
		    }, {
		        name: 'Outlier',
		        color: Highcharts.getOptions().colors[0],
		        type: 'scatter',
		        data: [ // x, y positions where 0 is the first category
                    [0, 644],
                    [4, 718],
                    [4, 951],
                    [4, 969]
		        ],
		        marker: {
		            fillColor: 'white',
		            lineWidth: 1,
		            lineColor: Highcharts.getOptions().colors[0]
		        },
		        tooltip: {
		            pointFormat: 'Observation: {point.y}'
		        }
		    }]
		}

	    
}


function RetestGraph()
{
    $('#divGraph').highcharts(aprt);
}


