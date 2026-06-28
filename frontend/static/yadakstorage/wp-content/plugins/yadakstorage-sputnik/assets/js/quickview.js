( function( $ ) {
	'use strict';
	/**
	 * @typedef {Object} YadakStorageSputnikQuickviewVars
	 * @property {string} ajaxUrl
	 * @property {string} nonce
	 */

	/**
	 * @member {YadakStorageSputnikQuickviewVars} yadakStorageSputnikQuickviewVars
	 */

	const vars = window.yadakStorageSputnikQuickviewVars;
	const quickview = window.yadakStorageSputnikQuickview = {
		/**
		 * Aborts a previous request to open a quickview.
		 */
		abort: function() {},
		load: function( productId, callback ) {
			const xhr = $.ajax( {
				type: 'get',
				url: vars.ajaxUrl,
				dataType: 'json',
				data: {
					action: 'yadakstorage_sputnik_quickview_load',
					nonce: vars.nonce,
					product_id: productId,
				},
				success: function( response ) {
					callback( response );
				},
				error: function() {
					callback( { success: false } );
				},
			} );

			return xhr.abort;
		},
		initContent: function( modal ) {
			// Init variations form.
			const variationsForm = modal.find( '.variations_form' );

			variationsForm.each( function() {
				$( this ).wc_variation_form();
			} );
			variationsForm.trigger( 'check_variations' );
			variationsForm.trigger( 'reset_image' );

			// Init gallery.
			if ( $.fn.wc_product_gallery ) {
				modal.find( '.woocommerce-product-gallery' ).each( function() {
					$( this ).wc_product_gallery();
				} );
			}

			modal.trigger( 'th-quickview.init' );
		},
		/**
		 * @param {string} content
		 */
		open: function( content ) {
			if ( 'hidden' !== $( document.body ).css( 'overflow' ) ) {
				const bodyWidth = $( document.body ).width();

				$( document.body ).css( 'overflow', 'hidden' );

				const scrollWidth = $( document.body ).width() - bodyWidth;

				$( document.body ).css( 'paddingRight', scrollWidth + 'px' );
			}

			const modal = $( '.th-quickview' );
			const modalWindow = modal.find( '.th-quickview__window' );

			modalWindow.html( content );
			modal.find( '.th-quickview__close' ).on( 'click', quickview.close );
			modal.addClass( 'th-quickview--display' );
			modal.width(); // force reflow.
			modal.addClass( 'th-quickview--open' );

			quickview.initContent( modal );

			$( document ).trigger( 'yadakstorage.sputnik.quickview.show', [ modal ] );
		},
		close: function() {
			$( '.th-quickview' ).removeClass( 'th-quickview--open' );
		},
		/**
		 * @param {MouseEvent} event
		 */
		onOpenClick: function( event ) {
			if ( ! event.cancelable ) {
				return;
			}

			event.preventDefault();

			const button = $( this );
			const productId = button.data( 'product-id' );

			if ( button.is( '.th-quickview-open--loading' ) ) {
				quickview.abort();
				button.removeClass( 'th-quickview-open--loading' );

				return;
			}

			button.addClass( 'th-quickview-open--loading' );

			quickview.abort = quickview.load( productId, function( response ) {
				button.removeClass( 'th-quickview-open--loading' );

				if ( response.success ) {
					quickview.open( response.content );
				}
			} );
		},
		/**
		 * @param {Event} event
		 */
		onTransitionEnd: function( event ) {
			const modal = $( '.th-quickview' );
			const modalWindow = modal.find( '.th-quickview__window' );

			if (
				! modal.is( '.th-quickview--open' ) &&
				'opacity' === event.originalEvent.propertyName &&
				modalWindow.is( event.target )
			) {
				modal.removeClass( 'th-quickview--display' );

				$( document.body ).css( 'overflow', '' );
				$( document.body ).css( 'paddingRight', '' );
			}
		},
		onBackdropClick: function( event ) {
			if ( $( event.target ).closest( '.th-quickview__window' ).length === 0 ) {
				quickview.close();
			}
		},
	};

	$( document ).on( 'click', '.th-quickview-open', quickview.onOpenClick );
	$( '.th-quickview__container' ).on( 'click', quickview.onBackdropClick );
	$( '.th-quickview__window' ).on( 'transitionend', quickview.onTransitionEnd );
}( jQuery ) );
