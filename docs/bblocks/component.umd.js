(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bb = f()}})(function(){var define,module,exports;
'use strict';
var helpers =  {
	classCallCheck: function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw "Cannot call a class as a function"; } },
	possibleConstructorReturn: function(self, call) { if (!self) { throw "this hasn't been initialised - super() hasn't been called"; } return call && (typeof call === "object" || typeof call === "function") ? call : self; },
	inherits: function(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw "Super expression must either be null or a function, not " + typeof superClass; } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; },
	addCustomEvent: function (obj, eventType, eventHandler) {
		if (!obj.eventHandlers) { obj.eventHandlers = {}; }
		if (!obj.eventHandlers[eventType]) {
			obj.eventHandlers[eventType] = [];
		}
		if (eventHandler) {
			obj.eventHandlers[eventType].push(eventHandler);
		}
		return obj.eventHandlers[eventType];
	},
	debounce: function (func, wait, immediate) { // taken from http://underscorejs.org/#debounce, but modified to support canceling
		var timeout;
		return function () {
			var context = this, args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) { func.apply(context, args); return null; }
			return timeout;
		};
	},
	registerElement: function(parentClass, isWhat, tag, behaviors) {	// v0 spec implementation using https://github.com/WebReflection/document-register-element 	

		var elementClass = Object.create(parentClass.prototype);

		// Clone event handlers			
		if (elementClass.eventHandlers) {
			var clonedHandlers = {};
			for (var i in elementClass.eventHandlers) {
				var handlers = elementClass.eventHandlers[i];
				clonedHandlers[i] = handlers.slice(0); // Clone array of listeners;
			}
			elementClass.eventHandlers = clonedHandlers;
		}

		// Lifecycle
		elementClass.createdCallback = function () {
			// Add event listeners
			for (var i in this.eventHandlers) {
				var event = new CustomEvent(i);
				for (var j in this.eventHandlers[i]) {
					this.addEventListener(event.type, this.eventHandlers[i][j]);
				}
			}

			// Trigger create
			var event = new CustomEvent('create');
			this.dispatchEvent(event);
		};
		elementClass.attachedCallback = function () {
			var event = new CustomEvent('attach');
			this.dispatchEvent(event);
		};
		elementClass.detachedCallback = function () {
			var event = new CustomEvent('detach');
			this.dispatchEvent(event);
		};
		elementClass.attributeChangedCallback = function (attributeName) {
			var event = new CustomEvent('attributeChange', { detail: { attributeName: attributeName } });
			this.dispatchEvent(event);
		};

		// Attach behaviors
		if (behaviors) {
			if (!behaviors.length) { // Can't use Array.isArray because when useing argumnets
				behaviors = [behaviors];
			}
			for (var i=0;i<behaviors.length;i++) {
				helpers.addFeature(elementClass, behaviors[i]);
			}
		}

		var params = {
			prototype: elementClass
		};

		if (tag) {
			params.extends = tag;
		}
		var elementConstructor = document.registerElement(isWhat, params); // v0 syntax		

		return elementConstructor;
	},
	defineElement: function(parentClass, isWhat, tag, behaviors) { // v1 spec implementation using https://github.com/WebReflection/document-register-element 	
		var params, attributesToObserve = [];
		// Switch between v0 spec or v1 spec implementation
		if (!window.customElements) {
			return helpers.registerElement(parentClass, isWhat, tag, behaviors);
		}
		
		var elementClass = function (_parentClass) {
			helpers.inherits(elementClass, _parentClass);
			
			// Clone event handlers			
			if (_parentClass.prototype.eventHandlers) {
				var clonedHandlers = {};
				for (var i in _parentClass.prototype.eventHandlers) {
					var handlers = _parentClass.prototype.eventHandlers[i];
					clonedHandlers[i] = handlers.slice(0); // Clone array of listeners;
				}
				elementClass.prototype.eventHandlers = clonedHandlers;
			}

			function elementClass(self) {
				var _this;

				helpers.classCallCheck(this, elementClass);

				var self = (_this = helpers.possibleConstructorReturn(this, (elementClass.__proto__ || Object.getPrototypeOf(elementClass)).call(this, self)), _this);

				// Add event listeners
				
				for (var i in self.eventHandlers) {
					var event = new CustomEvent(i);
					for (var j in self.eventHandlers[i]) {
						self.addEventListener(event.type, self.eventHandlers[i][j]);
					}
				}

				// Trigger create
				var event = new CustomEvent('create');
				self.dispatchEvent(event);

				return self;
			}

			

			return elementClass;
		}(parentClass);
	
	
		// Lifecycle callbacks		
		elementClass.prototype.connectedCallback = function () {
			var event = new CustomEvent('attach');
			this.dispatchEvent(event);
		};
		elementClass.prototype.adoptedCallback = function () {
			var event = new CustomEvent('adapt');
			this.dispatchEvent(event);
		};
		elementClass.prototype.disconnectedCallback = function () {
			var event = new CustomEvent('detach');
			this.dispatchEvent(event);
		};
		elementClass.prototype.attributeChangedCallback = function (attributeName, oldValue, newValue, namespace) {
			var event = new CustomEvent('attributeChange', { detail: { attributeName: attributeName, oldValue: oldValue, newValue: newValue, namespace: namespace } });
			this.dispatchEvent(event);
		};

		// Add behaviors
		if (behaviors) {
			if (!behaviors.length) {
				behaviors = [behaviors];
			}
			for (var i in behaviors) {
				helpers.addFeature(elementClass.prototype, behaviors[i]);
			}
		}

		// Handle observed attributes
		if (elementClass.prototype.observedAttributesList) {
			var descriptor = {
				key: 'observedAttributes',
				get: function get() {
					return elementClass.prototype.observedAttributesList;
				}
			};		
			descriptor.enumerable = descriptor.enumerable || false; 
			descriptor.configurable = true; 
			if ("value" in descriptor) descriptor.writable = true; 
			Object.defineProperty(elementClass, descriptor.key, descriptor); 	
		}

		if (tag) {
			params = { extends: tag };
		}

		customElements.define(isWhat, elementClass, params);
		return elementClass;
	},
	addFeature: function (obj, properties) {
		var events, propertyDescriptors, i;
		if (!properties) { return; }

		// Clone events
		if (properties.events) {
			events = Object.assign({}, properties.events);
		}

		Object.assign(obj, properties); // IE11 need a polyfill

		// Handle events
		if (events) {
			for (i in events) {
				this.addCustomEvent(obj, i, events[i]);
			}
			delete obj.events;
		}

		// Handle observed attributes
		if (properties.observedAttributes) {
			if (!obj.observedAttributesList) {
				obj.observedAttributesList = [];
			}
			Array.prototype.push.apply(obj.observedAttributesList,properties.observedAttributes);			
		}

		// Handle properties getters and setters
		if (properties.properties) {
			propertyDescriptors = Object.assign({}, properties.properties);
			Object.defineProperties(obj, propertyDescriptors);
		}
	},
	warn: function() {
		var args = Array.prototype.slice.call(arguments);
		console.warn.apply(null,args);
	}
}

var component = function() {
	'use strict';
	var features = arguments;
	
	if (!features.length) {
		return;
	}
	
	// Detect isWhat, tag and parent class
	var props = feature.apply(null, arguments);
	var isWhat = props.is;
	var tag = props.tag;
	var parentClass = props.parent;

	if (!parentClass) {parentClass = HTMLElement;}
	if (tag && !isWhat) {isWhat = tag; tag = null;};
	if (!tag && !isWhat) {helpers.warn('Name not specified'); return;} 
	return helpers.defineElement(parentClass, isWhat, tag, arguments);
}

var feature = function() {
	'use strict';
	var self = this || {};
	if (arguments.length) {
		for (var i = 0; i<arguments.length; i++) {
			if (typeof arguments[i] != 'object') {helpers.warn('Expected object in argument #' + i); continue;}
			Object.assign(self, arguments[i]);
		}
	}
	return self;
};
Object.assign(feature.prototype, {
	is: null,
	tag: null,
	parent: null,
	properties: null, 	// 	
	events: null,
	observedAttributes: null,	
});


return {
	component: component,
	feature: feature,
	helpers: helpers
};
});
