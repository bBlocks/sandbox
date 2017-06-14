'use strict';
// Starting parameters
var params = {
	itemsCount: 1500,
	pageSize: 150,
	currentPage: 1
};

// Generate JSON data like [{column1: 'Cell 1 1', column2: 'Cell 1 2', ...}, ...]
function generateData(currentPage, pageSize, itemsCount, startColumn, endColumn, maxColumns) {
	var row, i, j,
		data = [],
		maxColumns = maxColumns || 10;

	// Which columns to render
	if (!startColumn) {
		startColumn = 1;
	}
	if (!endColumn) {
		endColumn = maxColumns;
	}

	for (i = (currentPage - 1) * pageSize + 1; i <= currentPage * pageSize; i++) {
		if (i > itemsCount) { break; }
		row = {};
		for (j = startColumn; j <= endColumn; j++) {
			row['column' + j] = 'Cell ' + i + ',' + j;
		}
		data.push(row);
	}

	return data;
};

// Render cell
function cellText(rowIndex, columnIndex, data) {
	return 'Cell ' + rowIndex + ',' + columnIndex;
};

// Render header cell
function headText(rowIndex, columnIndex, data) {
	return 'Column ' + columnIndex;
};

// Start measurements for a metric
var metrics, domain = domain || '', saving = false;
function setMetric(name, value, flag, units) {
	metrics = metrics || {};
	metrics[domain] = metrics[domain] || {};
	var results = metrics[domain];
	results[name] = results[name] || {}
	results[name].value = Math.round(value);
	results[name].values = results[name].values || [];
	results[name].values.push(value);
	results[name].units = units || 'ms';
	results[name].flag = flag;
	// Keep last N values
	if (results[name].values.length > 10) {
		results[name].values = results[name].values.slice(-10);
	}

	// Calc average
	var sum = results[name].values.reduce(function(a, b) { return a + b; });
	var avg = sum / results[name].values.length;
	results[name].avg = ~~avg;

	// save to local storage
	if (!saving) {
		saving = true;
		setTimeout(function() {
			var data = {};
			saving = false;
			localStorage.setItem('metrics', JSON.stringify(metrics));
			showMetrics();
		},0);
	}
};

// Mark startig time for a metric
function startMeasure(name) {
	metrics = metrics || {};
	metrics[domain] = metrics[domain] || {};
	metrics[domain][name] = metrics[domain][name] || {};
	metrics[domain][name].start = performance.now();
};

// End measurement of a metric
function endMeasure(name, element) {
	var height;
	if (element) { height = element.clientHeight; } // make sure it is rendered
	setMetric(name, performance.now() - metrics[domain][name].start, height);
};

// 
var metricsContainer;
function showMetrics() {
	console.log('metrics', metrics);
	if (!metricsContainer) {
		metricsContainer = document.createElement('div');
		metricsContainer.setAttribute('class', 'well');
		metricsContainer.setAttribute('id', 'metrics');
		var place = document.body.querySelector('#metricsContainer');
		if (!place) {place = document.body;}
		place.appendChild(metricsContainer);
	};

	var table = metricsContainer.querySelector('table');
	var icon = metricsContainer.querySelector('button');
	if (!table) {
		metricsContainer.innerHTML = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button><table class="table table-condensed"><thead></thead><tbody></tbody></table>';
		table = metricsContainer.querySelector('table');
		icon = metricsContainer.querySelector('button');
		icon.addEventListener('click', function() {
			metricsContainer.style.display = 'none';
		})
	}
	var domains, results;
	if (!domain) {
		domains = ['jquery', 'polymer1', 'xtag', 'bblocks'];
	} else {
		domains = [domain];
	}
	var trHead = document.createElement('tr');
	table.querySelector('tbody').innerHTML = '';
	table.querySelector('thead').innerHTML = '';
	for (var i in domains) {
		var tr = document.createElement('tr');
		var results = metrics[domains[i]];
		tr.setAttribute('solution', domain);
		if (!domain) { // Add solution column
			tr.innerHTML = '<td>' + domains[i] + '</td>';
			if (i==0) {trHead.innerHTML = '<th>Solution</th>';}
		}
		for (var key in results) {
			if (i==0) {
				var th = document.createElement('th');
				th.innerHTML = key;
				th.setAttribute('metric', key);
				trHead.appendChild(th);
			}
			var td = document.createElement('td');
			var result = results[key];
			var value =  result.avg || result.value;
			td.setAttribute('value', value);
			td.setAttribute('metric', key);
			td.innerHTML = value + ' ' + result.units;
			tr.appendChild(td);
		}
		i++;
		table.querySelector('tbody').appendChild(tr);
	};
	table.querySelector('thead').appendChild(trHead);
	metricsContainer.style.display = 'block';
}

// Measure critical rendering path
window.addEventListener("load", function () {	
	// Handle metrics buttons only for home page
	var btnReset = document.getElementById('resetMetrics');
	var btnCollect = document.getElementById('getMetrics');
	if (btnReset) { // only for home page
		btnReset.addEventListener('click', function() {
			localStorage.removeItem('metrics');
			metrics = {};
			showMetrics();
		});
	}
	
	// Load metrics from storage
	var data = localStorage.getItem('metrics');
	if (data) {
		try {
			data = JSON.parse(data);
		} catch(err) {
			data = null;
		}
	}
	metrics = data || {}; 
	if (!domain) {showMetrics(); return;} // don't collect metrics for home page
	var t = window.performance.timing;
	setMetric('domInteractive', t.domInteractive - t.domLoading);
	setMetric('domContentLoaded', t.domContentLoadedEventStart - t.domLoading);
	setMetric('domComplete', t.domComplete - t.domLoading);
});