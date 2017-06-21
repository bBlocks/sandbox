console.log('start building');

const fs = require('fs-extra');

function replaceAll(search, replacement) {
	var target = this;
	return target.split(search).join(replacement);
};

function replace(file, patterns) {
	console.info('replace in file', file.src);
	fs.readFile(file.src, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		let result = data;
		let search;
		for (let i in patterns) {
			let cfg = patterns[i];
			if (cfg.reg) {
				search = new RegExp(cfg.reg, 'ig');
				result = result.replace(search, cfg.rep);
			} else {
				search = cfg.src;
				result = replaceAll.call(result, search, cfg.rep);
			}
			console.log('replacing', search, cfg.rep, result.indexOf(search));
		}
		//console.log(file.dist, result);
		fs.writeFile(file.src, result, 'utf8', function (err) {
			if (err) return console.log(err);
		});
	});

}

function copy(file) {
	var newName;
	console.info('copying file', file.src);
	fs.copySync(file.src, file.dist);
}

var config = {
	files: [
		{
			src: './node_modules/bootstrap/dist/css/bootstrap.min.css',
			dist: './docs/lib/bootstrap.min.css'
		},
		{
			src: './node_modules/jquery/dist/jquery.slim.min.js',
			dist: './docs/lib/jquery.slim.min.js'
		},
		{
			src: './jquery/',
			dist: './docs/jquery',
		},
		{
			src: './polymer/',
			dist: './docs/polymer',
		},
		{
			src: './node_modules/webcomponents.js/webcomponents-lite.min.js',
			dist: './docs/lib/webcomponents-lite.min.js'
		},
		{
			src: './node_modules/Polymer/polymer-micro.html',
			dist: './docs/lib/polymer-micro.html'
		},
		{
			src: './bblocks/',
			dist: './docs/bblocks',
		},
		{
			src: './xtag/',
			dist: './docs/xtag',
		},
		{
			src: './node_modules/x-tag/dist/x-tag-core.min.js',
			dist: './docs/lib/x-tag-core.min.js'
		},
		{
			src: './index.html',
			dist: './docs/index.html',
		},
		{
			src: './common.js',
			dist: './docs/common.js',
		},
		{
			src: './style.css',
			dist: './docs/style.css',
		},
		{
			src: './node_modules/@bblocks/dom/dom.min.js',
			dist: './docs/lib/dom.min.js',
		},
		{
			src: './node_modules/@bblocks/component/component.polyfills.min.js',
			dist: './docs/lib/component.polyfills.min.js',
		},
		{
			src: './node_modules/@bblocks/component/component.min.js',
			dist: './docs/lib/component.min.js',
		},
		{ // JS
			src: './node_modules/custom-event-polyfill/custom-event-polyfill.js',
			dist: './docs/lib/custom-event-polyfill.js'
		},
		{
			src: './js/',
			dist: './docs/js',
		}
	],
	replace: [
		{
			src: './docs/jquery/index.html',
		},
		{
			src: './docs/xtag/index.html',
		},
		{
			src: './docs/polymer/index.html',
		},
		{
			src: './docs/bblocks/index.html',
		},
		{
			src: './docs/index.html',
		},
		{
			src: './docs/js/index.html'
		}
	],
	patterns: [
		{ src: '../node_modules/', rep: '../lib/' },
		{ src: 'node_modules/', rep: 'lib/' },
		{ src: 'bootstrap/dist/css/', rep: '' },
		{ src: 'jquery/dist/', rep: '' },
		{ src: 'x-tag/dist/', rep: '' },
		{ src: '@bblocks/component/', rep: ''},
		{ src: '@bblocks/dom/', rep: ''},
		{ src: 'Polymer/', rep: '' },
		{ src: 'webcomponents.js/', rep: '' },
		{ src: 'custom-event-polyfill/', rep: ''},
		{ src: '<p id="version">v0.0.0</p>', rep: 'v' + process.env.npm_package_version }
	]
};
let i;
fs.removeSync('./docs');
fs.ensureDirSync('./docs');
fs.ensureDirSync('./docs/js');
fs.ensureDirSync('./docs/jquery');
fs.ensureDirSync('./docs/lib');
fs.ensureDirSync('./docs/polymer');
fs.ensureDirSync('./docs/xtag');
fs.ensureDirSync('./docs/bblocks');

for (i in config.files) {
	copy(config.files[i]);
}

for (i in config.replace) {
	replace(config.replace[i], config.replace[i].patterns || config.patterns);
}