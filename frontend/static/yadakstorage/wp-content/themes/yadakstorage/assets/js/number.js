( function( $ ) {
	'use strict';

	// CustomEvent polyfill
	try {
		new CustomEvent( 'IE has CustomEvent, but doesn\'t support constructor' );
	} catch ( e ) {
		// noinspection JSValidateTypes
		window.CustomEvent = function( event, params ) {
			params = params || {
				bubbles: false,
				cancelable: false,
				detail: undefined,
			};
			const evt = document.createEvent( 'CustomEvent' );
			evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
			return evt;
		};

		CustomEvent.prototype = Object.create( window.Event.prototype );
	}

	/**
	 * @class
	 * @param {HTMLInputElement} input
	 * @param {HTMLElement} sub
	 * @param {HTMLElement} add
	 */
	function CustomNumber( input, sub, add ) {
		const self = this;

		this.input = input;
		this.sub = sub;
		this.add = add;

		this._subHandler = function() {
			self._change( -1 );
			self._changeByTimer( -1 );
		};
		this._addHandler = function() {
			self._change( 1 );
			self._changeByTimer( 1 );
		};

		this.sub.addEventListener( 'mousedown', this._subHandler, false );
		this.add.addEventListener( 'mousedown', this._addHandler, false );
	}

	CustomNumber.prototype = {
		destroy: function() {
			this.sub.removeEventListener( 'mousedown', this._subHandler, false );
			this.add.removeEventListener( 'mousedown', this._addHandler, false );
		},

		/**
		 * @param {number} direction - one of [-1, 1]
		 * @private
		 */
		_change: function( direction ) {
			const step = this._step();
			const min = this._min();
			const max = this._max();

			let value = this._value() + ( step * direction );

			// noinspection JSIncompatibleTypesComparison
			if ( max !== null ) {
				value = Math.min( max, value );
			}
			// noinspection JSIncompatibleTypesComparison
			if ( min !== null ) {
				value = Math.max( min, value );
			}

			const triggerChange = this.input.value !== value.toString();

			this.input.value = value.toString();

			if ( triggerChange ) {
				this.input.dispatchEvent( new CustomEvent( 'change', { bubbles: true } ) );
			}
		},

		/**
		 * @param {number} direction - one of [-1, 1]
		 * @private
		 */
		_changeByTimer: function( direction ) {
			const self = this;

			let interval;
			const timer = setTimeout( function() {
				interval = setInterval( function() {
					self._change( direction );
				}, 50 );
			}, 300 );

			const documentMouseUp = function() {
				clearTimeout( timer );
				clearInterval( interval );

				document.removeEventListener( 'mouseup', documentMouseUp, false );
			};

			document.addEventListener( 'mouseup', documentMouseUp, false );
		},

		/**
		 * @private
		 * @return {number} Returns step.
		 */
		_step: function() {
			let step = 1;

			if ( this.input.hasAttribute( 'step' ) ) {
				step = parseFloat( this.input.getAttribute( 'step' ) );
				step = isNaN( step ) ? 1 : step;
			}

			return step;
		},

		/**
		 * @private
		 * @return {?number} Returns min value.
		 */
		_min: function() {
			let min = null;
			if ( this.input.hasAttribute( 'min' ) ) {
				min = parseFloat( this.input.getAttribute( 'min' ) );
				min = isNaN( min ) ? null : min;
			}

			return min;
		},

		/**
		 * @private
		 * @return {?number} Returns max value.
		 */
		_max: function() {
			let max = null;
			if ( this.input.hasAttribute( 'max' ) ) {
				max = parseFloat( this.input.getAttribute( 'max' ) );
				max = isNaN( max ) ? null : max;
			}

			return max;
		},

		/**
		 * @return {number} Returns current value.
		 * @private
		 */
		_value: function() {
			const value = parseFloat( this.input.value );

			return isNaN( value ) ? 0 : value;
		},
	};

	/**
	 * @param {Object=} options
	 * @this JQuery
	 */
	function init( options ) {
		options = $.extend( { destroy: false }, options );

		return this.each( function() {
			if ( ! $( this ).is( '.th-input-number' ) ) {
				return;
			}

			// eslint-disable-next-line jsdoc/no-undefined-types
			/**
			 * @type {CustomNumber}
			 */
			let instance = $( this ).data( 'customNumber' );

			if ( instance && options.destroy ) { // destroy
				instance.destroy();
				$( this ).removeData( 'customNumber' );
			} else if ( ! instance && ! options.destroy ) { // init
				instance = new CustomNumber(
					this.querySelector( '.th-input-number__input' ),
					this.querySelector( '.th-input-number__sub' ),
					this.querySelector( '.th-input-number__add' )
				);
				$( this ).data( 'customNumber', instance );
			}
		} );
	}

	$.fn.customNumber = init;
}( jQuery ) );
