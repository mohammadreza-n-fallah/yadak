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
			loop: true,
			margin: 32,
			startPosition: $( element ).data( 'start-position' ),
			rtl: sputnik.isRtl(),
			responsive: {
				1200: { items: 3 },
				768: { items: 2 },
				0: { items: 1 },
			},
		} );
	}

	$( function() {
		sputnik.initWidget( 'yadakstorage_sputnik_block_reviews', '.th-block-reviews', init );
	} );
}( jQuery ) );
