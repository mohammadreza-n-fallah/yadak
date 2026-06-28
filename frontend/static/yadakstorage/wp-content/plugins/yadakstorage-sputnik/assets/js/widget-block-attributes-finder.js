( function( $ ) {
	'use strict';

	/* global yadakStorageSputnik */

	const sputnik = yadakStorageSputnik;

	function init( elements ) {
		$( elements ).each( function() {
			initSingle( this );
		} );
	}
	function initSingle( element ) {
		const widget = $( element );

		if ( widget.data( 'init' ) ) {
			return;
		}

		widget.data( 'init', true );

		const ajaxUrl = widget.data( 'ajax-url' );
		const nonce = widget.data( 'nonce' );
		const strict = widget.data( 'strict' );
		const selects = widget.find( '.th-block-finder__control select' );

		if ( selects.selectWoo ) {
			selects.selectWoo( { width: '' } );
		} else {
			selects.select2( { width: '' } );
		}

		selects.on( 'change', function() {
			const control = $( this );
			const item = control.closest( '.th-block-finder__control' );
			const index = widget.find( '.th-block-finder__control' ).index( item );
			const value = control.val();
			const nextItem = widget.find( '.th-block-finder__control' ).slice( index + 1, index + 2 );
			const nextAllItems = widget.find( '.th-block-finder__control' ).slice( index + 1 );

			const fields = [];
			const values = [];

			widget.find( '.th-block-finder__control select' ).each( function() {
				fields.push( this.name );
			} );

			widget.find( '.th-block-finder__control' ).slice( 0, index + 1 ).find( 'select' ).each( function() {
				values.push( this.value );
			} );

			if ( value !== '' ) {
				nextAllItems.addClass( 'th-block-finder__control--disabled' );
				nextAllItems.find( 'select' ).prop( 'disabled', true ).val( '' );
				nextItem.removeClass( 'th-block-finder__control--disabled' );
				nextItem.find( 'select' ).prop( 'disabled', false );
			} else {
				nextAllItems.addClass( 'th-block-finder__control--disabled' );
				nextAllItems.find( 'select' ).prop( 'disabled', true ).val( '' );
			}

			nextAllItems.find( 'select' ).trigger( 'change.select2' );

			if ( '' === value ) {
				// widget.trigger( 'th-vehicle-select.change', null );
			} else if ( index + 1 === widget.find( '.th-block-finder__control' ).length ) {
				// widget.trigger( 'th-vehicle-select.change', JSON.parse( item.find( 'select' ).val() ) );
			} else {
				nextItem.addClass( 'th-block-finder__control--loading' );

				$.post( ajaxUrl, {
					action: 'yadakstorage_sputnik_attributes_finder',
					nonce: nonce,
					data: {
						fields: fields,
						values: values,
						strict: strict,
					},
				}, function( response ) {
					if ( response.success ) {
						nextItem.find( 'select option:not([value=""])' ).remove();

						response.data.forEach( function( optionData ) {
							const option = $( '<option></option>' );

							option.text( optionData.title );
							option.attr( 'value', optionData.value );

							nextItem.find( 'select' ).append( option );
						} );

						nextItem.removeClass( 'th-block-finder__control--loading' );
					}
				} );
			}
		} );
	}

	$( function() {
		sputnik.initWidget( 'yadakstorage_sputnik_block_attributes_finder', '.th-block-finder--type--attributes', init );
	} );
}( jQuery ) );
