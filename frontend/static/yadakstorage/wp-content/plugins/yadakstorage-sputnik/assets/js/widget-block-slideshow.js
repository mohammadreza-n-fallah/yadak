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
			items: 1,
			nav: false,
			dots: true,
			loop: true,
			startPosition: $( element ).data( 'start-position' ),
			autoplay: $( element ).data( 'autoplay' ).toString() === '1',
			autoplayTimeout: Math.max( 1000, parseFloat( $( element ).data( 'autoplay-timeout' ) ) ),
			autoplayHoverPause: $( element ).data( 'autoplay-hover-pause' ).toString() === '1',
			rtl: sputnik.isRtl(),
		} );
	}

	$( function() {
		sputnik.initWidget( 'yadakstorage_sputnik_block_slideshow', '.th-block-slideshow', init );
	} );
}( jQuery ) );
