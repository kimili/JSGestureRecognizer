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
		if (this.target && event.target == this.target) {
			this.addGestureObservers();
			this.fire(this.target, JSGestureRecognizerStatePossible, this);
		}
	},

	gesturechange: function(event) {},
	gestureend: function(event) {
		if (this.target && event.target == this.target) {
			this.fire(this.target, JSGestureRecognizerStateEnded, this);
		}
	},


	// -- Event Handlers --------------------------------------------------------
	ended: function(event, memo) {
		if (!event.memo) event.memo = memo;
		if (event.memo == this) {
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
		if (event.memo == this) {
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
		if (event.memo == this) {
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
