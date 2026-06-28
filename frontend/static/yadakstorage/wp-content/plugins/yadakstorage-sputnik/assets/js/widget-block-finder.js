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
		if ( $( element ).data( 'init' ) ) {
			return;
		}

		$( element ).data( 'init', true );

		const select = $( element ).find( '.th-block-finder__vehicle-select' );
		const button = $( element ).find( '.th-block-finder__button' );
		let selectedVehicle;

		select.on( 'th-vehicle-select.change', function( event, vehicle ) {
			selectedVehicle = vehicle;
		} );

		button.on( 'click', function( event ) {
			event.preventDefault();

			if ( selectedVehicle ) {
				window.location.href = selectedVehicle.link;
			}
		} );
	}

	$( function() {
		sputnik.initWidget( 'yadakstorage_sputnik_block_finder', '.th-block-finder--type--default', init );
	} );
}( jQuery ) );
