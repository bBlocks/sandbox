// Form component
var formComponent = xtag.register('bb-form', {
	extends: 'form',
	methods: {
		update: function (params) {
			var fields = this.querySelectorAll('input');
			// Set field values
			fields[0].value = params.itemsCount;
			fields[1].value = params.pageSize;
			fields[2].value = params.currentPage;
		}
	},
	events: {
		submit: function (event) {
			event.preventDefault();
			startMeasure('render');
			// Get new parameters
			var fields = this.querySelectorAll('input');
			var newParams = {
				itemsCount: Number(fields[0].value),
				pageSize: Number(fields[1].value),
				currentPage: Number(fields[2].value)
			};

			// Update table
			var event = new CustomEvent('update', { detail: newParams });
			var table = document.querySelector('#table');
			table.dispatchEvent(event);
		}
	}
});

// Table component
var tableComponent = xtag.register('bb-table', {
	extends: 'table',
	currentParams: null,
	thead: null,
	tbody: null,
	events: {
		update: function (event) {
			var newParams = event.detail;
			// Detect if we need to refresh data
			if (!this.currentParams) { this.refreshTable(newParams); return; }
			if (this.currentParams.itemsCount != newParams.itemsCount) { this.refreshTable(newParams); return; }
			if (this.currentParams.pageSize != newParams.pageSize) { this.refreshTable(newParams); return; }
			if (this.currentParams.currentPage != newParams.currentPage) { this.refreshTable(newParams); return; }
		}
	},
	methods: {
		// Clear node
		empty: function (element) {
			element = element || this;
			while (element.firstChild && element.firstChild.parentNode) { element.firstChild.parentNode.removeChild(element.firstChild); }
		},
		// Get the data and render the table
		refreshTable: function (newParams) {
			this.currentParams = this.currentParams || {};
			// Can't use object assign 
			this.currentParams = Object.create(newParams);
			var data = generateData(this.currentParams.currentPage, this.currentParams.pageSize, this.currentParams.itemsCount);
			this.renderTable(data);
		},
		// Render table
		renderTable: function (data) {
			var i, columnKey, j, row, td, th,
				headRow = document.createElement('tr');

			if (!this.thead) { this.thead = this.querySelector('thead'); }
			if (!this.tbody) { this.tbody = this.querySelector('tbody'); }

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
			endMeasure('render', this);
		}
	}
});

// Cell component
var cellComponent = xtag.register('bb-cell', {
	lifecycle: {
		inserted: function () { // we can use lifecycle methods directly
			var rowIndex = Number(this.getAttribute('row') || 0) + 1;
			var columnIndex = this.getAttribute('col');
			var isHead = this.getAttribute('head') != null;
			this.innerHTML = isHead ? headText(rowIndex, columnIndex) : cellText(rowIndex, columnIndex);
		}
	}
});

// Page logic
var form = document.querySelector('#form');
form.update(params);
var table = document.querySelector('#table');