( function( $ ) {
	'use strict';

	/* global yadakStorageSputnik */

	const sputnik = yadakStorageSputnik;
	const layoutOptions = {
		'grid-4': {
			items: 4,
			responsive: {
				1400: { items: 4 },
				1200: { items: 4 },
				992: { items: 4, margin: 16 },
				768: { items: 3, margin: 16 },
				576: { items: 2, margin: 16 },
			},
		},
		'grid-4-sidebar': {
			items: 4,
			responsive: {
				1400: { items: 4 },
				1200: { items: 3 },
				992: { items: 3, margin: 16 },
				768: { items: 3, margin: 16 },
				576: { items: 2, margin: 16 },
			},
		},
		'grid-5': {
			items: 5,
			responsive: {
				1400: { items: 5 },
				1200: { items: 4 },
				992: { items: 4, margin: 16 },
				768: { items: 3, margin: 16 },
				576: { items: 2, margin: 16 },
			},
		},
		'grid-6': {
			items: 6,
			margin: 16,
			responsive: {
				1400: { items: 6 },
				1200: { items: 4 },
				992: { items: 4, margin: 16 },
				768: { items: 3, margin: 16 },
				576: { items: 2, margin: 16 },
			},
		},
		horizontal: {
			items: 4,
			responsive: {
				1400: { items: 4, margin: 14 },
				992: { items: 3, margin: 14 },
				768: { items: 2, margin: 14 },
				0: { items: 1, margin: 14 },
			},
		},
		'horizontal-sidebar': {
			items: 3,
			responsive: {
				1400: { items: 3, margin: 14 },
				768: { items: 2, margin: 14 },
				0: { items: 1, margin: 14 },
			},
		},
	};

	function getLayoutOptions( layout, mobileGridColumns ) {
		const options = layoutOptions[ layout ];

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

		if ( layout.startsWith( 'grid-' ) ) {
			options.responsive = Object.assign( options.responsive, mobileGridBreakpoints );
		}

		return options;
	}

	function init( elements ) {
		$( elements ).each( function() {
			initSingle( this );
		} );
	}
	function initSingle( element ) {
		const block = $( element );
		const layout = block.data( 'layout' );
		const ajaxUrl = block.data( 'ajax-url' );
		const nonce = block.data( 'nonce' );
		const owlCarousel = block.find( '.owl-carousel' );
		const mobileGridColumns = block.data( 'mobile-grid-columns' );
		const owlOptions = $.extend(
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
			getLayoutOptions( layout, mobileGridColumns )
		);
		const medias = [];
		let cancelPreviousGroupChange = function() {};

		owlCarousel.on( 'initialized.owl.carousel', function() {
			owlCarousel.find( '.owl-item.cloned .th-product-card' ).trigger( 'th-product-card.init' );
		} );

		owlCarousel.owlCarousel( owlOptions );

		block.find( '.th-section-header__groups-button' ).on( 'click', function( event ) {
			if ( ! event.cancelable ) {
				return;
			}

			const carousel = block.find( '.th-block-products-carousel__carousel' );
			const group = $( this );

			if ( group.is( '.th-section-header__groups-button--active' ) ) {
				return;
			}

			cancelPreviousGroupChange();

			carousel.addClass( 'th-block-products-carousel__carousel--loading' );
			block.find( '.th-section-header__groups-button--active' ).removeClass( 'th-section-header__groups-button--active' );
			group.addClass( 'th-section-header__groups-button--active' );

			const data = group.data( 'group-data' );

			data.widget_name = 'yadakstorage_sputnik_block_products_carousel';
			data.widget_type = 'default';

			if ( 'REPLACE_TO_ID' === data.widget_id ) {
				const elementorWidget = group.parents( '[data-widget_type="wp-widget-yadakstorage_sputnik_block_products_carousel.default"]' );
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
				const html = $( response ).filter( '.th-block-products-carousel' );
				const items = html.find( '.th-block-products-carousel__column' );

				block.find( '.owl-carousel' )
					.trigger( 'replace.owl.carousel', [ items ] )
					.trigger( 'refresh.owl.carousel' )
					.trigger( 'to.owl.carousel', [ 0, 0 ] );

				owlCarousel.find( '.th-product-card' ).trigger( 'th-product-card.init' );

				carousel.removeClass( 'th-block-products-carousel__carousel--loading' );

				medias.forEach( function( media ) {
					media();
				} );
			} );

			cancelPreviousGroupChange = function() {
				ajax.abort();
				cancelPreviousGroupChange = function() {};
			};
		} );
		block.find( '.th-section-header__arrow--prev' ).on( 'click', function() {
			owlCarousel.trigger( 'prev.owl.carousel', [ 500 ] );
		} );
		block.find( '.th-section-header__arrow--next' ).on( 'click', function() {
			owlCarousel.trigger( 'next.owl.carousel', [ 500 ] );
		} );

		function setCurrentSlidesToShow( slidesToShow ) {
			if ( slidesToShow >= owlCarousel.find( '.owl-item:not(.cloned)' ).length ) {
				block.find( '.th-section-header' ).addClass( 'th-section-header--hide-arrows' );
			} else {
				block.find( '.th-section-header' ).removeClass( 'th-section-header--hide-arrows' );
			}
		}

		if ( owlOptions.responsive && Object.keys( owlOptions.responsive ).length ) {
			const breakpoints = Object.keys( owlOptions.responsive ).map( function( item ) {
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

				createMedia( query.join( ' and ' ), owlOptions.responsive[ breakpoint ].items );
			} );
		}
	}

	$( function() {
		sputnik.initWidget( 'yadakstorage_sputnik_block_products_carousel', '.th-block-products-carousel', init );
	} );
}( jQuery ) );
