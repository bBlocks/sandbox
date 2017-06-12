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
	
	for (i = (currentPage - 1)*pageSize + 1; i<=currentPage*pageSize;i++) {
		if (i>itemsCount) {break;}		
		row = {};		
		for (j = startColumn; j <= endColumn;j++) {		
			row['column' + j] = 'Cell ' + i + ',' + j;
		}	
		data.push(row);
	}					
		
	return data;
}

// Render cell
function cellText(rowIndex, columnIndex, data) {
	return 'Cell ' + rowIndex + ',' + columnIndex;
}

// Render header cell
function headText(rowIndex, columnIndex, data) {
	return 'Column ' + columnIndex;
}

// Start measurements for a metric
var metrics;
function startMeasure(name) {
	metrics = metrics || {};
	metrics[name] = performance.now();
}

// End measurement
function endMeasure(name, element) {
	var height;
	if (element) {height = element.clientHeight;} // make sure it is rendered
	metrics[name] = performance.now() - metrics[name];
	console.info('measured', name, ~~metrics[name] + 'ms', 'Element height', height + 'px');
}

// Starting parameters
var params = {
	itemsCount: 1500,
	pageSize: 150,
	currentPage: 1
}