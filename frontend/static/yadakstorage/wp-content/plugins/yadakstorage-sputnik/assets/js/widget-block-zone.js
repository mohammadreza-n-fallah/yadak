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
		const ajaxUrl = block.data( 'ajax-url' );
		const nonce = block.data( 'nonce' );
		const mobileGridColumns = block.data( 'mobile-grid-columns' );
		const owlCarousel = block.find( '.owl-carousel' );
		const medias = [];
		const options = {
			dots: false,
			margin: 20,
			loop: false,
			items: 4,
			rtl: sputnik.isRtl(),
			autoplay: $( element ).data( 'autoplay' ).toString() === '1',
			autoplayTimeout: Math.max( 1000, parseFloat( $( element ).data( 'autoplay-timeout' ) ) ),
			autoplayHoverPause: $( element ).data( 'autoplay-hover-pause' ).toString() === '1',
			rewind: true,
			responsive: {
				1400: { items: 4, margin: 20 },
				992: { items: 3, margin: 16 },
				460: { items: 2, margin: 16 },
				0: { items: 1 },
			},
		};
		let cancelPreviousGroupChange = function() {};

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

		block.find( '.th-block-zone__tabs-button' ).on( 'click', function( event ) {
			if ( ! event.cancelable ) {
				return;
			}

			const carousel = block.find( '.th-block-zone__carousel' );
			const group = $( this );

			if ( group.is( '.th-block-zone__tabs-button--active' ) ) {
				return;
			}

			cancelPreviousGroupChange();

			carousel.addClass( 'th-block-zone__carousel--loading' );
			block.find( '.th-block-zone__tabs-button--active' ).removeClass( 'th-block-zone__tabs-button--active' );
			group.addClass( 'th-block-zone__tabs-button--active' );

			const data = group.data( 'group-data' );

			data.widget_name = 'yadakstorage_sputnik_block_zone';
			data.widget_type = 'default';

			if ( 'REPLACE_TO_ID' === data.widget_id ) {
				const elementorWidget = group.parents( '[data-widget_type="wp-widget-yadakstorage_sputnik_block_zone.default"]' );
				const elementorWidgetId = elementorWidget.data( 'id' );
				const elementorDocument = elementorWidget.parents( '.elementor[data-elementor-id]' );
				const elementorDocumentId = elementorDocument.data( 'elementor-id' );

				data.widget_type = 'elementor';
				data.elementor_post_id = elementorDocumentId;
				data.elementor_widget_id = elementorWidgetId;
			}

			const ajax = $.post( ajaxUrl, {
				action: 'yadakstorage_sputnik_widget',
				nonce: nonce,
				data: data,
			}, function( response ) {
				const html = $( response ).filter( '.th-block-zone' );
				const items = html.find( '.th-block-zone__carousel-item' );

				block.find( '.owl-carousel' )
					.trigger( 'replace.owl.carousel', [ items ] )
					.trigger( 'refresh.owl.carousel' )
					.trigger( 'to.owl.carousel', [ 0, 0 ] );

				owlCarousel.find( '.th-product-card' ).trigger( 'th-product-card.init' );

				carousel.removeClass( 'th-block-zone__carousel--loading' );

				medias.forEach( function( media ) {
					media();
				} );
			} );

			cancelPreviousGroupChange = function() {
				ajax.abort();
				cancelPreviousGroupChange = function() {};
			};
		} );
		block.find( '.th-block-zone__arrow--prev' ).on( 'click', function() {
			owlCarousel.trigger( 'prev.owl.carousel', [ 500 ] );
		} );
		block.find( '.th-block-zone__arrow--next' ).on( 'click', function() {
			owlCarousel.trigger( 'next.owl.carousel', [ 500 ] );
		} );

		function setCurrentSlidesToShow( slidesToShow ) {
			if ( slidesToShow >= owlCarousel.find( '.owl-item:not(.cloned)' ).length ) {
				block.addClass( 'th-block-zone--hide-arrows' );
			} else {
				block.removeClass( 'th-block-zone--hide-arrows' );
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

				medias.push( onChange );
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
		sputnik.initWidget( 'yadakstorage_sputnik_block_zone', '.th-block-zone', init );
	} );
}( jQuery ) );
