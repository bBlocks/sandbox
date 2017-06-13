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
var metrics, domain = location.pathname, saving = false;
function setMetric(name, value, flag) {
	metrics = metrics || {};
	metrics[name] = metrics[name] || {}
	metrics[name].value = value;
	metrics[name].values = metrics[name].values || [];
	metrics[name].values.push(value);
	metrics[name].flag = flag;
	// Keep last N values
	if (metrics[name].values.length > 10) {
		metrics[name].values = metrics[name].values.slice(-10);
	}
	
	// save to local storage
	if (!saving) {
		saving = true;
		setTimeout(function() {
			var data = {};
			saving = false;
			data[domain] = metrics;
			localStorage.setItem('metrics', JSON.stringify(data));
			console.log('metrics', metrics);
		},0);
	}
};

// Mark startig time for a metric
function startMeasure(name) {
	metrics = metrics || {};
	metrics[name] = metrics[name] || {};
	metrics[name].start = performance.now();
};

// End measurement of a metric
function endMeasure(name, element) {
	var height;
	if (element) { height = element.clientHeight; } // make sure it is rendered
	setMetric(name, performance.now() - metrics[name].start, height);
};


// Measure critical rendering path
window.addEventListener("load", function () {	
	// Load metrics from storage
	var data = localStorage.getItem('metrics');
	if (data) {
		try {
			data = JSON.parse(data);
		} catch(err) {
			data = null;
		}
	}
	metrics = data && data[domain];
	metrics = metrics || {};
	var t = window.performance.timing;
	setMetric('domInteractive', t.domInteractive - t.domLoading);
	setMetric('domContentLoaded', t.domContentLoadedEventStart - t.domLoading);
	setMetric('domComplete', t.domComplete - t.domLoading);	
});