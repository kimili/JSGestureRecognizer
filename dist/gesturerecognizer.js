/*  JSGestureRecognizer, Version 1.1
 *  (c) 2011 Takashi Okamoto - BuzaMoto
 *
 *  JSGestureRecognizer is a JavaScript implementation of
 *  UIGestureRecognizer on iOS
 *
 *  http://developer.apple.com/library/ios/#documentation/EventHandling/Conceptual/EventHandlingiPhoneOS/GestureRecognizers/GestureRecognizers.html
 *--------------------------------------------------------------------------*/


var JSGestureRecognizerStatePossible   = 'JSGestureRecognizer:possible',
    JSGestureRecognizerStateBegan      = 'JSGestureRecognizer:began',
    JSGestureRecognizerStateChanged    = 'JSGestureRecognizer:changed',
    JSGestureRecognizerStateEnded      = 'JSGestureRecognizer:ended',
    JSGestureRecognizerStateCancelled  = 'JSGestureRecognizer:cancelled',
    JSGestureRecognizerStateFailed     = 'JSGestureRecognizer:failed',
    JSGestureRecognizerStateRecognized = JSGestureRecognizerStateEnded,

    JSTouchStart     = 'touchstart',
    JSTouchMove      = 'touchmove',
    JSTouchEnd       = 'touchend',
    JSTouchCancelled = 'touchcancelled',
    JSGestureStart   = 'gesturestart',
    JSGestureChange  = 'gesturechange',
    JSGestureEnd     = 'gestureend',

    JSSwipeGestureRecognizerDirectionRight = 1 << 0,
    JSSwipeGestureRecognizerDirectionLeft  = 1 << 1,
    JSSwipeGestureRecognizerDirectionUp    = 1 << 2,
    JSSwipeGestureRecognizerDirectionDown  = 1 << 3;
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
// -- Abstract Class: JSTouchRecognizer -------------------------------------
var JSTouchRecognizer = Class.extend({
	initWithCallback: function(callback) {
		if (typeof callback === 'function') {
			this.callback = callback;
		} else {
			throw new Error("Callback must be set otherwise this won't do anything!");
		}
	},

	// sets the target and sets up recognizer by running initRecognizer()
	setTarget: function(_target) {
		var target = (_target.view) ? _target.view : _target;
		if (target !== null && this.target != target) {
			this.target = target;
			this.view = _target;
			this.initRecognizer();
		}
	},

	toString: function() {
		return "JSTouchRecognizer";
	},

	// -- Subclass Implementation Methods ---------------------------------------
	// initRecognizer - called when target and action are set (init)
	initRecognizer: function() {
		if (this.target === null) {
			throw new Error("this.target is null, must be a DOM element.");
		}

		var that = this;

		this.reset();
		this.state = JSGestureRecognizerStatePossible;

		this.touchmoveHandler = function(e){ that.touchmove.call(that, e); };
		this.touchendHandler = function(e){ that.touchend.call(that, e); };

		this.observe(this.target, JSTouchStart, function(e){ that.touchstart.call(that, e); });
		this.observe(this.target, JSGestureRecognizerStatePossible, function(e){ that.possible.call(that, e); });
		this.observe(this.target, JSGestureRecognizerStateBegan, function(e){ that.began.call(that, e); });
		this.observe(this.target, JSGestureRecognizerStateEnded, function(e){ that.ended.call(that, e); });
		this.observe(this.target, JSGestureRecognizerStateCancelled, function(e){ that.cancelled.call(that, e); });
		this.observe(this.target, JSGestureRecognizerStateFailed, function(e){ that.failed.call(that, e); });
		this.observe(this.target, JSGestureRecognizerStateChanged, function(e){ that.changed.call(that, e); });
	},

	reset: function() { },


	// -- Touch Events ----------------------------------------------------------
	touchstart: function(event, obj) {
		if (this.target && event.target === this.target) {
			this.addObservers();
			this.fire(this.target, JSGestureRecognizerStatePossible, this);
		}
	},

	touchmove: function(event) {},
	touchend: function(event) {},
	touchcancelled: function(event) {},


	// -- Event Handlers --------------------------------------------------------
	possible: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStatePossible;
			if (this.callback) {
				this.callback(this);
			}
		}
	},

	began: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateBegan;
			if (this.callback) {
				this.callback(this);
			}
		}
	},

	ended: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateEnded;
			if (this.callback) {
				this.callback(this);
			}
			this.removeObservers();
			this.reset();
		}
	},

	cancelled: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateCancelled;
			if (this.callback) {
				this.callback(this);
			}
			this.removeObservers();
			this.reset();
		}
	},

	failed: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateFailed;
			if (this.callback) {
				this.callback(this);
			}
			this.removeObservers();
			this.reset();
		}
	},

	changed: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateChanged;
			if (this.callback) {
				this.callback(this);
			}
		}
	},

	addObservers: function() {
		this.observe(document, JSTouchMove, this.touchmoveHandler);
		this.observe(document, JSTouchEnd, this.touchendHandler);
	},

	removeObservers: function() {
		this.stopObserving(document, JSTouchMove, this.touchmoveHandler);
		this.stopObserving(document, JSTouchEnd, this.touchendHandler);
	},


	// -- Utility methods -------------------------------------------------------
	// make this section library independent
	fire: function(target, eventName, obj) {
		var evt;
		if ( document.createEvent ) {
			evt = document.createEvent('CustomEvent');
			evt.initEvent(eventName, true, true);
		} else {
			evt = document.createEventObject();
			evt.eventType = eventName;
		}
		evt.memo = obj || {};
		if ( document.createEvent ) {
			target.dispatchEvent(evt);
		} else {
			target.fireEvent('on' + evt.eventType, evt);
		}
	},

	observe: function(target, eventName, handler) {
		if ( ! target || ! target.addEventListener ) {
			return;
		}
		target.addEventListener(eventName, handler);
	},

	stopObserving: function(target, eventName, handler) {
		if ( ! target || ! target.removeEventListener ) {
			return;
		}
		target.removeEventListener(eventName, handler);
	},

	getEventPoint: function(event) {
		if (touchEvents) {
			return { x: event.targetTouches[0].pageX, y: event.targetTouches[0].pageY };
		}
		return { x: event.pageX, y: event.pageY };
	}
});

