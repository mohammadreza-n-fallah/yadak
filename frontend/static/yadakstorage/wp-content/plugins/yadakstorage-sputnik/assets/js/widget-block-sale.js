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
		const block = $( element );
		const owlCarousel = block.find( '.owl-carousel' );
		const mobileGridColumns = block.data( 'mobile-grid-columns' );
		const options = {
			items: 5,
			dots: true,
			margin: 24,
			loop: false,
			rtl: sputnik.isRtl(),
			autoplay: $( element ).data( 'autoplay' ).toString() === '1',
			autoplayTimeout: Math.max( 1000, parseFloat( $( element ).data( 'autoplay-timeout' ) ) ),
			autoplayHoverPause: $( element ).data( 'autoplay-hover-pause' ).toString() === '1',
			rewind: true,
			responsive: {
				1400: { items: 5 },
				1200: { items: 4 },
				992: { items: 4, margin: 16 },
				768: { items: 3, margin: 16 },
				576: { items: 2, margin: 16 },
			},
		};

		const mobileGridBreakpoints = {
			1: {
				460: { items: 2, margin: 16 },
				0: { items: 1 },
			},
			2: {
				360: { items: 2, margin: 16 },
				0: { items: 1 },
			},
		}[ mobileGridColumns ];

		options.responsive = Object.assign( options.responsive, mobileGridBreakpoints );

		owlCarousel.on( 'initialized.owl.carousel', function() {
			owlCarousel.find( '.owl-item.cloned .th-product-card' ).trigger( 'th-product-card.init' );
		} );

		owlCarousel.owlCarousel( options );

		block.find( '.th-block-sale__arrow--prev' ).on( 'click', function() {
			owlCarousel.trigger( 'prev.owl.carousel', [ 500 ] );
		} );
		block.find( '.th-block-sale__arrow--next' ).on( 'click', function() {
			owlCarousel.trigger( 'next.owl.carousel', [ 500 ] );
		} );

		$( '.th-block-sale__timer', block ).each( function() {
			const timer = $( this );
			const MINUTE = 60;
			const HOUR = MINUTE * 60;
			const DAY = HOUR * 24;

			let left = parseFloat( $( this ).find( '.th-timer' ).data( 'seconds-left' ) ) || 0;

			const format = function( number ) {
				let result = number.toFixed();

				if ( result.length === 1 ) {
					result = '0' + result;
				}

				return result;
			};

			const updateTimer = function() {
				left -= 1;

				if ( left < 0 ) {
					left = 0;

					clearInterval( interval );
				}

				const leftDays = Math.floor( left / DAY );
				const leftHours = Math.floor( ( left - ( leftDays * DAY ) ) / HOUR );
				const leftMinutes = Math.floor( ( left - ( leftDays * DAY ) - ( leftHours * HOUR ) ) / MINUTE );
				const leftSeconds = left - ( leftDays * DAY ) - ( leftHours * HOUR ) - ( leftMinutes * MINUTE );

				timer.find( '.th-timer__part-value--days' ).text( format( leftDays ) );
				timer.find( '.th-timer__part-value--hours' ).text( format( leftHours ) );
				timer.find( '.th-timer__part-value--minutes' ).text( format( leftMinutes ) );
				timer.find( '.th-timer__part-value--seconds' ).text( format( leftSeconds ) );
			};

			const interval = setInterval( updateTimer, 1000 );

			updateTimer();
		} );

		function setCurrentSlidesToShow( slidesToShow ) {
			if ( slidesToShow >= owlCarousel.find( '.owl-item:not(.cloned)' ).length ) {
				block.addClass( 'th-block-sale--hide-arrows' );
			} else {
				block.removeClass( 'th-block-sale--hide-arrows' );
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
		sputnik.initWidget( 'yadakstorage_sputnik_block_sale', '.th-block-sale', init );
	} );
}( jQuery ) );
