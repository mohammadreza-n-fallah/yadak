( function( $ ) {
	'use strict';

	/* global yadakStorageSputnik */

	const sputnik = yadakStorageSputnik;
	const layoutOptions = {
		grid: {
			items: 4,
			responsive: {
				1400: { items: 4, margin: 20 },
				1200: { items: 3, margin: 20 },
				992: { items: 3, margin: 16 },
				768: { items: 2, margin: 16 },
				0: { items: 1, margin: 16 },
			},
		},
		list: {
			items: 2,
			responsive: {
				1400: { items: 2, margin: 20 },
				992: { items: 2, margin: 16 },
				0: { items: 1, margin: 16 },
			},
		},
	};

	function init( elements ) {
		$( elements ).each( function() {
			initSingle( this );
		} );
	}
	function initSingle( element ) {
		element = $( element );

		const layout = element.data( 'layout' );
		const options = $.extend(
			{
				dots: false,
				margin: 20,
				loop: false,
				rtl: sputnik.isRtl(),
				autoplay: $( element ).data( 'autoplay' ).toString() === '1',
				autoplayTimeout: Math.max( 1000, parseFloat( $( element ).data( 'autoplay-timeout' ) ) ),
				autoplayHoverPause: $( element ).data( 'autoplay-hover-pause' ).toString() === '1',
				rewind: true,
			},
			layoutOptions[ layout ]
		);
		const carousel = element.find( '.owl-carousel' ).owlCarousel( options );

		element.find( '.th-section-header__arrow--prev' ).on( 'click', function() {
			carousel.trigger( 'prev.owl.carousel', [ 500 ] );
		} );
		element.find( '.th-section-header__arrow--next' ).on( 'click', function() {
			carousel.trigger( 'next.owl.carousel', [ 500 ] );
		} );

		function setCurrentSlidesToShow( slidesToShow ) {
			if ( slidesToShow >= carousel.find( '.owl-item:not(.cloned)' ).length ) {
				element.find( '.th-section-header' ).addClass( 'th-section-header--hide-arrows' );
			} else {
				element.find( '.th-section-header' ).removeClass( 'th-section-header--hide-arrows' );
			}
		}

		if ( options.responsive && Object.keys( options.responsive ).length ) {
			const breakpoints = Object.keys( options.responsive ).map( function( item ) {
				return parseFloat( item );
			} ).sort( function( a, b ) {
				return a - b;
			} );

			function createMedia( query, slidesToShow ) {
				const media = matchMedia( query );

				const onChange = function() {
					const { matches } = media;

					if ( matches && slidesToShow ) {
						setCurrentSlidesToShow( slidesToShow );
					}
				};

				if ( media.addEventListener ) {
					media.addEventListener( 'change', onChange );
				} else {
					media.addListener( onChange );
				}

				onChange();
			}

			breakpoints.forEach( function( breakpoint, idx ) {
				const nextBreakpoint = breakpoints[ idx + 1 ];

				const query = [
					'(min-width: ' + breakpoint + 'px)',
				];

				if ( nextBreakpoint ) {
					query.push( '(max-width: ' + ( nextBreakpoint - 0.02 ).toFixed( 2 ) + 'px)' );
				}

				createMedia( query.join( ' and ' ), options.responsive[ breakpoint ].items );
			} );
		}
	}

	$( function() {
		sputnik.initWidget( 'yadakstorage_sputnik_block_posts_carousel', '.th-block-posts-carousel', init );
	} );
}( jQuery ) );