// -- Class Methods -----------------------------------------------------------
JSTouchRecognizer.addGestureRecognizer = function(target, gestureRecognizer) {
	gestureRecognizer.setTarget(target);
};
// -- Abstract Class: JSGestureRecognizer -------------------------------------
var JSGestureRecognizer = JSTouchRecognizer.extend({
	toString: function() {
		return "JSGestureRecognizer";
	},


	// -- Subclass Implementation Methods ---------------------------------------
	// initRecognizer - called when target and action are set (init)
	initRecognizer: function() {

		var that = this;

		this._super();

		this.gesturechangeHandler = function(e){ that.gesturechange.call(that, e); };
		this.gestureendHandler = function(e){ that.gestureend.call(that, e); };

		this.observe(this.target, JSTouchStart, function(e){ that.gesturestart.call(that, e); });
	},


	// -- Gesture Events --------------------------------------------------------
	gesturestart: function(event) {
		if (this.target && event.target === this.target) {
			this.addGestureObservers();
			this.fire(this.target, JSGestureRecognizerStatePossible, this);
		}
	},

	gesturechange: function(event) {},
	gestureend: function(event) {
		if (this.target && event.target === this.target) {
			this.fire(this.target, JSGestureRecognizerStateEnded, this);
		}
	},


	// -- Event Handlers --------------------------------------------------------
	ended: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateEnded;
			if (this.callback) {
				this.callback(this);
			}
			this.removeObservers();
			this.removeGestureObservers();
			this.reset();
		}
	},

	cancelled: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateCancelled;
			if (this.callback) {
				this.callback(this);
			}
			this.removeObservers();
			this.removeGestureObservers();
			this.reset();
		}
	},

	failed: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo === this) {
			this.state = JSGestureRecognizerStateFailed;
			if (this.callback) {
				this.callback(this);
			}
			this.removeObservers();
			this.removeGestureObservers();
			this.reset();
		}
	},

	addGestureObservers: function() {
		this.observe(document, JSGestureChange, this.gesturechangeHandler);
		this.observe(document, JSGestureEnd, this.gestureendHandler);
	},

	removeGestureObservers: function() {
		this.stopObserving(document, JSGestureChange, this.gesturechangeHandler);
		this.stopObserving(document, JSGestureEnd, this.gestureendHandler);
	}
});
var JSTapGestureRecognizer = JSTouchRecognizer.extend({
	numberOfTapsRequired:    1,
	numberOfTouchesRequired: 1,
	moveTolerance:           40,

	toString: function() {
		return "JSTapGestureRecognizer";
	},

	touchstart: function(event) {
		if (event.target === this.target) {
			event.preventDefault();
			this._super(event);
			this.numberOfTouches = event.allTouches().length;
			this.distance = 0;
			this.translationOrigin = this.getEventPoint(event);
		}
	},

	touchmove: function(event) {
		// move events fire even if there's no move on desktop browsers
		// the idea of a "tap" with mouse should ignore movement anyway...
		if (event.target === this.target && !touchEvents) {
			event.preventDefault();
			this.removeObservers();
			this.fire(this.target, JSGestureRecognizerStateFailed, this);
		}
		var p = this.getEventPoint(event);
		var dx = p.x - this.translationOrigin.x,
				dy = p.y - this.translationOrigin.y;
		this.distance += Math.sqrt(dx*dx + dy*dy);
		if (this.distance > this.moveTolerance) {
			this.touchend();
		}
	},

	touchend: function(event) {
		if (event && event.target === this.target) {
			if (this.numberOfTouches === this.numberOfTouchesRequired) {
				this._super(event);
				this.taps++;
				if (this.recognizerTimer) {
					window.clearTimeout(this.recognizerTimer);
					this.recognizerTimer = null;
				}
				this.recognizerTimer = window.setTimeout(function() {
					if (this.taps === this.numberOfTapsRequired) {
						this.fire(this.target, JSGestureRecognizerStateRecognized, this);
					} else {
						this.fire(this.target, JSGestureRecognizerStateFailed, this);
					}
				}.call(this), JSTapGestureRecognizer.TapTimeout);
			} else {
				this.fire(this.target, JSGestureRecognizerStateFailed, this);
			}
		} else {
			this.fire(this.target, JSGestureRecognizerStateFailed, this);
		}
	},

	reset: function() {
		this.taps = 0;
		this.recognizerTimer = null;
	}
});

