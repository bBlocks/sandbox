var domain = 'bblocks'; // required for metrics

// Form component
var formComponent = bb.component(bb.dom, {
	tag: 'form',
	extends: HTMLFormElement,
	is: 'bb-form',
	update: function (params) {
		var fields = this.find('input', true);
		// Set field values
		fields[0].value = params.itemsCount;
		fields[1].value = params.pageSize;
		fields[2].value = params.currentPage;
	},
	on: {
		submit: function (event) {
			event.preventDefault();
			
			// Get new parameters
			var fields = this.find('input', true);
			var newParams = {
				itemsCount: Number(fields[0].value),
				pageSize: Number(fields[1].value),
				currentPage: Number(fields[2].value)
			};

			startMeasure('render' + (newParams.pageSize*window.params.maxColumns));

			// Update table
			table.fire('update', newParams);
		}
	}
});

// Table component
var tableComponent = bb.component(bb.dom, {
	is: 'bb-table',
	tag: 'table',
	extends: HTMLTableElement,
	currentParams: null,
	thead: null,
	tbody: null,
	on: {
		update: function (event) {
			var newParams = event.detail;
			this.refreshTable(newParams);
		}
	},
	// Get the data and render the table
	refreshTable: function (newParams) {
		this.currentParams = this.currentParams || {};
		Object.assign(this.currentParams, newParams);
		var data = generateData(this.currentParams.currentPage, this.currentParams.pageSize, this.currentParams.itemsCount);
		this.renderTable(data);
	},
	// Render table
	renderTable: function (data) {
		var i, columnKey, j, row, td, th,
			headRow = document.createElement('tr');

		if (!this.thead) { this.thead = this.find('thead'); }
		if (!this.tbody) { this.tbody = this.find('tbody'); }

		// Clear table
		this.empty(this.tbody);
		this.empty(this.thead);

		for (i = 0; i < data.length; i++) {
			row = document.createElement('tr');
			j = 0;
			for (columnKey in data[i]) {
				j++;
				if (i == 0) { // Create table head
					th = document.createElement('th');
					th.innerHTML = '<bb-cell row="' + i + '" col="' + j + '" head></bb-cell>'; // Use cell component
					headRow.appendChild(th);
				}
				td = document.createElement('td');
				td.innerHTML = '<bb-cell row="' + i + '" col="' + j + '"></bb-cell>'; // Use cell component 
				row.appendChild(td);
			}
			this.tbody.appendChild(row);
		}
		this.thead.appendChild(headRow);
		endMeasure('render' + (i*window.params.maxColumns), this);
	}
});

// Cell component
var cellComponent = bb.component(bb.dom, {
	is: 'bb-cell',
	polyfill: 'v0',
	createdCallback: null,
	attachedCallback: function () { 
		var rowIndex = Number(this.getAttribute('row') || 0) + 1;
		var columnIndex = this.getAttribute('col');
		var isHead = this.getAttribute('head') != null;
		this.innerHTML = isHead ? headText(rowIndex, columnIndex) : cellText(rowIndex, columnIndex);
	},
});

// Page logic
var form = document.querySelector('#form');
form.update(params);
var table = document.querySelector('#table');