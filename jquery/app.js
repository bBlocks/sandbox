// Form component
$.fn.form = function (params) {
	var $form = $(this),
		form = $form[0],
		fields = form.elements;

	// Stop page reload when form submitted
	$form.on('submit', function () {
		startMeasure('render'); 
		event.preventDefault();

		var newParams = {
			itemsCount: Number(fields.itemsCount.value),
			pageSize: Number(fields.pageSize.value),
			currentPage: Number(fields.currentPage.value)
		};

		// Update table
		$('#table').trigger('update', newParams);
	});

	// Set field values
	fields.itemsCount.value = params.itemsCount;
	fields.pageSize.value = params.pageSize;
	fields.currentPage.value = params.currentPage;
};

// Table component
$.fn.table = function (params) {
	var $table = this,
		table = $table[0],
		$thead = $table.find('>thead'),
		$tbody = $table.find('>tbody'),
		currentParams = $.extend(null, params);

	$table.on('update', function (event, newParams) {
		refreshTable(newParams);
	});

	// Get the data and render the table
	function refreshTable(newParams) {
		currentParams = $.extend(null, newParams); 
		var data = generateData(currentParams.currentPage, currentParams.pageSize, currentParams.itemsCount);
		renderTable(data);
	};

	// Render table
	function renderTable(data) {
		var i, columnKey, j, $row, $td, $th, 
			$headRow = $('<tr>');
	
	    // Clear table
		$thead.empty();
		$tbody.empty();

		for (i = 0; i < data.length; i++) {
			$row = $('<tr>');
			j = 0;
			for (columnKey in data[i]) {
				j++;
				if (i == 0) { // Create table head
					$th = $('<th>');
					$th.cell(i+1, j, data[i][columnKey], true); // Use cell component
					$headRow.append($th);
				} 
				$td = $('<td>');
				$td.cell(i+1, j, data[i][columnKey], false); // Use cell component 
				$row.append($td);
			}
			$tbody.append($row);
		};

		$thead.append($headRow);
		endMeasure('render', table);
	};
};

// Cell component
$.fn.cell = function(rowIndex, columnIndex, data, isHead) {
	var $span = $('<span>'); // Need to create a new DOM element to make it fare :)
	$span.html(isHead ? headText(rowIndex, columnIndex, data) : cellText(rowIndex, columnIndex, data));
	$(this).append($span);
};

// Page logic
$(function () {
	$('#form').form(params);
	$('#table').table();
});