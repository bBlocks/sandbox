var domain = 'jquery'; // required for metrics

// Form component
$.fn.form = function (params) {
	var $form = $(this),
		form = $form[0],
		fields = form.elements;

	// Handle submit
	$form.on('submit', function (event) {
		event.preventDefault(); // Stop page reload when form submitted

		var newParams = {
			itemsCount: Number(fields.itemsCount.value),
			pageSize: Number(fields.pageSize.value),
			currentPage: Number(fields.currentPage.value)
		};

		startMeasure('render' + (newParams.pageSize * window.params.maxColumns));

		// Update table
		$('#table').trigger('update', newParams);
	});

	// Change
	$form.find('#change').on('click', function () {
		startMeasure('change' + (Number(fields.pageSize.value) * window.params.maxColumns));
		$('#table').trigger('change');
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

	$table.on('change', function () {
		var n = 0;

		$table.find('my-cell').each(function () {
			n++;
			var colIndex = Number($(this).attr('col'));
			if (colIndex) {
				colIndex += 10;
			}
			// attributeChange is asynchronous
			if (n >= (currentParams.pageSize * window.params.maxColumns + + window.params.maxColumns)) {
				$(this).on('render', measure);
			}
			$(this).attr('col', colIndex);
		});

		function measure() {
			endMeasure('change' + (currentParams.pageSize * window.params.maxColumns), table);
		}
	});

	// Get the data and render the table
	function refreshTable(newParams) {
		currentParams = $.extend(null, newParams);
		var data = generateData(currentParams.currentPage, currentParams.pageSize, currentParams.itemsCount);
		renderTable(data);
	};

	// Render table
	function renderTable(data) {
		var i, columnKey, j, $row, $td, $th, $el, field,
			$headRow = $('<tr>');

		// Clear table
		$thead.empty();
		$tbody.empty();

		for (i = 0; i < data.length; i++) {
			$row = $('<tr>');
			j = 0;
			for (columnKey in data[i]) {
				j++;
				field = data[j][columnKey];
				if (i == 0) { // Create table head
					$th = $('<th><my-cell row="' + field.row + '" col="' + field.col + '" head></my-cell></th>');
					$th.find('my-cell').cell();
					$headRow.append($th);
				}
				$td = $('<td><my-cell row="' + field.row + '" col="' + field.col + '"></my-cell></td>');
				$td.find('my-cell').cell();
				$row.append($td);
			}
			$tbody.append($row);
		};

		$thead.append($headRow);
		endMeasure('render' + (i * window.params.maxColumns), table);
	};
};

// Cell component
var observer = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		if (mutation.type == 'attributes') {
			if (typeof mutation.target.attributeChangeCallback == 'function') {
				mutation.target.attributeChangeCallback(mutation.attributeName, mutation.value, mutation.oldValue, mutation);
			}
		}
	});
});
$.fn.cell = function () {
	var $el = this;

	function renderCell($el) {
		var rowIndex = Number($el.attr('row') || 0) + 1;
		var columnIndex = Number($el.attr('col'));
		var isHead = $el.attr('head') != null;
		$el.html(isHead ? headText(rowIndex, columnIndex) : cellText(rowIndex, columnIndex));
		$el.trigger('render'); // Need for metrics
	}

	// Watch attribute change
	observer.observe($el[0], { attributes: true });
	$el[0].attributeChangeCallback = function () {
		renderCell($(this));
	}

	renderCell($el);
};

// Page logic
$(function () {
	$('#form').form(params);
	$('#table').table();
});