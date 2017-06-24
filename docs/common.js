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
var solutions = ['js', 'jquery', 'polymer', 'xtag', 'bblocks'];

// Generate JSON data like [{column1: 'Cell 1 1', column2: 'Cell 1 2', ...}, ...]
function generateData(currentPage, pageSize, itemsCount, startColumn, endColumn, maxColumns) {
	console.log('generate', arguments);
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
			row['column' + j] = {row: i-1, col: j};
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
	
	if (element) { // Wait till browser finish rendering
		height = element.clientHeight; 
		setTimeout(function() {
			setMetric(name, performance.now() - metrics[domain][name].start, height);
			if (name.indexOf('change')>=0 && typeof endTest == 'function') { endTest(); } // Only when collecting metrics
		},0);
	} else {
		setMetric(name, performance.now() - metrics[domain][name].start);
		if (name.indexOf('change')>=0 && typeof endTest == 'function') { endTest(); } // Only when collecting metrics
	}
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

	btn = document.querySelector('#change');
	if (!btn) { throw 'Change button not found'; }
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
	if (performance.getEntries) {
		var resources = performance.getEntries();
		size = 0;
		for (var i in resources) {
			var resource = resources[i];
			var arr = resource.name.split('/');
			var fileName = arr[arr.length - 1];
			if (fileName == 'index.html' || fileName == 'app.js' || fileName == 'app.html') {
				if (!resource.transferSize) {size = -1;break;} // IE11 can't measure size
				size += resource.transferSize;
			}
		}
		
	} 
	if (size>0) {
		setMetric('codeSize',size, null,'bytes');
	}
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
	//codeSize(); // collecting code size is not reliable

	// Run test
	if (location.search.indexOf('test') >= 0) {
		setTimeout(function () {
			runTest();
		}, 100);
	}

	// Load css
	loadCSS( "../lib/bootstrap.min.css" );
	loadCSS( "../style.css");
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

/*! loadCSS. [c]2017 Filament Group, Inc. MIT License */
(function(w){
	"use strict";
	/* exported loadCSS */
	var loadCSS = function( href, before, media ){
		// Arguments explained:
		// `href` [REQUIRED] is the URL for your CSS file.
		// `before` [OPTIONAL] is the element the script should use as a reference for injecting our stylesheet <link> before
			// By default, loadCSS attempts to inject the link after the last stylesheet or script in the DOM. However, you might desire a more specific location in your document.
		// `media` [OPTIONAL] is the media type or query of the stylesheet. By default it will be 'all'
		var doc = w.document;
		var ss = doc.createElement( "link" );
		var ref;
		if( before ){
			ref = before;
		}
		else {
			var refs = ( doc.body || doc.getElementsByTagName( "head" )[ 0 ] ).childNodes;
			ref = refs[ refs.length - 1];
		}

		var sheets = doc.styleSheets;
		ss.rel = "stylesheet";
		ss.href = href;
		// temporarily set media to something inapplicable to ensure it'll fetch without blocking render
		ss.media = "only x";

		// wait until body is defined before injecting link. This ensures a non-blocking load in IE11.
		function ready( cb ){
			if( doc.body ){
				return cb();
			}
			setTimeout(function(){
				ready( cb );
			});
		}
		// Inject link
			// Note: the ternary preserves the existing behavior of "before" argument, but we could choose to change the argument to "after" in a later release and standardize on ref.nextSibling for all refs
			// Note: `insertBefore` is used instead of `appendChild`, for safety re: http://www.paulirish.com/2011/surefire-dom-element-insertion/
		ready( function(){
			ref.parentNode.insertBefore( ss, ( before ? ref : ref.nextSibling ) );
		});
		// A method (exposed on return object for external use) that mimics onload by polling document.styleSheets until it includes the new sheet.
		var onloadcssdefined = function( cb ){
			var resolvedHref = ss.href;
			var i = sheets.length;
			while( i-- ){
				if( sheets[ i ].href === resolvedHref ){
					return cb();
				}
			}
			setTimeout(function() {
				onloadcssdefined( cb );
			});
		};

		function loadCB(){
			if( ss.addEventListener ){
				ss.removeEventListener( "load", loadCB );
			}
			ss.media = media || "all";
		}

		// once loaded, set link's media back to `all` so that the stylesheet applies once it loads
		if( ss.addEventListener ){
			ss.addEventListener( "load", loadCB);
		}
		ss.onloadcssdefined = onloadcssdefined;
		onloadcssdefined( loadCB );
		return ss;
	};
	// commonjs
	if( typeof exports !== "undefined" ){
		exports.loadCSS = loadCSS;
	}
	else {
		w.loadCSS = loadCSS;
	}
}( typeof global !== "undefined" ? global : this ));