JSTapGestureRecognizer.TapTimeout = 500;
var JSLongPressGestureRecognizer = JSGestureRecognizer.extend({
	minimumPressDuration:    400,
	numberOfTouchesRequired: 1,
	numberOfTapsRequired:    1, // not sure how this works with multiple taps
	allowableMovement:       10, // currently we ignore this

	toString: function() {
		return "JSLongPressGestureRecognizer";
	},

	touchstart: function(event) {
		if (event.target === this.target) {
			event.preventDefault();
			this._super(event);
			if (this.numberOfTouchesRequired === event.allTouches().length) {
				this.recognizerTimer = window.setTimeout(function() {
					this.fire(this.target, JSGestureRecognizerStateRecognized, this);
				}.call(this), this.minimumPressDuration);
			}
		}
	},

	touchmove: function(event) {
		if (event.target === this.target && touchEvents) {
			event.preventDefault();
			this.fire(this.target, JSGestureRecognizerStateFailed, this);
		}
	},

	touchend: function(event) {
		if (event.target === this.target) {
			event.preventDefault();
			this.fire(this.target, JSGestureRecognizerStateFailed, this);
		}
	},

	gesturestart: function(event) {
		if (event.target === this.target) {
			event.preventDefault();
			this.fire(this.target, JSGestureRecognizerStateFailed);
		}
	},

	reset: function() {
		if (this.recognizerTimer) {
			window.clearTimeout(this.recognizerTimer);
		}
		this.recognizerTimer = null;
	}
});
var JSPanGestureRecognizer = JSGestureRecognizer.extend({
	maximumNumberOfTouches: 100000,
	minimumNumberOfTouches: 1,

	toString: function() {
		return "JSPanGestureRecognizer";
	},

	touchstart: function(event) {
		if (event.target === this.target) {
			this._super(event);
			var allTouches = event.allTouches();
			if (allTouches.length > this.maximumNumberOfTouches ||
					allTouches.length < this.minimumNumberOfTouches) {
				this.touchend(event);
			}
		}
	},

	touchmove: function(event) {
		var allTouches = event.allTouches();
		if (allTouches.length >= this.minimumNumberOfTouches &&
				allTouches.length <= this.maximumNumberOfTouches) {
			if (touchEvents) {
				if (event.target != this.target) {
					this.touchend(event);
					return;
				}
			}
			event.preventDefault();
			if (this.beganRecognizer === false) {
				this.fire(this.target, JSGestureRecognizerStateBegan, this);
				this.beganRecognizer = true;
				this.translationOrigin = this.getEventPoint(event);
			} else {
				this.fire(this.target, JSGestureRecognizerStateChanged, this);
				var p = this.getEventPoint(event);

				this.velocity.x = p.x - this.translation.x;
				this.velocity.y = p.y - this.translation.y;

				this.translation.x += p.x - this.translationOrigin.x;
				this.translation.y += p.y - this.translationOrigin.y;
			}
		}
	},

	touchend: function(event) {
		if (event.target === this.target || !touchEvents) {
			this._super(event);
			if (this.beganRecognizer) {
				this.fire(this.target, JSGestureRecognizerStateEnded, this);
			} else {
				this.fire(this.target, JSGestureRecognizerStateFailed, this);
			}
		}
	},

	gesturestart: function(event) {
		if (event.target === this.target) {
			var allTouches = event.allTouches();
			if (allTouches.length > this.maximumNumberOfTouches) {
				this.fire(this.target, JSGestureRecognizerStateFailed, this);
			}
		}
	},

	reset: function() {
		this.beganRecognizer = false;
		this.translation = { x: 0, y: 0 };
		this.velocity = { x: 0, y: 0 };
	},

	setTranslation: function(translation) {
		if (typeof translation.x != 'undefined' &&
				typeof translation.y != 'undefined') {
			this.translation = { x: translation.x, y: translation.y };
		}
	}
});
var JSPinchGestureRecognizer = JSGestureRecognizer.extend({
	toString: function() {
		return "JSPinchGestureRecognizer";
	},

	gesturestart: function(event) {
		if (event.target === this.target) {
			var allTouches = event.allTouches();
			if (allTouches.length === 2) {
				event.preventDefault();
				this._super(event);
			}
		}
	},

	gesturechange: function(event) {
		if (event.target === this.target) {
			event.preventDefault();
			if (this.beganRecognizer === false) {
				this.fire(this.target, JSGestureRecognizerStateBegan, this);
				this.beganRecognizer = true;
			} else {
				this.fire(this.target, JSGestureRecognizerStateChanged, this);
				this.velocity = event.scale / this.scale;
				this.scale *= event.scale;
			}
		}
	},

	// seems like if this isn't included jQuery doesn't run gestureend
	gestureend: function(event) {
		this._super(event);
	},

	reset: function() {
		this.beganRecognizer = false;
		this.scale = 1;
		this.velocity = 0;
	},

	setScale: function(scale) {
		if (typeof scale === 'number') {
			this.scale = scale;
		}
	}
});
var JSRotationGestureRecognizer = JSGestureRecognizer.extend({
	toString: function() {
		return "JSRotationGestureRecognizer";
	},

	gesturestart: function(event) {
		if (event.target === this.target) {
			var allTouches = event.allTouches();
			if (allTouches.length === 2) {
				event.preventDefault();
				this._super(event);
			}
		}
	},

	gesturechange: function(event) {
		if (event.target === this.target) {
			event.preventDefault();
			if (this.beganRecognizer === false) {
				this.fire(this.target, JSGestureRecognizerStateBegan, this);
				this.beganRecognizer = true;
			} else {
				this.fire(this.target, JSGestureRecognizerStateChanged, this);
				this.velocity = event.rotation - this.rotation;
				this.rotation += event.rotation;
			}
		}
	},

	// seems like if this isn't included jQuery doesn't run gestureend
	gestureend: function(event) {
		this._super(event);
	},

	reset: function() {
		this.beganRecognizer = false;
		this.rotation = 0;
		this.velocity = 0;
	},

	setRotation: function(rot) {
		if (typeof rot === 'number') {
			this.rotation = rot;
		}
	}
});
var JSSwipeGestureRecognizer = JSTouchRecognizer.extend({
	numberOfTouchesRequired: 1,
	direction:               JSSwipeGestureRecognizerDirectionRight,
	minimumDistance:         100,

	toString: function() {
		return "JSSwipeGestureRecognizer";
	},

	touchstart: function(event) {
		var allTouches = event.allTouches();
		if (event.target === this.target) {
			if (this.numberOfTouchesRequired === allTouches.length) {
				event.preventDefault();
				this._super(event);
				this.startingPos = { x: allTouches[0].pageX, y: allTouches[0].pageY };
				this.distance = { x: 0, y: 0 };
			} else {
				this.fire(this.target, JSGestureRecognizerStateFailed, this);
			}
		}
	},

	touchmove: function(event) {
		var allTouches = event.allTouches();
		if (event.target === this.target && this.numberOfTouchesRequired === allTouches.length) {
			event.preventDefault();
			this.distance.x = allTouches[0].pageX - this.startingPos.x;
			this.distance.y = allTouches[0].pageY - this.startingPos.y;

			if (this.direction & JSSwipeGestureRecognizerDirectionRight) {
				if (this.distance.x > this.minimumDistance) {
					this.fire(this.target, JSGestureRecognizerStateRecognized, this);
				}
			}

			if (this.direction & JSSwipeGestureRecognizerDirectionLeft) {
				if (this.distance.x < -this.minimumDistance) {
					this.fire(this.target, JSGestureRecognizerStateRecognized, this);
				}
			}

			if (this.direction & JSSwipeGestureRecognizerDirectionUp) {
				if (this.distance.y < -this.minimumDistance) {
					this.fire(this.target, JSGestureRecognizerStateRecognized, this);
				}
			}

			if (this.direction & JSSwipeGestureRecognizerDirectionDown) {
				if (this.distance.y > this.minimumDistance) {
					this.fire(this.target, JSGestureRecognizerStateRecognized, this);
				}
			}
		} else {
			this.fire(this.target, JSGestureRecognizerStateFailed, this);
		}
	},

	touchend: function(event) {
		if (event.target === this.target) {
			this.fire(this.target, JSGestureRecognizerStateFailed, this);
		}
	}
});
var JSGestureView = Class.extend({
	init: function(element) {
		this.view = (typeof element === 'string') ? document.getElementById(element) : element;
		this.scale = 1;
		this.rotation = this.x = this.y = this.z = 0;
		this.setTransform({}); // forces mobile safari to set object as accelerated.
	},

	setTransform: function(obj) {
		this._x        = this.getDefined(obj.x,        this._x,        this.x);
		this._y        = this.getDefined(obj.y,        this._y,        this.y);
		this._z        = this.getDefined(obj.z,        this._z,        this.z);
		this._scale    = this.getDefined(obj.scale,    this._scale,    this.scale);
		this._rotation = this.getDefined(obj.rotation, this._rotation, this.rotation);
		this.view.style.webkitTransform = 'translate3d('+
			this._x+'px, '+this._y+'px, '+this._z+') '+
			'scale('+this._scale+') '+
			'rotate('+this._rotation+'deg)';
	},

	addGestureRecognizer: function(recognizer) {
		JSTouchRecognizer.addGestureRecognizer(this, recognizer);
	},

	getDefined: function() {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] != 'undefined') return arguments[i];
		}
		return arguments[arguments.length-1];
	}
});

	w.JSGestureRecognizer          = JSGestureRecognizer;
	w.JSLongPressGestureRecognizer = JSLongPressGestureRecognizer;
	w.JSPanGestureRecognizer       = JSPanGestureRecognizer;
	w.JSPinchGestureRecognizer     = JSPinchGestureRecognizer;
	w.JSRotationGestureRecognizer  = JSRotationGestureRecognizer;
	w.JSSwipeGestureRecognizer     = JSSwipeGestureRecognizer;
	w.JSTapGestureRecognizer       = JSTapGestureRecognizer;

	w.JSGestureView                = JSGestureView;

})(window);