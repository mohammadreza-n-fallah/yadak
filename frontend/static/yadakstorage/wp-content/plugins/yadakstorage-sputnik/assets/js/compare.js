( function( $ ) {
	'use strict';

	/**
	 * @typedef {Object} YadakStorageSputnikCompareButtonState
	 * @property {string} label
	 * @property {string} icon
	 */

	/**
	 * @typedef {Object} YadakStorageSputnikCompareButtonDef
	 * @property {YadakStorageSputnikCompareButtonState} added
	 */

	/**
	 * @typedef {Object} YadakStorageSputnikCompareVars
	 * @property {string} ajaxUrl
	 * @property {string} pageUrl
	 * @property {string} nonceAdd
	 * @property {string} nonceRemove
	 * @property {string} nonceClear
	 * @property {YadakStorageSputnikCompareButtonDef} button
	 */

	/**
	 * @member {YadakStorageSputnikCompareVars} yadakStorageSputnikCompareVars
	 */

	/**
	 * @type {YadakStorageSputnikCompareVars}
	 */
	const vars = window.yadakStorageSputnikCompareVars;
	// noinspection DuplicatedCode
	const compare = window.yadakStorageSputnikCompare = {
		queue: ( function() {
			const d = $.Deferred();

			d.resolve();

			return d.promise();
		}() ),
		ajax: function( ajaxBuilder ) {
			/** @type {XMLHttpRequest} */
			let xhr;
			let aborted = false;

			const abort = function() {
				aborted = true;

				if ( xhr ) {
					xhr.abort();
				}
			};

			compare.queue = compare.queue.then( function() {
				const d = $.Deferred();

				if ( aborted ) {
					d.resolve();
					return;
				}

				xhr = ajaxBuilder().always( function() {
					d.resolve();
				} );

				return d.promise();
			} );

			return abort;
		},
		add: function( productId, success ) {
			success = success || function() {};

			return compare.ajax( function() {
				return $.ajax( {
					type: 'post',
					url: vars.ajaxUrl,
					dataType: 'json',
					data: {
						action: 'yadakstorage_sputnik_compare_add',
						nonce: vars.nonceAdd,
						product_id: productId,
					},
					success: function( response ) {
						success( response );

						if ( response.success ) {
							Object.keys( response.fragments ).forEach( function( selector ) {
								$( selector ).replaceWith( response.fragments[ selector ] );
							} );
						}
					},
				} );
			} );
		},
		remove: function( productId, success ) {
			success = success || function() {};

			return compare.ajax( function() {
				return $.ajax( {
					type: 'post',
					url: vars.ajaxUrl,
					dataType: 'json',
					data: {
						action: 'yadakstorage_sputnik_compare_remove',
						nonce: vars.nonceRemove,
						product_id: productId,
					},
					success: function( response ) {
						success( response );

						if ( response.success ) {
							Object.keys( response.fragments ).forEach( function( selector ) {
								$( selector ).replaceWith( response.fragments[ selector ] );
							} );
						}
					},
				} );
			} );
		},
		clear: function( success ) {
			success = success || function() {};

			return compare.ajax( function() {
				return $.ajax( {
					type: 'post',
					url: vars.ajaxUrl,
					dataType: 'json',
					data: {
						action: 'yadakstorage_sputnik_compare_clear',
						nonce: vars.nonceClear,
					},
					success: function( response ) {
						success( response );

						if ( response.success ) {
							Object.keys( response.fragments ).forEach( function( selector ) {
								$( selector ).replaceWith( response.fragments[ selector ] );
							} );
						}
					},
				} );
			} );
		},
		/**
		 * @param {MouseEvent} event
		 */
		onAddClick: function( event ) {
			if ( ! event.cancelable ) {
				return;
			}

			const button = $( this );
			const productId = button.data( 'product-id' );

			if ( ! button.is( '.th-compare-add--added' ) ) {
				event.preventDefault();
			}

			if ( button.is( '.th-compare-add--added' ) ) {

			} else if ( button.is( '.th-compare-add--loading' ) ) {
				const abort = button.data( 'yadakstorage-compare-abort' );

				if ( abort ) {
					abort();
				}

				button.removeClass( 'th-compare-add--loading' );
			} else {
				const abort = compare.add( productId, function() {
					button.removeClass( 'th-compare-add--loading' );
					button.addClass( 'th-compare-add--added' );
					button.find( '.th-compare-add__label' ).text( vars.button.added.label );
					button.find( '.th-compare-add__icon' ).html( vars.button.added.icon );
					button.attr( 'href', vars.pageUrl );
				} );

				button.addClass( 'th-compare-add--loading' );
				button.data( 'yadakstorage-compare-abort', abort );
			}
		},
		/**
		 * @param {MouseEvent} event
		 */
		onRemoveClick: function( event ) {
			if ( ! event.cancelable ) {
				return;
			}

			event.preventDefault();

			const button = $( this );
			const productId = button.data( 'product-id' );

			if ( button.is( '.th-button--loading' ) ) {
				return;
			}

			button.addClass( 'th-button--loading' );

			compare.remove( productId, function() {
				button.removeClass( 'th-button--loading' );
			} );
		},
		/**
		 * @param {MouseEvent} event
		 */
		onClearClick: function( event ) {
			if ( ! event.cancelable ) {
				return;
			}

			event.preventDefault();

			const button = $( this );

			if ( button.is( '.th-button--loading' ) ) {
				return;
			}

			button.addClass( 'th-button--loading' );

			compare.clear( function() {
				button.removeClass( 'th-button--loading' );
			} );
		},
	};

	$( document ).on( 'click', '.th-compare-add', compare.onAddClick );
	$( document ).on( 'click', '.th-compare-remove', compare.onRemoveClick );
	$( document ).on( 'click', '.th-compare-clear', compare.onClearClick );

	$( document ).on( 'change', '[name="th-compare-show"]', function() {
		document.cookie = 'th-compare-show=' + encodeURIComponent( this.value );

		if ( 'all' === this.value ) {
			$( '.th-compare-table' ).removeClass( 'th-compare-table--only-different' );
		} else {
			$( '.th-compare-table' ).addClass( 'th-compare-table--only-different' );
		}
	} );
}( jQuery ) );
