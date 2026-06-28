( function( $ ) {
	'use strict';

	function hasSelectiveRefresh() {
		return (
			'undefined' !== typeof wp &&
			wp.customize &&
			wp.customize.selectiveRefresh &&
			wp.customize.widgetsPreview &&
			wp.customize.widgetsPreview.WidgetPartial
		);
	}

	function elementorAddAction() {
		const args = arguments;

		if ( window.elementorFrontend && window.elementorFrontend.hooks ) {
			window.elementorFrontend.hooks.addAction.apply( window.elementorFrontend.hooks, args );
		} else {
			$( window ).on( 'elementor/frontend/init', function() {
				window.elementorFrontend.hooks.addAction.apply( window.elementorFrontend.hooks, args );
			} );
		}
	}

	window.yadakStorageSputnik = window.yadakStorageSputnik || {};
	window.yadakStorageSputnik.isRtl = ( function() {
		let direction = null;

		return function() {
			if ( null === direction ) {
				direction = getComputedStyle( document.body ).direction;
			}

			return 'rtl' === direction;
		};
	}() );
	window.yadakStorageSputnik.initWidget = function( widgetName, widgetSelector, initFn ) {
		initFn( widgetSelector );

		if ( hasSelectiveRefresh() ) {
			wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
				const regexp = new RegExp( '^' + widgetName + '-\\d+$' );

				if ( placement.partial.widgetId && regexp.test( placement.partial.widgetId ) ) {
					initFn( $( placement.container ).find( widgetSelector ) );
				}
			} );
		}

		elementorAddAction( 'frontend/element_ready/wp-widget-' + widgetName + '.default', function( $scope ) {
			initFn( $scope.find( widgetSelector ) );
		} );
	};
}( jQuery ) );
