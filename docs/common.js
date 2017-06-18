'use strict';
var domain;

// Starting parameters
var params = {
	itemsCount: 1500,
	pageSize: 150,
	currentPage: 1,
	maxColumns: 10
};

// List of solutions
var solutions = ['jquery', 'polymer', 'xtag', 'bblocks'];

// Generate JSON data like [{column1: 'Cell 1 1', column2: 'Cell 1 2', ...}, ...]
function generateData(currentPage, pageSize, itemsCount, startColumn, endColumn, maxColumns) {
	var row, i, j,
		data = [],
		maxColumns = maxColumns || (params.maxColumns || 10);

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
function cellText(rowIndex, columnIndex) {
	return 'Cell ' + rowIndex + ',' + columnIndex;
};

// Render header cell
function headText(rowIndex, columnIndex) {
	return 'Column ' + columnIndex;
};

// Start measurements for a metric
var metrics, saving = false;
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
	var sum = results[name].values.reduce(function (a, b) { return a + b; });
	var avg = sum / results[name].values.length;
	results[name].avg = ~~avg;

	// save to local storage
	if (!saving) {
		saving = true;
		setTimeout(function () {
			var data = {};
			saving = false;
			localStorage.setItem('metrics', JSON.stringify(metrics));
			showMetrics();
		}, 0);
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
	if (typeof endTest == 'function') { endTest(); } // Only when collecting metrics
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
		if (!place) { place = document.body; }
		place.appendChild(metricsContainer);
	};

	var table = metricsContainer.querySelector('table');
	var icon = metricsContainer.querySelector('button');
	if (!table) {
		metricsContainer.innerHTML = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button><table class="table table-condensed"><thead></thead><tbody></tbody></table>';
		table = metricsContainer.querySelector('table');
		icon = metricsContainer.querySelector('button');
		icon.addEventListener('click', function () {
			metricsContainer.style.display = 'none';
		})
	}
	var domains, results;
	if (!domain) {
		domains = solutions;
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
			if (i == 0) { trHead.innerHTML = '<th>Solution</th>'; }
		}
		for (var key in results) {
			if (i == 0) {
				var th = document.createElement('th');
				th.innerHTML = key;
				th.setAttribute('metric', key);
				trHead.appendChild(th);
			}
			var td = document.createElement('td');
			var result = results[key];
			var value = result.avg || result.value;
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

// Run render test
function runTest() {

	window.endTest = function () {
		// Wait to record metrics
		setTimeout(function () {
			nextSolution();
		}, 100);
	}

	var btn = document.querySelector('#showPage');
	if (!btn) { throw 'Submit button not found'; }
	var event = new MouseEvent('click')
	btn.dispatchEvent(event);
};

// Load next solution from the list to run tests
function nextSolution() {
	var index;

	if (!domain) {
		index = 0;
	} else {
		index = solutions.indexOf(domain) + 1;
	}

	// Last solution tested. Go to home page
	if (index >= solutions.length) { location.href = '../index.html'; return; }

	var solution = solutions[index];
	var url = (domain && '../' || '') + solution + '/index.html?test=' + solution;
	location.href = url;
}

// Load metrics from localstorage
function loadMetrics() {
	// Load metrics from storage
	var data = localStorage.getItem('metrics');
	if (data) {
		try {
			data = JSON.parse(data);
		} catch (err) {
			data = null;
		}
	}
	metrics = data || {};
}

function codeSize() {
	var size = 0;
	if (performance.getEntries && false) {
		var resources = performance.getEntries();
		size = 0;
		for (var i in resources) {

			var resource = resources[i];
			var arr = resource.name.split('/');
			var fileName = arr[arr.length - 1];
			console.log(resource);
			if (fileName == 'index.html' || fileName == 'app.js' || fileName == 'app.html') {
				size += resource.transferSize;
			}
		}
		
	} else {
		var scripts = document.scripts;
		size = document.body.innerHTML.length;
		for (var i =0 ;i<scripts.length; i++) {
			var script = scripts[i];
			var arr = script.src.split('/');
			var fileName = arr[arr.length - 1];
			console.log(i,fileName, script);
			if (fileName == 'index.html' || fileName == 'app.js' || fileName == 'app.html') {
				size += script.innerHTML.length;
			}
		}
	}
	setMetric('codeSize',size,null,'bytes');
}


window.addEventListener("load", function () {
	// Detect solution name	
	if (!domain) {
		var arr = location.pathname.split('/');
		if (arr.length >= 2) {
			domain = arr[arr.length - 2];
			if (domain == 'sandbox') { domain = ''; }
		}
	}

	if (domain == 'polymer') {
		window.addEventListener('WebComponentsReady', function () {
			load();
		});
	} else {
		load();
	}
});

// Measure critical rendering path and initialize metrics and tests
function load() {
	

	// Handle metrics buttons only for home page
	var btnReset = document.getElementById('resetMetrics');
	var btnCollect = document.getElementById('getMetrics');
	if (btnReset) { // only for home page
		btnReset.addEventListener('click', function () {
			localStorage.removeItem('metrics');
			metrics = {};
			showMetrics();
		});
	}

	if (btnCollect) {
		btnCollect.addEventListener('click', function () {
			nextSolution();
		});
	}

	loadMetrics();

	if (!domain) { showMetrics(); return; } // don't collect metrics for home page
	var t = performance.timing;
	setMetric('domInteractive', t.domInteractive - t.navigationStart);
	setMetric('domContentLoaded', t.domContentLoadedEventStart - t.navigationStart);
	setMetric('domComplete', t.domComplete - t.navigationStart);
	codeSize();

	// Run test
	if (location.search) {
		setTimeout(function () {
			runTest();
		}, 100);
	}
}

// Mouse event polyfill. IE11 :)
(function (window) {
	try {
		new MouseEvent('test');
		return false; // No need to polyfill
	} catch (e) {
		// Need to polyfill - fall through
	}

	// Polyfills DOM4 MouseEvent

	var MouseEvent = function (eventType, params) {
		params = params || { bubbles: false, cancelable: false };
		var mouseEvent = document.createEvent('MouseEvent');
		mouseEvent.initMouseEvent(eventType, params.bubbles, params.cancelable, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

		return mouseEvent;
	}

	MouseEvent.prototype = Event.prototype;

	window.MouseEvent = MouseEvent;
})(window);