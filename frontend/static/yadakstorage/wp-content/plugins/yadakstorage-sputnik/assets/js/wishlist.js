( function( $ ) {
	'use strict';

	/**
	 * @typedef {Object} YadakStorageSputnikWishlistButtonState
	 * @property {string} label
	 * @property {string} icon
	 */

	/**
	 * @typedef {Object} YadakStorageSputnikWishlistButtonDef
	 * @property {YadakStorageSputnikWishlistButtonState} added
	 */

	/**
	 * @typedef {Object} YadakStorageSputnikWishlistVars
	 * @property {string} ajaxUrl
	 * @property {string} pageUrl
	 * @property {string} nonceAdd
	 * @property {string} nonceRemove
	 * @property {YadakStorageSputnikWishlistButtonDef} button
	 */

	/**
	 * @member {YadakStorageSputnikWishlistVars} yadakStorageSputnikWishlistVars
	 */

	/**
	 * @type {YadakStorageSputnikWishlistVars}
	 */
	const vars = window.yadakStorageSputnikWishlistVars;
	// noinspection DuplicatedCode
	const wishlist = window.yadakStorageSputnikWishlist = {
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

			wishlist.queue = wishlist.queue.then( function() {
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

			return wishlist.ajax( function() {
				return $.ajax( {
					type: 'post',
					url: vars.ajaxUrl,
					dataType: 'json',
					data: {
						action: 'yadakstorage_sputnik_wishlist_add',
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

			return wishlist.ajax( function() {
				return $.ajax( {
					type: 'post',
					url: vars.ajaxUrl,
					dataType: 'json',
					data: {
						action: 'yadakstorage_sputnik_wishlist_remove',
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
		/**
		 * @param {MouseEvent} event
		 */
		onAddClick: function( event ) {
			if ( ! event.cancelable ) {
				return;
			}

			const button = $( this );
			const productId = button.data( 'product-id' );

			if ( ! button.is( '.th-wishlist-add--added' ) ) {
				event.preventDefault();
			}

			if ( button.is( '.th-wishlist-add--added' ) ) {

			} else if ( button.is( '.th-wishlist-add--loading' ) ) {
				const abort = button.data( 'yadakstorage-wishlist-abort' );

				if ( abort ) {
					abort();
				}

				button.removeClass( 'th-wishlist-add--loading' );
			} else {
				const abort = wishlist.add( productId, function() {
					button.removeClass( 'th-wishlist-add--loading' );
					button.addClass( 'th-wishlist-add--added' );
					button.find( '.th-wishlist-add__label' ).text( vars.button.added.label );
					button.find( '.th-wishlist-add__icon' ).html( vars.button.added.icon );
					button.attr( 'href', vars.pageUrl );
				} );

				button.addClass( 'th-wishlist-add--loading' );
				button.data( 'yadakstorage-wishlist-abort', abort );
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

			wishlist.remove( productId, function() {
				button.removeClass( 'th-button--loading' );
			} );
		},
	};

	$( document ).on( 'click', '.th-wishlist-add', wishlist.onAddClick );
	$( document ).on( 'click', '.th-wishlist-remove', wishlist.onRemoveClick );
}( jQuery ) );
