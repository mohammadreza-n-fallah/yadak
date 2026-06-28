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
		$( element ).find( '.owl-carousel' ).owlCarousel( {
			dots: true,
			margin: 24,
			rtl: sputnik.isRtl(),
			responsive: {
				1200: { items: 4 },
				992: { items: 4 },
				768: { items: 3 },
				440: { items: 2 },
				0: { items: 1 },
			},
		} );
	}

	$( function() {
		sputnik.initWidget( 'yadakstorage_sputnik_block_teammates', '.th-block-teammates', init );
	} );
}( jQuery ) );
