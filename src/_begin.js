(function(w) {

	var touchEvents = (function() {
		return (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
	})();

	if ( ! touchEvents) {
		JSTouchStart     = 'mousedown',
		JSTouchMove      = 'mousemove',
		JSTouchEnd       = 'mouseup',
		JSTouchCancelled = 'mouseup',
		JSGestureStart   = 'mousedown',
		JSGestureChange  = 'mousemove',
		JSGestureEnd     = 'mouseup';
	}

	// scope Class here so that it doesn't redefine Prototype's Class definition.
	// we're using John Resig's class inheritance, which is nice and library independent.
	// http://ejohn.org/blog/simple-javascript-inheritance/
	var Class = function(){};
	(function(){ var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/; Class.extend = function(prop) { var _super = this.prototype; initializing = true; var prototype = new this(); initializing = false; for (var name in prop) { prototype[name] = typeof prop[name] === "function" && typeof _super[name] === "function" && fnTest.test(prop[name]) ? (function(name, fn){ return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; }; })(name, prop[name]) : prop[name]; } function Class() { if ( !initializing && this.init ) this.init.apply(this, arguments); } Class.prototype = prototype; Class.constructor = Class; Class.extend = arguments.callee; return Class; };})();

	// -- Event extension -------------------------------------------------------
	var allTouches;
	if ( ! touchEvents ) {
		allTouches = function() {
			var touches = [this];
			if (this.altKey) {
				touches.push(this);
			}
			return touches;
		};
	} else {
		allTouches = function() {
			return this.targetTouches;
		};
	}

	Event.prototype.allTouches = allTouches;
