var domain = 'js'; // required for metrics

// Form component
var formComponent = function (formEl, params) {
	var fields = formEl.elements;

	// Handle submit
	formEl.addEventListener('submit', function (event) {
		event.preventDefault(); // Stop page reload when form submitted

		var newParams = {
			itemsCount: Number(fields.itemsCount.value),
			pageSize: Number(fields.pageSize.value),
			currentPage: Number(fields.currentPage.value)
		};

		startMeasure('render' + (newParams.pageSize * window.params.maxColumns));

		// Update table
		var event = new CustomEvent('update', { detail: newParams });
		table.dispatchEvent(event);
	});

	// Change
	formEl.querySelector('#change').addEventListener('click', function () {
		startMeasure('change' + (Number(fields.pageSize.value) * window.params.maxColumns));
		var event = new CustomEvent('change');
		table.dispatchEvent(event);
	});

	// Set field values
	fields.itemsCount.value = params.itemsCount;
	fields.pageSize.value = params.pageSize;
	fields.currentPage.value = params.currentPage;

};

// Table component
var tableComponent = function (tableElement, params) {
	var table = tableElement;

	table.currentParams = Object.create(params);	 
	table.thead = table.querySelector('thead');
	table.tbody = table.querySelector('tbody');

	table.addEventListener('update', function (event) {
		var newParams = event.detail;
		this.refreshTable(newParams);
	});

	// Handle change
	table.addEventListener('change', function () {
		var n=0, element, table = this,
			elements = this.querySelectorAll('span');

		for (var i = 0; i < elements.length; i++) {
			n++;
			var element = elements[i];
			var colIndex = Number(element.getAttribute('col'));
			if (colIndex) {
				colIndex += 10;
			}
			// attributeChange is asynchronous
			if (n >= (table.currentParams.pageSize * window.params.maxColumns + window.params.maxColumns)) {
				element.onRender = function() {
					measure();
				}
			}
			element.setAttribute('col', colIndex);
		};

		function measure() {
			endMeasure('change' + (table.currentParams.pageSize * window.params.maxColumns), table);
		}
	});

	// Get the data and render the table
	table.refreshTable = function(newParams) {
		this.currentParams = Object.create(newParams);
		var data = generateData(this.currentParams.currentPage, this.currentParams.pageSize,this.currentParams.itemsCount);
		this.renderTable(data);
	};

	// Render table
	table.renderTable = function(data) {
		var i, columnKey, row, td, th, el, field,
			headRow = document.createElement('tr');

		// Clear table
		empty(this.thead);
		empty(this.tbody);

		for (i = 0; i < data.length; i++) {
			row = document.createElement('tr');
			for (columnKey in data[i]) {
				field = data[i][columnKey];
				if (i == 0) { // Create table head
					th = document.createElement('th');

					//th.innerHTML = '<span row="' + field.row + '" col="'+field.col+'" head></span>';
					//cellComponent(th.firstChild);
					
					el = document.createElement('span');					
					el.setAttribute('row', field.row);
					el.setAttribute('col', field.col);
					el.setAttribute('head', true);
					cellComponent(el);
					th.appendChild(el);					
					
					headRow.appendChild(th);
				}
				td = document.createElement('td');
				
				//td.innerHTML = '<span row="' + field.row + '" col="'+field.col+'"></span>'
				//cellComponent(td.firstChild);
				
				
				el = document.createElement('span');
				el.setAttribute('row', field.row);
				el.setAttribute('col', field.col);
				cellComponent(el);
				td.appendChild(el);
								
				row.appendChild(td);
			}
			this.tbody.appendChild(row);
		};

		this.thead.appendChild(headRow);
		endMeasure('render' + (i * window.params.maxColumns), this);
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
var cellComponent = function (el) {
	el.renderCell = function() {
		var rowIndex = Number(this.getAttribute('row') || 0) + 1;
		var columnIndex = Number(this.getAttribute('col'));
		var isHead = this.getAttribute('head') != null;
		this.innerHTML = isHead ? headText(rowIndex, columnIndex) : cellText(rowIndex, columnIndex);
		if (typeof this.onRender == 'function') {
			this.onRender();
		}
		
	}

	// Watch attribute change
	observer.observe(el, { attributes: true });
	
	el.attributeChangeCallback = function () {
		this.renderCell();
	}

	el.renderCell();
};

// Page logic
var form = document.querySelector('#form');
formComponent(form, params);
var table = document.querySelector('#table');
tableComponent(table, params);

// Empty node elements
function empty(element) {
	element = element || this;
	while (element.firstChild && element.firstChild.parentNode) { element.firstChild.parentNode.removeChild(element.firstChild); }
}