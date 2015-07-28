(function($) {
	"use strict";

	var Alpha = {};

	/**
	 * [AlphaError description]
	 * Constructor for Alpha errors
	 * 
	 * @param string message, message of the error
	 */
	var AlphaError = function(message) {
		this.name = 'AlphaError';
		this.message = message;
	};

	AlphaError.prototype = new Error();

	/* Useful functions */
	var _functions = {
		renameFunction : function(fn, name) {
			return Function("fn", "return (function " + name + "(){ return fn.apply(this, arguments) });")(fn);
		},

		/**
		 * [hydrate description]
		 * Copy all properties from an object
		 * 
		 * @param  Object object
		 * @return void
		 */
		hydrate: function(object) {
			// object must be different from null
			if(object == null) return;

			// copy properties of the object
			for(var property in object) {
				this[property] = object[property];
			}
		},

		/**
		 * [setter description]
		 * Copy properties from an object but if strict is true,
		 * only properties who belong to current object are accepted
		 * 
		 * @param  Object object
		 * @param  boolean strict, if true, new properties cannot be added
		 * @return void
		 */
		setter: function(object, strict) {
			// object must be different from null
			if(object == null) return;

			// copy properties of the object
			for(var property in object) {
				// if strict and property doesn't belong to "this", throw an error
				if(strict && !this.hasOwnProperty(property)) {
					throw new AlphaError('[setter] ' + property + ' is not a property of current object');
				}

				// copy property from "object"
				this[property] = object[property];
			}
		},

		splitAttributesMethods: function(properties) {
			if(properties == null) {
				throw new AlphaError("[splitAttributesMethods] properties must be an object");
			}

			var obj = {
				attributes: {},
				methods: {}
			};

			for(var p in properties) {
				var value = properties[p];

				if(value instanceof Function) {
					obj.methods[p] = value;
				} else {
					obj.attributes[p] = value;
				}
			}

			return obj;
		},

		/**
		 * [extend description]
		 * Use constructors of different models on current instance
		 * 
		 * @param  array models, array of constructors
		 * @return void
		 */
		extend: function(models, data) {
			// parameter must be an array
			if(!(models instanceof Array)) throw new AlphaError("[extend] Parents must be an array");

			var model;

			if(models.length > 0) {
				for(var i = 0; i < models.length; i++) {
					model = models[i];
					
					if(model != null) {
						// call model constructor
						model.call(this, data);
					}
				}
			}
		},

		/**
		 * [getLastElement description]
		 * Get last element of an array
		 * 
		 * @return value, last element of the array
		 */
		getLastElement: function() {
			if(!(this instanceof Array)) throw new AlphaError('[getLastElement] array must be an Array');

			var value = null;
			for(var prop in this) value = this[prop];

			return value;
		},

		/**
		 * [removeElement description]
		 * Remove an element from an array
		 * 
		 * @param  Object element [description]
		 * @return void
		 */
		removeElement: function(element) {
			if(!(this instanceof Array)) throw new AlphaError('[removeElement] array must be an Array');

			var key = null;

			for(var prop in this) {
				if(this[prop] == element) {
					key = prop;
					break;
				}
			}

		 	this.splice(prop, 1);
		},

		/**
		 * [containsElement description]
		 * Check if an array contains an element
		 * 
		 * @param  Object   element, the element which is looked for
		 * @param  Function fn, callback which returns a boolean, used to compare 2 elements
		 * @return boolean
		 */
		containsElement: function(element, fn) {
			if(!(this instanceof Array)) throw new AlphaError('[containsElement] array must be an Array');

			if(fn != null) {
				if(!(fn instanceof Function)) {
					throw new AlphaError('[containsElement] fn Must be a function.');
				}

				for(var e in this) {
					if(fn(this[e], element)) {
						return true;
					}
				}

				return false;
			} else {
				return (this.indexOf(element) != -1);
			}
		},

		/**
		 * [applyDOMElement description]
		 * Put a DOM element in a property of an AlphaObject
		 * 
		 * @param  string   property, property which will contain a DOM element
		 * @param  string   selector, HTML selector
		 * @param  Function fn, callback once the element is load
		 * @return void
		 */
		applyDOMElement: function(property, selector, fn) {
			var _this = this;

			$(function() {
				if(Alpha.ui.singletons.$body == null) Alpha.ui.singletons.$body = $(document.body);

				if(selector == null) {
					_this.set(property, Alpha.ui.singletons.$body);
				} else {
					_this.set(property, $(selector));
				}

				if(fn != null) fn.call(_this);
			});
		},

		/**
		 * [onclick description]
		 * Link a selector/jQuery object on click event
		 * 
		 * @param  string | jQuery object   triggeredBy, selector or jQuery object
		 * @param  {Function} fn, callback/action triggered on click event
		 * @return void
		 */
		onclick: function(triggeredBy, fn) {
			var _this = this;

			$(function() {
				$(this).on('click', triggeredBy, function(e) {
					e.preventDefault();
					fn.call(_this);
				});
			});
		}
	};

	/**
	 * [createClass description]
	 * Alpha class builder
	 * 
	 * Alpha.createClass({
	 * 		strict: true,
	 *   	name: "Human",
	 *   	parents: [Animal],
	 *    	properties: {
	 *     		name: '',
	 *			age: 0,
	 *			status: 'alive',
	 *			dies: function() {
	 *				this.status = 'dead';
	 *			}
	 *		}
	 * });
	 *
	 * 
	 * @param  Object def, definition of the class
	 * if 'strict' true, properties won't be add via the set method
	 * 'name' is name of the class
	 * 'parents' is an array containing constructors of parents (multiple inheritance)
	 * 'properties' is the set of properties of any instance of this class. Functions are added to
	 * the prototype of the constructor
	 * 'init' is a function which is called at the end of the constructor
	 * 
	 * @return a constructor
	 */
	Alpha.createClass = function(def) {
		if(typeof def != "object" || def == null) throw new AlphaError("[Alpha.createClass] Definition of a class must be an object");

		// Object name
		if(def.name == null) throw new AlphaError("[Alpha.createClass] Name of the class must be indicated");

		// Strict
		if(def.strict != null && typeof def.strict != "boolean") 
			throw new AlphaError("[Alpha.createClass] Strict must be boolean if specified");

		// Properties
		var properties = {};

		if(def.properties != null) {
			properties = _functions.splitAttributesMethods(def.properties);
		}

		/**
		 * [constructor description]
		 * Object constructor of the current class
		 * 
		 * @param  Object data, set of properties
		 * @return instance of the current class
		 */
		var constructor = function(data) {
			// if inheritance
			if(def.parents != null) _functions.extend.call(this, def.parents, data);

			// add attributes
			_functions.hydrate.call(this, properties.attributes);

			// hydratation
			if(data != null) {
				if(typeof data != "object") throw new AlphaError("[Alpha.createClass] Parameter of constructor must be an object");
				else _functions.setter.call(this, data, def.strict);
			}

			// initialization
			if(def.init != null) {
				if(def.init instanceof Function) def.init.call(this);
				else throw new AlphaError("[Alpha.createClass] Init must be a function");
			}
		};

		var finalConstructor = _functions.renameFunction(constructor, def.name);

		/**
		 * [get description]
		 * General getter
		 * get(['name', 'powers'])
		 * get('name')
		 * 
		 * @param  array|string names
		 * @return Object|int|double|string|Function
		 */
		finalConstructor.prototype.get = function() {
			// get(['name', 'powers'])
			if(arguments[0] instanceof Array) {
				var names = arguments[0],
					result = {};

				if(names.length == 0) throw new AlphaError("[get] Array must contain at least one element");

				for(var i = 0; i < names.length; i++) {
					var name = names[i];
					result[name] = this.get(name);
				}

				return result;

			// get('name')
			} else if(typeof arguments[0] == "string") {
				var name = arguments[0];

				if(!this.hasOwnProperty(name)) 
					throw new AlphaError("[get] Property doesn't exist for this object");

				return this[name];

			} else {
				throw new AlphaError("[get] Parameter must be a string or an array");
			}
		};

		/**
		 * [set description]
		 * set('name', 'Bobby')
		 *
		 * set('name', 'Bobby').set('age', 20)
		 * 
		 * set({
		 * 	name: 'Bobby',
		 * 	age: 20
		 * })
		 *
		 * return current object
		 */
		finalConstructor.prototype.set = function() {
			// set('name', 'Bobby')
			if(arguments.length == 2) {
				if(typeof arguments[0] != 'string') 
					throw new AlphaError("[set] Property to modify must be a string");

				var property = arguments[0],
					value = arguments[1];

				var obj = {};
				obj[property] = value;

				_functions.setter.call(this, obj, def.strict);

			// set({ name: 'Bobby', age: 20 })
			} else if(arguments.length == 1) {
				if(typeof arguments[0] != 'object') 
					throw new AlphaError("[set] Set of properties to modify must be an object");

				var obj = arguments[0];

				for(var property in obj) {
					var value = obj[property];

					// using set(property, value)
					this.set(property, value);
				}
			}

			return this;
		};

		// add parent methods
		if(def.parents != null) {
			for(var i = 0; i < def.parents.length; i++) {
				var parent = def.parents[i];
				_functions.hydrate.call(finalConstructor.prototype, parent.prototype);
			}
		}

		// add methods
		_functions.hydrate.call(finalConstructor.prototype, properties.methods);

		/**
		 * [clone description]
		 * Clone current object
		 * 
		 * @return object with same properties of current object
		 */
		finalConstructor.prototype.clone = function() {
			return new finalConstructor(this);
		};

		return finalConstructor;
	};

	var AlphaObject = Alpha.createClass({ name: 'AlphaObject' });

	/**
	 * [createObject description]
	 * Create an object with the prototype of an Alpha object
	 * 
	 * @param  Object data, set of properties
	 * @return instance of AlphaObject
	 */
	Alpha.createObject = function(data) {
		return new AlphaObject(data);
	};

	/* Alpha UI */
	Alpha.ui = {};
	Alpha.ui.singletons = {};

	/* UI Effects */
	Alpha.ui.effects = {};

	var $document = $(document),
		$window   = $(window),
		$head 	  = null;

	/* Stylesheet loaders */
	var alphajs_css_url = 'http://rawgit.com/ralys/alphajs/master/stylesheets/alphajs.min.css';

	/**
	 * [loadStylesheet description]
	 * Load dynamically once external stylesheet from url to current page
	 * 
	 * @param  string url, url of a stylesheet
	 * @return Alpha.ui
	 */
	Alpha.ui.loadStylesheet = function(url) {
		$(function() {
			if($head == null) $head = $(document.head);

			if($('link[rel*=style][href="'+url+'"]').length == 0) {
				$head.append('<link rel="stylesheet" type="text/css" href="'+url+'">');
			}
		});

		return this;
	};

	/**
	 * [loadCSS description]
	 * Load the stylesheet 'alphajs.css'
	 * 
	 * @return Alpha.ui
	 */
	Alpha.ui.loadCSS = function() {
		return Alpha.ui.loadStylesheet(alphajs_css_url);
	};

	/**
	 * [js description]
	 * Apply JS effect on DOM element
	 * 
	 * @param  string name, name of the effect
	 * @param  jQuery $el, jquery DOM element
	 * @param  Function complete, callback triggered once effect complete
	 * @return void
	 */
	Alpha.ui.effects.js = function(name, $el, complete) {
		if(Alpha.ui.effects.js.all.indexOf(name) != -1) {
			jQuery.fn[name].call($el, complete);
		} else {
			throw new AlphaError('[Alpha.ui.effects.js] "'+name+'" is not a jQuery effect');
		}

		return this;
	};

	/**
	 * [all description]
	 * Contains all JS effects available
	 * 
	 * @type Array
	 * 
	 */
	Alpha.ui.effects.js.all = ['fadeIn', 'fadeOut', 'slideUp', 'slideDown', 'slideToggle', 'toggle'];
	/* End of JS effects */

	/**
	 * [css description]
	 * Apply CSS effect on DOM element with specific classes provide by Animate.css ( thanks Daneden ;D )
	 * 
	 * @param  string name, name of the effect
	 * @param  jQuery $el, jquery DOM element
	 * @param  Function complete, callback triggered once effect complete
	 * @return void
	 */
	Alpha.ui.effects.css = function(name, $el, complete) {
		if(Alpha.ui.effects.css.all.indexOf(name) != -1) {
			$el.addClass(name+' animated').one(Alpha.ui.effects.css.event, complete);
		} else {
			throw new AlphaError('[Alpha.ui.effects.css] "'+name+'" is not a CSS effect registered');
		}

		return this;
	};

	/**
	 * [event description]
	 * The event that cues the end of the CSS animation
	 * 
	 * @type {String}
	 */
	Alpha.ui.effects.css.event = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
	
	/**
	 * [all description]
	 * Contains all CSS effects available
	 * 
	 * @type Array
	 */
	Alpha.ui.effects.css.all = ["bounce", "flash", "pulse", "rubberBand", "shake", "swing", "tada", "wobble", "jello", "bounceIn", "bounceInDown", "bounceInLeft", "bounceInRight", "bounceInUp", "bounceOut", "bounceOutDown", "bounceOutLeft", "bounceOutRight", "bounceOutUp", "fadeIn", "fadeInDown", "fadeInDownBig", "fadeInLeft", "fadeInLeftBig", "fadeInRight", "fadeInRightBig", "fadeInUp", "fadeInUpBig", "fadeOut", "fadeOutDown", "fadeOutDownBig", "fadeOutLeft", "fadeOutLeftBig", "fadeOutRight", "fadeOutRightBig", "fadeOutUp", "fadeOutUpBig", "flip", "flipInX", "flipInY", "flipOutX", "flipOutY", "lightSpeedIn", "lightSpeedOut", "rotateIn", "rotateInDownLeft", "rotateInDownRight", "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight", "rotateOutUpLeft", "rotateOutUpRight", "slideInUp", "slideInDown", "slideInLeft", "slideInRight", "slideOutUp", "slideOutDown", "slideOutLeft", "slideOutRight", "zoomIn", "zoomInDown", "zoomInLeft", "zoomInRight", "zoomInUp", "zoomOut", "zoomOutDown", "zoomOutLeft", "zoomOutRight", "zoomOutUp", "hinge", "rollIn", "rollOut"];
	/* End of CSS effects */

	/**
	 * [Alpha.ui.Element description]
	 * Every User Interface element is based on this class
	 */
	Alpha.ui.Element = Alpha.createClass({
		name: 'UIElement',
		properties: {
			$container: null,
			$el: null,

			/**
			 * [render description]
			 * @type {Function}
			 * @return string, HTML content
			 */
			render: new Function(),

			/**
			 * [onShow_effect description]
			 * Let you choose the way the UI element is revealed
			 * 
			 * @type {Function}
			 */
			onShow_effect: new Function(),

			/**
			 * [onHide_effect description]
			 * Let you choose the way the UI element is hidden
			 * 
			 * @type {Function}
			 */
			onHide_effect: new Function(),

			/**
			 * [set description]
			 * Overriding set from AlphaObject by adding the feature of setting directly
			 * the DOM element matching the property name
			 * Example: this.set('title', 'New title') will change the value in the object
			 * and in the DOM and also, on your screen :P
			 * 
			 * @return this, current instance
			 */
			set: function() {
				AlphaObject.prototype.set.apply(this, arguments);

				if(arguments.length == 2 && this.$el != null) {
					try {
						var property = arguments[0],
						$element = this.$el.find('.' + property);

						if($element.length != 0) $element.html(this[property]);
					} catch(e) { 
						console.warn(e);
					}
				}

				return this;
			}
		}
	});

	/**
	 * [Alpha.ui.Button description]
	 * Alpha Button generator
	 */
	Alpha.ui.Button = Alpha.createClass({
		name: 'AlphaButton',
		parents: [Alpha.ui.Element],
		properties: {
			id: null,
			'class': null,
			content: '',
			type: null, // (link | button)
			href: null, 
			belongsTo: null,
			onClick: null,

			render: function() {
				var render = null;

				if(this.type == null) 
					throw new AlphaError("[Alpha.ui.Button.render] Type must be either 'link' or 'button'.");

				var _class = 'alphajs button';

				if(this['class'] != null) {
					this['class'] = _class + ' ' + this['class'];
				} else {
					this['class'] = _class;
				}

				this.id = 'alphajs_button_' + (++Alpha.ui.Button.instanceNumber);

				var attr_html = 'id = "' + this.id + '" class = "' + this['class'] + '"';

				if(this.type == 'link') {
					if(this.href == null)
						throw new AlphaError("[Alpha.ui.Button.render] Link must no be null to create a Alpha.ui.Button link");

					render = '<a ' + attr_html + ' href="' + this.href + '">' + (this.content||'') + '</a>';
				} else if(this.type == 'button') {
					render = '<input ' + attr_html + ' type="button" value="' + (this.content||'') + '">'; 
				} else {
					throw new AlphaError("[Alpha.ui.Button.render] Type '" + this.type + "' doesn't apply for Alpha.ui.Button type");
				}

				return render;
			},

			show: function() {
				_functions.applyDOMElement.call(this, '$container', this.$container, function() {
					this.$container.append(this.render());
					this.$el = this.$container.find('#'+this.id);

					if(this.onClick != null) {
						if(!(this.onClick instanceof Function))
							throw new AlphaError('[Alpha.ui.Button.show] Attribute onClick must be a function');

						_functions.onclick.call(this, '#'+this.id, this.onClick);
					}
				});

				return this;
			},

			/**
			 * [bind description]
			 * Bind current instance with an instance of class descending from Alpha.ui.Element
			 * 
			 * @param  Alpha.ui.Element or children UIelement [description]
			 * @return void
			 */
			bind: function(UIelement) {
				if(UIelement == null)
					throw new AlphaError('[Alpha.ui.Button.bind] UIElement must be an instance of Alpha.ui.Element');

				this.belongsTo = UIelement;
				this.$container = this.belongsTo.$el;
				this.$el = this.$container.find('#'+this.id);

				if(this.onClick != null) {
					if(!(this.onClick instanceof Function))
						throw new AlphaError('[Alpha.ui.Button.bind] Attribute onClick must be a function');

					_functions.onclick.call(this, '#'+this.id, this.onClick);
				}

				return this;
			},

			set: function() {
				Alpha.ui.Element.prototype.set.apply(this, arguments);
				
				if(arguments.length == 2 && this.$el != null) {
					var property = arguments[0];

					switch(property) {
						case 'content':
							if(this.type == 'link') {
								this.$el.html(this.content);
							} else if(this.type == 'button') {
								this.$el.attr('value', this.content);
							}
						break;

						case 'href':
							if(this.type == 'link') {
								this.$el.attr('href', this.href);
							}
						break;

						case 'class':
							var _class = 'alphajs button';

							this.$el.attr('class', _class)
									.addClass(this['class']);
						break;
					}
				}

				return this;
			}
		}
	});

	Alpha.ui.Button.instanceNumber = 0;	
	// End of Alpha.ui.Button
	
	/**
	 * [Alpha.ui.ModalBox description]
	 * Alpha ModalBox generator
	 */
	Alpha.ui.ModalBox = Alpha.createClass({
		name: 'AlphaModalBox',
		parents: [Alpha.ui.Element],
		properties: {
			id: null,
			title: "Title",
			content: "Put your content here.",
			$overlay: null,
			is_shown: false,
			buttonsAlignment: 'right',
			buttons: [
				new Alpha.ui.Button({
					'class': 'blue',
					content: 'OK',
					type: 'button',
					onClick: function() {
						this.belongsTo.close();
					}
				}),

				new Alpha.ui.Button({
					'class': 'red',
					content: 'Cancel',
					type: 'button',
					onClick: function() {
						this.belongsTo.close();
					}
				})
			],

			/**
			 * [triggeredBy description]
			 * @type string | jQuery object
			 */
			triggeredBy: null,

			onShow_effect: function() {
				this.$overlay.hide().fadeIn();

				if(this.$container == Alpha.ui.singletons.$body) {
					this.$overlay.css('position', 'fixed');
					this.$el.css('top', $window.scrollTop()+20);
				}

				this.$container.css('overflow', 'hidden')
							   .bind('mousewheel', function(e) {
					e.preventDefault();
				});

				Alpha.ui.effects.css('bounceInDown', this.$el);

				return this;
			},

			onHide_effect: function() {
				var _this = this;

				Alpha.ui.effects.css('bounceOutUp', this.$el, function() {
					_this.$overlay.fadeOut(function() {
						_this.$overlay.remove();
						_this.$el.remove();
					});

					_this.$container.css('overflow', 'initial')
									.unbind('mousewheel');
				});

				return this;
			},
			
			render: function() {
				this.id = 'alphajs_modalbox_' + (++Alpha.ui.ModalBox.instanceNumber);

				var render = '<div id="' + this.id + '" class="alphajs modalbox">' +
								'<div class="close">×</div>'+
								'<div class="title">' + this.title + '</div>'+
								'<div class="content">'+ this.content+'</div>';

				if(this.buttons.length > 0) {
					render += '<div class="buttons">';

					for(var i = 0; i < this.buttons.length; i++) {
						var btn = this.buttons[i];

						if(!(btn instanceof Alpha.ui.Button)) {
							throw new AlphaError("[Alpha.ui.ModalBox.render] Button must be instance of Alpha.ui.Button")
						} else {
							render += btn.render();
						}
					}

					render += '</div>';
				}

				render += '</div>';

				return render;
			},

			show: function() {
				var _this = this;

				if(this.is_shown) return;

				var overlay_id = 'alphajs_overlay_' + (Alpha.ui.ModalBox.instanceNumber+1);
				
				this.$container.append('<div id="'+overlay_id+'" class="alphajs overlay"></div>')
			   				   .append(this.render());

				this.$overlay = this.$container.find('#'+overlay_id);
				this.$el = this.$container.find('#'+this.id);

				/* Close action */
				this.$el.find(".close").on('click', function() {
					_this.close();
				});

				if(this.buttons.length > 0) {
					for(var i = 0; i < this.buttons.length; i++) {
						var btn = this.buttons[i];
						btn.bind(this);
					}
				}

				if(this.buttonsAlignment != null) {
					this.set('buttonsAlignment', this.buttonsAlignment);
				}
				
				// Show elements
				this.is_shown = true;
				Alpha.ui.ModalBox.currently_opened.push(this);

				// Show effects
				if(this.onShow_effect != null && this.onShow_effect instanceof Function) {
					this.onShow_effect();
				}

				return this;
			},

			/**
			 * [close description]
			 * Function used to close a modal box
			 * @return void
			 */
			close: function() {
				// Hide elements
				this.is_shown = false;
				_functions.removeElement.call(Alpha.ui.ModalBox.currently_opened, this);

				// Hide effects
				if(this.onHide_effect != null && this.onHide_effect instanceof Function) {
					this.onHide_effect();
				}

				return this;
			},

			/**
			 * [addButton description]
			 * Function used to add a button into the current modal box
			 * @param Alpha.ui.Button button
			 */
			addButton: function(button) {
				if(!(button instanceof Alpha.ui.Button)) {
					throw new AlphaError("[Alpha.ui.ModalBox.addButton] Button must be instance of Alpha.ui.Button");
				}

				this.buttons.push(button);

				if(this.$el == null) return;
				this.$el.find('.buttons').append(button.render());
				button.bind(this);

				return this;
			},

			/**
			 * [removeButton description]
			 * Function used to remove a button from the current modal box
			 * @param Alpha.ui.Button button
			 */
			removeButton: function(button) {
				if(!(button instanceof Alpha.ui.Button)) {
					throw new AlphaError("[Alpha.ui.ModalBox.removeButton] Button must be instance of Alpha.ui.Button");
				}

				_functions.removeElement.call(this.buttons, button);

				if(this.$el == null) return;
				button.$el.remove();

				return this;
			},

			set: function() {
				Alpha.ui.Element.prototype.set.apply(this, arguments);
				
				if(arguments.length == 2 && this.$el != null) {
					var property = arguments[0];

					switch(property) {
						case 'buttonsAlignment':
							switch(this.buttonsAlignment) {
								case 'left':
								case 'center':
								case 'right':
									this.$el.find('.buttons').css('text-align', this.buttonsAlignment);
								break;

								default:
									throw new AlphaError('[Alpha.ui.ModalBox.set] Align must be "left", "center" or "right"');
							}
						break;
					}
				}

				return this;
			}
		},

		init: function() {
			_functions.applyDOMElement.call(this, '$container', this.$container);

			if(this.triggeredBy)
				_functions.onclick.call(this, this.triggeredBy, this.show);
		}
	}); 

	Alpha.ui.ModalBox.currently_opened = [];
	Alpha.ui.ModalBox.instanceNumber = 0; 

	// Handle Escape
	$document.keydown(function(e) {
		// Press Esc
		if(e.keyCode == 27) {
			var lastOpened = _functions.getLastElement.call(Alpha.ui.ModalBox.currently_opened);
			if(lastOpened == null) return;

			lastOpened.close();
		}
	});	// End of Alpha.ui.ModalBox

	/**
	 * [Alpha.ui.Sidebox description]
	 * Box appearing when certain DOM element(s) appear on the screen
	 */
	Alpha.ui.SideBox = Alpha.createClass({
		name: 'AlphaSideBox',
		parents: [Alpha.ui.Element],
		properties: {
			id: null,
			title: "Title",
			content: "Put your content here.",
			direction: 'left',
			is_shown: false,

			// reinit onShow and onHide effects
			onShow_effect: null,
			onHide_effect: null,

			/**
			 * [$appearOn description]
			 * @type string | jQuery object, selector or jQuery object
			 */
			$appearOn: null,

			render: function() {
				var render = '<div id="' + this.id + '" class="alphajs sidebox">' +
							'<div class="close">×</div>' +
							'<div class="title">'+ this.title + '</div>' +
							'<div class="content">' + this.content + '</div>' +
						 '</div>';

				return render;
			},

			show: function(currentPos) {
				if(this.is_shown) return;

				var _this = this;

				this.$container.append(this.render());
				this.$el = this.$container.find('#'+this.id);

				/* Close action */
				this.$el.find(".close").on('click', function() {
					_this.close();
				});

				this.is_shown = true;

				// Show elements
				this.$el.css('top', currentPos+'px')
						.css(this.direction, '0');

				// Show effects
				if(this.onShow_effect != null && this.onShow_effect instanceof Function) {
					this.onShow_effect();
				} else {
					var effect = '';

					if(this.direction == 'left') {
						effect = 'rotateInDownLeft';
						// effect = 'fadeInLeftBig';
					} else {
						effect = 'rotateInDownRight';
						// effect = 'fadeInRightBig';
					}

					Alpha.ui.effects.css(effect, this.$el);
				}

				return this;
			},

			/**
			 * [close description]
			 * Function used to close a side box
			 * @return void
			 */
			close: function() {
				var _this = this;

				// Hide effects
				if(this.onHide_effect != null && this.onHide_effect instanceof Function) {
					this.onHide_effect();
				} else {
					var effect = '';

					if(this.direction == 'left') {
						effect = 'rotateOutUpLeft';
						// effect = 'fadeOutLeftBig';
					} else {
						effect = 'rotateOutUpRight';
						// effect = 'fadeOutRightBig';
					}

					Alpha.ui.effects.css(effect, this.$el, function() {
						_this.$el.remove();
					});
				}

				return this;
			}
		},

		init: function() {
			_functions.applyDOMElement.call(this, '$container', this.$container);
			
			Alpha.ui.SideBox.instances.push(this);
			this.id = 'alphajs_sidebox_'+ Alpha.ui.SideBox.instances.length;

			/* Check direction */
			if(this.direction != 'left' && this.direction != 'right') {
				throw new AlphaError('[Alpha.ui.SideBox] direction must be either left or right');
			}

			/* Get appear element */
			_functions.applyDOMElement.call(this, '$appearOn', this.$appearOn, function() {
				if(this.$appearOn.length == 0)
					throw new AlphaError('[Alpha.ui.SideBox] $appearOn must be a valid selector');
			});
		}
	});

	Alpha.ui.SideBox.instances = [];

	/**
	 * [showAll description]
	 * Function that has to be called if you want to show the sideboxes
	 * 
	 * @return void
	 */
	Alpha.ui.SideBox.showAll = function() {
		$(function() {
			$window.on('scroll', function() {
				var windowTop = $window.scrollTop(),
					windowBottom = windowTop + $window.height();

				for(var i = 0; i < Alpha.ui.SideBox.instances.length; i++) {
					var sidebox = Alpha.ui.SideBox.instances[i];

					var elementTop = sidebox.$appearOn.offset().top,
						elementHeight = sidebox.$appearOn.height(),
						elementBottom = elementTop + elementHeight;

					if(elementBottom <= windowBottom && elementTop >= windowTop) {
						sidebox.show(elementTop + elementHeight);
					}
				}
			});
		});
	}; // End of Alpha.ui.SideBox


	/**
	 * [Alpha.ui.SearchWidget description]
	 * Widget to search elements, users and to put them on a list by selecting them
	 */
	Alpha.ui.SearchWidget = Alpha.createClass({
		name: 'AlphaSearchWidget',
		parents: [Alpha.ui.Element],
		properties: {
			id: null,
			num_guests: 0,
			guests: [],
			notFoundMessage: 'No results found',

			getOptions: new Function(),
			getResults: new Function(),

			render: function() {
				this.id = 'alpha_js_searchwidget_' + (++Alpha.ui.SearchWidget.instanceNumber);

				var render = '<div id="'+this.id+'" class="alphajs searchwidget">' +
								'<select class="dropdown"></select>' +
								'<div class="search">'+
									'<input type="search">'+
									'<div class="results"></div>'+
								'</div>'+
								'<div class="guests-list"></div>' +
							 '</div>';

				return render;
			},

			compareResults: function(r1, r2) {
				return r1.id == r2.id;
			},

			renderResult: new Function(),

			renderResults: function(results) {
				if(this.renderResult == null)
					throw new AlphaError('[Alpha.ui.SearchWidget.renderResults] renderResult must be a function');

				var render = '';

				if(results == null || results.length == 0) {
					render = '<div class="result">'+ this.notFoundMessage +'</div>';
				} else {
					for(var i = 0; i < results.length; i++) {
						var result = results[i], 
							checked = '';

						if(_functions.containsElement.call(this.guests, result, this.compareResults))
							checked = ' checked';

						render += '<div class="result">' + 
										'<input type="checkbox"'+ checked +' >' +
										this.renderResult(result) +
								  '</div>';
					}
				}

				return render;
			},

			renderGuest: function(guest) {
				return 	'<div class="guest">' + 
							'<input name="user_'+(++this.num_guests)+'" type="checkbox" checked>' +
							this.renderResult(guest) +
					    '</div>';
			},

			addGuest: function(guest) {
				if(_functions.containsElement.call(this.guests, guest, this.compareResults)) return;

				var _this = this;

				this.guests.push(guest);
				var $alreadyInGuestLists = false;

				// If just added guest is displayed in result, check it
				this.$el.find('.results').find('.result').each(function() {
					var data = $(this).data();
					
					if(_this.compareResults(data, guest)) {
						if(!$(this).find('input[type=checkbox]').is(':checked'))
							$(this).find('input[type=checkbox]').prop('checked', true);

						return;
					}
				});

				// check if guest is already in the guests list
				this.$el.find('.guests-list').find('.guest').each(function() {
					var data = $(this).data();
					
					if(_this.compareResults(data, guest)) {
						$alreadyInGuestLists = $(this);
						return;
					}
				});

				// if the guest is already in the guests list, don't add again
				if($alreadyInGuestLists) {
					$alreadyInGuestLists.find('input[type=checkbox]').prop('checked', true);
				} else {
					this.$el.find('.guests-list').append(this.renderGuest(guest));
				
					var $guest = this.$el.find('.guests-list').find('.guest').last();
					$guest.data(guest);
					Alpha.ui.effects.css('bounceIn', $guest);

					$guest.find('input[type=checkbox]').change(function() {
						if($(this).is(':checked')) {
							_this.addGuest(guest);
						} else {
							_this.removeGuest(guest);
						}
					});
				}

				return this;
			},

			removeGuest: function(guest) {
				if(!_functions.containsElement.call(this.guests, guest, this.compareResults)) return;

				var _this = this;

				_functions.removeElement.call(this.guests, guest);

				var callback = function() {
					var data = $(this).data();
					
					if(_this.compareResults(data, guest)) {
						$(this).find('input[type=checkbox]').prop('checked', false);
						return;
					}
				};

				// uncheck boxes from both results and guests list
				this.$el.find('.results').find('.result').each(callback);
				this.$el.find('.guests-list').find('.guest').each(callback);

				return this;
			},

			show: function() {
				var _this = this;

				this.$container.append(this.render());
				this.$el = this.$container.find('#'+this.id);
				
				// load options of select dropdown
				if(this.getOptions == null || !(this.getOptions instanceof Function))
					throw new AlphaError('[Alpha.ui.SearchWidget.show] getOptions must be a function');

				if(this.getResults == null || !(this.getResults instanceof Function))
					throw new AlphaError('[Alpha.ui.SearchWidget.show] getResults must be a function');

				this.getOptions(function(options) {
					for(var i = 0; i < options.length; i++) {
						_this.$el.find('select.dropdown')
								.append('<option value="'+options[i]+ '">'+options[i]+'</option>');

						_this.$el.find('select.dropdown').change(function(e) {
							_this.$el.find('.search').find('input[type=search]').keyup();
						});
					}
				});
				
				// load results on keyup event on input[type=search]
				this.$el.find('.search').find('input[type=search]').keyup(function(e) {
					$(this).parent().find('.results').empty();
					var value = $(this).val().trim(),
						category = _this.$el.find('select.dropdown').val();

					if(value == '') return;

					_this.getResults(function(results) {
						_this.$el.find('.results').append(_this.renderResults(results));

						var i = 0;
						_this.$el.find('.results').find('.result').each(function() {
							$(this).data(results[i]);

							$(this).find('input[type=checkbox]').change(function() {
								var guest = $(this).parent().data();

								// synchronize selected results with .guests-list
								if($(this).is(':checked')) {
									_this.addGuest(guest);
								} else {
									_this.removeGuest(guest);
								}
							});

							i++;
						});

					},	value, category);
				});

				this.$el.find('.search').find('input[type=search]').on('search', function() {
					_this.$el.find('.search').find('.results').empty();
				});

				return this;
			}
		},

		init: function() {
			_functions.applyDOMElement.call(this, '$container', this.$container, this.show);
		}
	});

	Alpha.ui.SearchWidget.instanceNumber = 0;
	// End of Alpha.ui.SearchWidget

	// Exporting Alpha to window
	window.Alpha = Alpha;

})(jQuery);