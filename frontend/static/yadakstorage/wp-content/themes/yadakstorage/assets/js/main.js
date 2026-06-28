( function( $ ) {
	'use strict';

	/**
	 * @typedef {Object} YadakStorageVars
	 * @property {string} ajaxUrl
	 * @property {string} menuCacheKey
	 * @property {string} lang
	 */

	/**
	 * @member {YadakStorageVars} yadakStorageVars
	 */

	const vars = window.yadakStorageVars;

	let DIRECTION = null;

	function direction() {
		if ( DIRECTION === null ) {
			DIRECTION = getComputedStyle( document.body ).direction;
		}

		return DIRECTION;
	}

	function isRTL() {
		return direction() === 'rtl';
	}

	/*
	// Indicator / Dropcart, Account menu
	*/
	$( function() {
		$( '.th-indicator--trigger--click .th-indicator__button' ).on( 'click', function( event ) {
			event.preventDefault();

			const dropdown = $( this ).closest( '.th-indicator' );

			if ( dropdown.is( '.th-indicator--open' ) ) {
				dropdown.removeClass( 'th-indicator--open' );
			} else {
				dropdown.addClass( 'th-indicator--open' );
			}
		} );

		$( document ).on( 'click', function( event ) {
			$( '.th-indicator' )
				.not( $( event.target ).closest( '.th-indicator' ) )
				.removeClass( 'th-indicator--open' );
		} );
	} );

	/*
	// Departments / Button
	*/
	$( function() {
		$( '.th-departments__button' ).on( 'click', function( event ) {
			event.preventDefault();

			$( this ).closest( '.th-departments' ).toggleClass( 'th-departments--open' );
		} );

		$( document ).on( 'click', function( event ) {
			$( '.th-departments' )
				.not( $( event.target ).closest( '.th-departments' ) )
				.removeClass( 'th-departments--open' );
		} );
	} );

	/*
	// Megamenu
	*/
	( function() {
		const keys = Object.keys( localStorage );

		for ( let i = 0; i < keys.length; i++ ) {
			const key = keys[ i ];

			if ( ! key.startsWith( 'yadakstorage_megamenu_' ) ) {
				continue;
			}
			if ( key.startsWith( 'yadakstorage_megamenu_' + vars.menuCacheKey ) ) {
				continue;
			}

			localStorage.removeItem( key );
		}
	}() );
	function makeMegamenuLoader() {
		let requested = false;

		const applyMegamenus = function( megamenus, container ) {
			const ids = Object.keys( megamenus );

			for ( let i = 0; i < ids.length; i++ ) {
				const menuItemId = ids[ i ];
				const menuItem = $( '.th-megamenu--lazy[data-id="' + menuItemId + '"]', container );

				menuItem
					.removeClass( 'th-megamenu--lazy' )
					.empty()
					.append( $( megamenus[ menuItemId ] ).contents() );
			}
		};

		return function( menuName, container ) {
			const cacheKey = 'yadakstorage_megamenu_' + vars.menuCacheKey + '_' + vars.lang + '_' + menuName;

			if ( requested ) {
				return;
			}

			requested = true;

			const menuItemIds = $( '.th-megamenu--lazy', container ).toArray().map( function( element ) {
				return $( element ).data( 'id' );
			} );

			if ( menuItemIds.length < 1 ) {
				return;
			}

			const megamenus = localStorage.getItem( cacheKey );

			if ( megamenus ) {
				applyMegamenus( JSON.parse( megamenus ), container );
				return;
			}

			$.post( vars.ajaxUrl, {
				action: 'yadakstorage_sputnik_megamenu',
				data: {
					ids: menuItemIds,
				},
			}, function( response ) {
				if ( response.success ) {
					localStorage.setItem( cacheKey, JSON.stringify( response.data.megamenus ) );

					applyMegamenus( response.data.megamenus, container );
				}
			} );
		};
	}

	/*
	// Departments / Megamenu
	*/
	$( function() {
		let currentItem = null;
		const container = $( '.th-departments__menu-container' );
		const departmentsBody = $( '.th-departments__body' );
		const megamenuLoader = makeMegamenuLoader();

		$( '.th-departments__list > .menu-item' ).on( 'mouseenter', function() {
			if ( currentItem ) {
				const megamenu = currentItem.data( 'megamenu' );

				if ( megamenu ) {
					megamenu.removeClass( 'th-megamenu--open' );
				}

				currentItem.removeClass( 'menu-item-hover' );
				currentItem = null;
			}

			currentItem = $( this ).addClass( 'menu-item-hover' );

			if ( currentItem.is( '.menu-item-megamenu' ) ) {
				let megamenu = currentItem.data( 'megamenu' );

				if ( ! megamenu ) {
					megamenu = $( '> .th-megamenu', this );

					currentItem.data( 'megamenu', megamenu );

					container.append( megamenu );
				}

				megamenu.addClass( 'th-megamenu--open' );
				megamenuLoader( 'departments', departmentsBody );
			}
		} );
		$( '.th-departments__list > .th-menu-item-padding' ).on( 'mouseenter', function() {
			if ( currentItem ) {
				const megamenu = currentItem.data( 'megamenu' );

				if ( megamenu ) {
					megamenu.removeClass( 'th-megamenu--open' );
				}

				currentItem.removeClass( 'menu-item-hover' );
				currentItem = null;
			}
		} );
		departmentsBody.on( 'mouseleave', function() {
			if ( currentItem ) {
				const megamenu = currentItem.data( 'megamenu' );

				if ( megamenu ) {
					megamenu.removeClass( 'th-megamenu--open' );
				}

				currentItem.removeClass( 'menu-item-hover' );
				currentItem = null;
			}
		} );
	} );

	/*
	// Main menu / Megamenu
	*/
	$( function() {
		const megamenuArea = $( '.th-megamenu-area' );
		const megamenuLoader = makeMegamenuLoader();

		$( '.th-main-menu .menu-item-megamenu' ).on( 'mouseenter', function() {
			const megamenu = $( this ).children( '.th-megamenu' );
			const offsetParent = megamenu.offsetParent();

			megamenuLoader( 'main', $( this ).parents( '.th-main-menu' ) );

			if ( isRTL() ) {
				const position = Math.max(
					megamenuArea.offset().left,
					Math.min(
						$( this ).offset().left + $( this ).outerWidth() - megamenu.outerWidth(),
						megamenuArea.offset().left + megamenuArea.outerWidth() - megamenu.outerWidth()
					)
				) - offsetParent.offset().left;

				megamenu.css( 'left', position + 'px' );
			} else {
				const position = Math.max(
					0,
					Math.min(
						$( this ).offset().left,
						megamenuArea.offset().left + megamenuArea.outerWidth() - megamenu.outerWidth()
					)
				) - offsetParent.offset().left;

				megamenu.css( 'left', position + 'px' );
			}
		} );
	} );

	/*
	// .th-block-header
	*/
	( function() {
		// So that breadcrumbs correctly flow around the page title, we need to know its width.
		// This code simply conveys the width of the page title in CSS.

		const media = matchMedia( '(min-width: 1200px)' );
		const updateTitleWidth = function() {
			const width = $( '.th-block-header__title' ).outerWidth();
			const titleSafeArea = $( '.woocommerce-breadcrumb' ).get( 0 );

			if ( titleSafeArea && width ) {
				titleSafeArea.style.setProperty( '--th-block-header-title-width', width + 'px' );
			}
		};

		if ( media.matches ) {
			updateTitleWidth();
		}

		if ( media.addEventListener ) {
			media.addEventListener( 'change', updateTitleWidth );
		} else {
			media.addListener( updateTitleWidth );
		}
	}() );

	/*
	// Mobile search
	*/
	$( function() {
		const mobileSearch = $( '.th-mobile-header__search' );

		if ( mobileSearch.length ) {
			$( '.th-mobile-indicator--search .th-mobile-indicator__button' ).on( 'click', function() {
				if ( mobileSearch.is( '.th-mobile-header__search--open' ) ) {
					mobileSearch.removeClass( 'th-mobile-header__search--open' );
				} else {
					mobileSearch.addClass( 'th-mobile-header__search--open' );
					mobileSearch.find( '.th-search__input' )[ 0 ].focus();
				}
			} );

			mobileSearch.find( '.th-search__button--close' ).on( 'click', function() {
				mobileSearch.removeClass( 'th-mobile-header__search--open' );
			} );

			document.addEventListener( 'click', function( event ) {
				if ( ! $( event.target ).closest( '.th-mobile-indicator--search, .th-mobile-header__search, .th-modal' ).length ) {
					mobileSearch.removeClass( 'th-mobile-header__search--open' );
				}
			}, true );
		}
	} );

	/*
	// Mobile menu
	*/
	$( function() {
		const body = $( 'body' );
		const mobileMenu = $( '.th-mobile-menu' );
		const mobileMenuBody = mobileMenu.children( '.th-mobile-menu__body' );

		if ( mobileMenu.length ) {
			const open = function() {
				const bodyWidth = body.width();
				body.css( 'overflow', 'hidden' );
				body.css( 'paddingRight', ( body.width() - bodyWidth ) + 'px' );

				mobileMenu.addClass( 'th-mobile-menu--open' );
			};
			const close = function() {
				body.css( 'overflow', 'auto' );
				body.css( 'paddingRight', '' );

				mobileMenu.removeClass( 'th-mobile-menu--open' );
			};

			$( '.th-mobile-header__menu-button' ).on( 'click', function() {
				open();
			} );
			$( '.th-mobile-menu__backdrop, .th-mobile-menu__close' ).on( 'click', function() {
				close();
			} );
		}

		const convertMenuToPanel = function( panel ) {
			const items = $( '> .th-mobile-menu__panel-body > .th-mobile-menu__links > ul > .menu-item-has-children', panel );

			items.each( function( index, element ) {
				const subMenu = $( '> .sub-menu, > .th-megamenu', element );
				const subMenuLink = $( '> a', element );
				const subMenuTitle = subMenuLink.text();

				if ( 0 === subMenu.length ) {
					return;
				}

				let subMenuPanelContent;

				if ( subMenu.is( '.sub-menu' ) ) {
					subMenuPanelContent = subMenu.removeClass( 'sub-menu' ).addClass( 'menu' );
				}

				if ( subMenu.is( '.th-megamenu' ) ) {
					subMenuPanelContent = $( '<ul class="menu"></ul>' );
					subMenuPanelContent.append(
						$( '> .th-megamenu__row > li > ul > li', subMenu )
					);
				}

				const subMenuPanel = $( '.th-mobile-menu__links-panel--template' ).clone();

				subMenuPanel.removeClass( 'th-mobile-menu__links-panel--template' );

				$( '.th-mobile-menu__panel-title', subMenuPanel ).text( subMenuTitle );
				$( '.th-mobile-menu__links', subMenuPanel ).append( subMenuPanelContent );

				$( element ).attr( 'data-mobile-menu-item', '' );
				subMenuLink.attr( 'data-mobile-menu-trigger', '' );
				subMenuPanel.attr( 'data-mobile-menu-panel', '' );

				$( element ).append( subMenuPanel );

				convertMenuToPanel( $( '> .th-mobile-menu__panel', subMenuPanel ) );
			} );
		};

		const panelsStack = [];
		let currentPanel = mobileMenuBody.children( '.th-mobile-menu__panel' );

		convertMenuToPanel( currentPanel );

		mobileMenu.on( 'click', '[data-mobile-menu-trigger]', function( event ) {
			const trigger = $( this );
			const item = trigger.closest( '[data-mobile-menu-item]' );
			let panel = item.data( 'panel' );

			if ( ! panel ) {
				panel = item.children( '[data-mobile-menu-panel]' ).children( '.th-mobile-menu__panel' );

				if ( panel.length ) {
					mobileMenuBody.append( panel );
					item.data( 'panel', panel );
					panel.width(); // force reflow
				}
			}

			if ( panel && panel.length ) {
				event.preventDefault();

				panelsStack.push( currentPanel );
				currentPanel.addClass( 'th-mobile-menu__panel--hide' );

				panel.removeClass( 'th-mobile-menu__panel--hidden' );
				currentPanel = panel;
			}
		} );
		mobileMenu.on( 'click', '.th-mobile-menu__panel-back', function() {
			currentPanel.addClass( 'th-mobile-menu__panel--hidden' );
			currentPanel = panelsStack.pop();
			currentPanel.removeClass( 'th-mobile-menu__panel--hide' );
		} );

		mobileMenuBody.on( 'transitionend', function( event ) {
			if ( ! mobileMenuBody.is( event.target ) ) {
				return;
			}
			if ( 'transform' !== event.originalEvent.propertyName ) {
				return;
			}
			if ( mobileMenu.is( '.th-mobile-menu--open' ) ) {
				return;
			}

			while ( 0 !== panelsStack.length ) {
				currentPanel.addClass( 'th-mobile-menu__panel--hidden' );
				currentPanel = panelsStack.pop();
				currentPanel.removeClass( 'th-mobile-menu__panel--hide' );
			}
		} );
	} );

	/*
	// .layout-switcher
	*/
	$( function() {
		$( '.th-layout-switcher__button' ).on( 'click', function() {
			const layoutSwitcher = $( this ).closest( '.th-layout-switcher' );
			const productsView = $( this ).closest( '.th-products-view' );
			const productsList = productsView.find( '.th-products-list' );

			layoutSwitcher
				.find( '.th-layout-switcher__button' )
				.removeClass( 'th-layout-switcher__button--active' )
				.removeAttr( 'disabled' );

			$( this )
				.addClass( 'th-layout-switcher__button--active' )
				.attr( 'disabled', '' );

			productsList.attr( 'data-layout', $( this ).attr( 'data-layout' ) );
			productsList.attr( 'data-with-features', $( this ).attr( 'data-with-features' ) );
		} );
	} );

	/*
	// Per page.
	*/
	$( function() {
		$( '#th-view-options-per-page' ).on( 'change', function() {
			$( this ).closest( 'form' ).trigger( 'submit' );
		} );
	} );

	/*
	// Initialize custom numbers
	*/
	$( function() {
		$( '.th-input-number' ).customNumber();

		// quickview
		$( document ).on( 'th-quickview.init', function( event ) {
			$( event.target ).find( '.th-input-number' ).customNumber();
		} );

		// after cart updated
		$( document ).on( 'updated_wc_div', function() {
			$( '.th-input-number' ).customNumber();
		} );
	} );

	/*
	// Variation form.
	*/
	$( function() {
		function yadakStorageInitVariationForm( form ) {
			$( form ).find( '.th-input-radio-color' ).each( function( index, element ) {
				$( element ).find( 'input' ).on( 'change', function() {
					$( element ).closest( '.value' ).find( 'select' ).val( this.value ).trigger( 'change' );
				} );
			} );
			$( form ).find( '.th-input-radio-label' ).each( function( index, element ) {
				$( element ).find( 'input' ).on( 'change', function() {
					$( element ).closest( '.value' ).find( 'select' ).val( this.value ).trigger( 'change' );
				} );
			} );

			form.on( 'check_variations', function() {
				let chosen = 0;

				$( this ).closest( '.variations_form' ).find( '.variations select' ).each( function() {
					if ( 0 < ( $( this ).val() || '' ).length ) {
						chosen++;
					}
				} );

				const element = $( this ).find( '.reset_variations' ).closest( '.th-reset-variations' );

				if ( 0 < chosen ) {
					if ( element.hasClass( 'th-reset-variations--hidden' ) ) {
						const initialHeight = element.height();

						element.removeClass( 'th-reset-variations--hidden' );

						const resultHeight = element.height();

						element.css( 'height', initialHeight + 'px' );
						element.height(); // force reflow
						element.css( 'height', resultHeight + 'px' );
					}
				} else if ( ! element.hasClass( 'th-reset-variations--hidden' ) ) {
					const initialHeight = element.height();

					element.css( 'height', initialHeight + 'px' );
					element.addClass( 'th-reset-variations--hidden' );
					element.height(); // force reflow
					element.css( 'height', '' );
				}
			} ).on( 'woocommerce_update_variation_values', function() {
				$( this ).find( '.th-input-radio-color' ).each( function( elementIndex, element ) {
					const select = $( element ).closest( '.value' ).find( 'select' );
					const values = select.find( 'option' ).toArray().map( function( domElement ) {
						return domElement.value;
					} );

					$( element ).find( 'input' ).each( function( inputIndex, input ) {
						if ( 0 > values.indexOf( input.value ) ) {
							$( input )
								.prop( 'checked', false )
								.prop( 'disabled', true )
								.closest( '.th-input-radio-color__item' )
								.addClass( 'th-input-radio-color__item--disabled' );
						} else {
							$( input )
								.prop( 'checked', input.value === select.val() )
								.prop( 'disabled', false )
								.closest( '.th-input-radio-color__item' )
								.removeClass( 'th-input-radio-color__item--disabled' );
						}
					} );
				} );
				$( this ).find( '.th-input-radio-label' ).each( function( elementIndex, element ) {
					const select = $( element ).closest( '.value' ).find( 'select' );
					const values = select.find( 'option' ).toArray().map( function( domElement ) {
						return domElement.value;
					} );

					$( element ).find( 'input' ).each( function( inputIndex, input ) {
						if ( 0 > values.indexOf( input.value ) ) {
							$( input )
								.prop( 'checked', false )
								.prop( 'disabled', true );
						} else {
							$( input )
								.prop( 'checked', input.value === select.val() )
								.prop( 'disabled', false );
						}
					} );
				} );
			} );
		}

		$( document ).on( 'yadakstorage.sputnik.quickview.show', function( event, modal ) {
			yadakStorageInitVariationForm( modal.find( '.variations_form' ) );
		} );

		yadakStorageInitVariationForm( $( '.variations_form' ) );
	} );

	/*
	// Remove button on mini cart.
	*/
	$( function() {
		$( document ).on( 'click', '.woocommerce-mini-cart .remove_from_cart_button', function() {
			$( this ).addClass( 'stroyka-loading' );
		} );
		$( document ).on( 'removed_from_cart', function( event, fragments, cartHash, button ) {
			$( button ).removeClass( 'stroyka-loading' );
		} );
	} );

	/*
	// collapse
	*/
	$( function() {
		$( '[data-collapse]' ).each( function( i, element ) {
			const collapse = element;
			const openClass = $( element ).data( 'collapse-open-class' );

			$( '[data-collapse-trigger]', collapse ).on( 'click', function() {
				const item = $( this ).closest( '[data-collapse-item]' );
				const content = item.children( '[data-collapse-content]' );
				const itemParents = item.parents();

				itemParents
					.slice( 0, itemParents.index( collapse ) + 1 )
					.filter( '[data-collapse-item]' )
					.css( 'height', '' );

				// noinspection DuplicatedCode
				if ( item.is( '.' + openClass ) ) {
					const startHeight = content.height();

					content.css( 'height', startHeight + 'px' );
					item.removeClass( openClass );
					content.height(); // force reflow
					content.css( 'height', '' );
				} else {
					const startHeight = content.height();

					item.addClass( openClass );

					const endHeight = content.height();

					content.css( 'height', startHeight + 'px' );
					content.height(); // force reflow
					content.css( 'height', endHeight + 'px' );
				}
			} );

			$( '[data-collapse-content]', collapse ).on(
				'transitionend',
				/**
				 * @param {Event} event
				 * @param {TransitionEvent} event.originalEvent
				 */
				function( event ) {
					if ( event.originalEvent.propertyName === 'height' ) {
						$( this ).css( 'height', '' );
					}
				}
			);
		} );
	} );

	/*
	// Open gallery.
	*/
	$( function() {
		$( '.th-product-gallery__trigger' ).on( 'click', function() {
			$( this ).closest( '.th-product-gallery' ).find( '.woocommerce-product-gallery__trigger' ).trigger( 'click' );
		} );
	} );

	/*
	// Tooltips.
	*/
	$( function() {
		tippy( '[data-tippy-content]' );
	} );
	$( document ).on( 'th-product-card.init', function( event ) {
		tippy( $( '[data-tippy-content]', event.target ).toArray() );
	} );
	$( document ).on( 'th-compatibility-badge.update', function( event ) {
		tippy( $( '[data-tippy-content]', event.target ).toArray() );
	} );

	/*
    // header categories
    */
	$( function() {
		$( '.th-search' ).each( function( i, element ) {
			const context = element;

			const categoriesPicker = $( '.th-search__dropdown--category-picker', context );
			const categoriesButton = $( '.th-search__button--category', context );
			const listItems = categoriesPicker.find( 'li' );
			let listBlurDisabled = false;

			function toggle( state ) {
				categoriesButton.toggleClass( 'th-search__button--hover', state );
				categoriesPicker.toggleClass( 'th-search__dropdown--open', state );

				if ( categoriesPicker.hasClass( 'th-search__dropdown--open' ) ) {
					categoriesButton.attr( 'aria-expanded', 'true' );
					categoriesPicker.find( 'ul' )[ 0 ].focus();

					for ( let j = 0; j < listItems.length; j++ ) {
						if ( listItems[ j ].dataset.value === categoriesButton.data( 'value' ) ) {
							setCurrent( listItems[ j ] );

							break;
						}
					}
				} else {
					categoriesButton.removeAttr( 'aria-expanded' );
					categoriesPicker.find( 'ul' ).removeAttr( 'aria-activedescendant' );
					categoriesPicker.find( 'li' ).removeClass( 'th-dropdown-list__item--current' ).removeAttr( 'aria-selected' );
				}
			}

			function open() {
				toggle( true );
			}

			function close() {
				categoriesButton[ 0 ].focus();

				toggle( false );
			}

			function setCurrent( listItem ) {
				categoriesPicker.find( 'ul' ).attr( 'aria-activedescendant', $( listItem ).attr( 'id' ) );
				categoriesPicker.find( 'li' ).removeClass( 'th-dropdown-list__item--current' ).removeAttr( 'aria-selected' );
				$( listItem ).addClass( 'th-dropdown-list__item--current' ).attr( 'aria-selected', 'true' );
			}

			function select() {
				const currentListItem = listItems.filter( '.th-dropdown-list__item--current' );

				if ( currentListItem.length > 0 ) {
					categoriesButton.data( 'value', currentListItem.data( 'value' ) );
					categoriesButton.find( '.th-search__button-title' ).text( currentListItem.text().trim() );

					const input = $( '.th-search__input', context );
					const template = input.data( 'placeholder-template' );
					const placeholder = currentListItem.data( 'value' )
						? template.replace( '%s', currentListItem.text().trim() )
						: input.data( 'placeholder-default' );

					input.attr( 'placeholder', placeholder );

					const categoryInput = $( '.th-search__category', context );

					categoryInput.val( currentListItem.data( 'value' ) );

					// Set the category for the search suggestions.
					$( '.th-suggestions', context ).attr( 'data-taxonomy-value', currentListItem.data( 'value' ) );

					if ( currentListItem.data( 'value' ) ) {
						categoryInput.removeAttr( 'disabled' );
					} else {
						categoryInput.attr( 'disabled', '' );
					}
				}

				close();
			}

			$( document ).on( 'click', function( event ) {
				if ( ! $( event.target ).closest( '.th-search__dropdown--category-picker, .th-search__button--category' ).length ) {
					toggle( false );
				}
			} );

			categoriesButton.on( 'keydown', function( event ) {
				switch ( event.which ) {
					case 13: // ENTER
					case 32: // SPACEBAR
					case 38: // UP
					case 40: // DOWN
						event.preventDefault();

						open();
						break;
				}
			} );

			categoriesButton.on( 'mousedown', function() {
				listBlurDisabled = true;

				document.addEventListener( 'mouseup', function() {
					listBlurDisabled = false;
				} );
			} );
			categoriesButton.on( 'click', function() {
				toggle();
			} );

			categoriesPicker.find( 'ul' ).on( 'blur', function() {
				if ( ! listBlurDisabled ) {
					toggle( false );
				}
			} );

			categoriesPicker.find( 'ul' ).on( 'keydown', function( event ) {
				if ( 13 === event.which ) { // ENTER
					event.preventDefault();

					select();
				}
				if ( 27 === event.which ) { // ESCAPE
					event.preventDefault();

					close();
				}
				if ( 38 === event.which ) { // UP
					event.preventDefault();

					if ( listItems.length === 0 ) {
						return;
					}

					const currentListItem = listItems.filter( '.th-dropdown-list__item--current' );
					const currentListItemIdx = listItems.index( currentListItem );

					if ( -1 === currentListItemIdx ) {
						setCurrent( listItems.last() );
					} else if ( currentListItemIdx > 0 ) {
						setCurrent( listItems.get( currentListItemIdx - 1 ) );
					}
				}
				if ( 40 === event.which ) { // DOWN
					event.preventDefault();

					if ( listItems.length === 0 ) {
						return;
					}

					const currentListItem = listItems.filter( '.th-dropdown-list__item--current' );
					const currentListItemIdx = listItems.index( currentListItem );

					if ( -1 === currentListItemIdx ) {
						setCurrent( listItems.first() );
					} else if ( currentListItemIdx < listItems.length - 1 ) {
						setCurrent( listItems.get( currentListItemIdx + 1 ) );
					}
				}
				if ( 35 === event.which ) { // END
					event.preventDefault();

					setCurrent( categoriesPicker.find( 'li:last' ) );
				}
				if ( 36 === event.which ) { // HOME
					event.preventDefault();

					setCurrent( categoriesPicker.find( 'li:first' ) );
				}
			} );

			listItems.on( 'mouseenter', function() {
				setCurrent( this );
			} );

			categoriesPicker.find( 'li' ).on( 'click', function() {
				setCurrent( this );
				select();
			} );
		} );
	} );

	/*
    // header vehicle
    */
	$( function() {
		const vehiclePicker = $( '.th-search__dropdown--vehicle-picker' );
		const vehiclePickerButton = $( '.th-search__button--vehicle' );

		const switchTo = function( toPanel ) {
			const currentPanel = vehiclePicker.find( '.th-vehicle-picker__panel--active' );
			const nextPanel = vehiclePicker.find( '[data-panel="' + toPanel + '"]' );

			currentPanel.removeClass( 'th-vehicle-picker__panel--active' );
			nextPanel.addClass( 'th-vehicle-picker__panel--active' );
		};

		vehiclePickerButton.on( 'click', function() {
			vehiclePickerButton.toggleClass( 'th-search__button--hover' );
			vehiclePicker.toggleClass( 'th-search__dropdown--open' );
		} );

		vehiclePicker.on( 'transitionend', function( event ) {
			if ( event.originalEvent.propertyName === 'visibility' && vehiclePicker.is( event.target ) ) {
				if ( ! $( 'body' ).is( '.th-garage-empty' ) ) {
					switchTo( 'list' );
				}
			}
			if ( event.originalEvent.propertyName === 'height' && vehiclePicker.is( event.target ) ) {
				vehiclePicker.css( 'height', '' );
			}
		} );

		$( document ).on( 'click', function( event ) {
			if ( ! $( event.target ).closest( '.th-search__dropdown--vehicle-picker, .th-search__button--vehicle, .select2-container' ).length ) {
				vehiclePickerButton.removeClass( 'th-search__button--hover' );
				vehiclePicker.removeClass( 'th-search__dropdown--open' );
			}
		} );

		$( '.th-vehicle-picker [data-to-panel]' ).on( 'click', function( event ) {
			event.preventDefault();

			switchTo( $( this ).data( 'to-panel' ) );
		} );

		$( document ).on( 'th-garage.update', function( event, vehicles ) {
			if ( 0 === vehicles.length ) {
				switchTo( 'form' );
			} else {
				switchTo( 'list' );
			}
		} );
	} );

	/*
	// vehicle picker modal
	*/
	$( function() {
		$( '.th-search--location--mobile-header .th-search__button--vehicle' ).on( 'click', function() {
			if ( window.yadakStorageSputnik && window.yadakStorageSputnik.vehiclePickerModal ) {
				const vehiclePickerModal = window.yadakStorageSputnik.vehiclePickerModal;
				const ref = vehiclePickerModal.open();

				ref.on( 'select', function( vehicle ) {
					if ( window.yadakStorageSputnik && window.yadakStorageSputnik.garage ) {
						window.yadakStorageSputnik.garage.setCurrentVehicle( vehicle );
					}
				} );
			}
		} );
	} );

	/*
	// offcanvas filters
	*/
	$( function() {
		const body = $( 'body' );
		const sidebar = $( '.th-sidebar' );
		const mobileMedia = matchMedia( '(max-width: 991px)' );

		if ( sidebar.length ) {
			const open = function() {
				if ( sidebar.is( '.th-sidebar--offcanvas--mobile' ) && ! mobileMedia.matches ) {
					return;
				}

				const bodyWidth = body.width();
				body.css( 'overflow', 'hidden' );
				body.css( 'paddingRight', ( body.width() - bodyWidth ) + 'px' );

				sidebar.addClass( 'th-sidebar--open' );
			};
			const close = function() {
				body.css( 'overflow', '' );
				body.css( 'paddingRight', '' );

				sidebar.removeClass( 'th-sidebar--open' );
			};
			const onChangeMedia = function() {
				if ( sidebar.is( '.th-sidebar--open.th-sidebar--offcanvas--mobile' ) && ! mobileMedia.matches ) {
					close();
				}
			};

			$( '.th-filters-button' ).on( 'click', function() {
				open();
			} );
			$( '.th-sidebar__backdrop, .th-sidebar__close' ).on( 'click', function() {
				close();
			} );

			if ( mobileMedia.addEventListener ) {
				mobileMedia.addEventListener( 'change', onChangeMedia );
			} else {
				// noinspection JSDeprecatedSymbols
				mobileMedia.addListener( onChangeMedia );
			}
		}
	} );

	/*
	// Currency switcher.
	*/
	$( document ).on( 'click', '[data-th-currency-code]', function( event ) {
		event.preventDefault();

		const currencyCode = $( this ).data( 'th-currency-code' );

		jQuery.post( {
			url: vars.ajaxUrl,
			data: {
				action: 'woocs_set_currency_ajax',
				currency: currencyCode,
			},
		}, function() {
			location.reload();
		} );
	} );

	/*
	// Prevent default.
	*/
	$( document ).on( 'click', '[data-th-prevent-default]', function( event ) {
		event.preventDefault();
	} );

	/*
	// Prevent default.
	*/
	$( document ).on( 'click', '.th-full-specification', function() {
		$( '#tab-title-additional_information a' ).trigger( 'click' );
	} );

	/*
	// Search suggestions.
	*/
	$( function() {
		$( '.th-search' ).each( function( _, element ) {
			const search = $( element );
			const input = $( '.th-search__input', search );
			const dropdown = $( '.th-search__dropdown--suggestions', search );
			const suggestions = $( '.th-suggestions', search );
			const suggestionsList = $( '.th-suggestions__list', suggestions );

			if ( ! suggestions[ 0 ] ) {
				return;
			}

			let abortPreviousRequest = function() {};

			const isOpen = function() {
				return dropdown.hasClass( 'th-search__dropdown--open' );
			};
			const hasSuggestions = function() {
				const options = $( '.th-suggestions__item', suggestions );

				return options.length > 0;
			};
			const open = function() {
				input.attr( 'aria-expanded', 'true' );
				dropdown.addClass( 'th-search__dropdown--open' );
			};
			const close = function() {
				input.attr( 'aria-expanded', 'false' );
				dropdown.removeClass( 'th-search__dropdown--open' );
			};
			const prevOption = function() {
				const options = $( '.th-suggestions__item', suggestions );
				const currentOption = options.filter( '.th-suggestions__item--hover' );
				const currentOptionIdx = options.index( currentOption );

				if ( -1 === currentOptionIdx ) {
					return options.last();
				} else if ( currentOptionIdx > 0 ) {
					return options.eq( currentOptionIdx - 1 );
				}

				return null;
			};
			const nextOption = function() {
				const options = $( '.th-suggestions__item', suggestions );
				const currentOption = options.filter( '.th-suggestions__item--hover' );
				const currentOptionIdx = options.index( currentOption );

				if ( -1 === currentOptionIdx ) {
					return options.first();
				} else if ( currentOptionIdx < options.length - 1 ) {
					return options.eq( currentOptionIdx + 1 );
				}

				return null;
			};
			const resetOptions = function() {
				const options = $( '.th-suggestions__item', suggestions );

				options.removeClass( 'th-suggestions__item--hover' );
				options.removeAttr( 'aria-selected' );
			};
			const selectOption = function( option ) {
				const options = $( '.th-suggestions__item', suggestions );

				resetOptions();

				if ( option ) {
					input.attr( 'aria-activedescendant', option.attr( 'id' ) );
					input.val( option.data( 's' ) );
					option.attr( 'aria-selected', 'true' );
					option.addClass( 'th-suggestions__item--hover' );

					const offsetTop = option.scrollParent().scrollTop() + options.first().position().top;
					option.scrollParent().scrollTop( option.scrollParent().scrollTop() + option.position().top - offsetTop );
				} else {
					input.removeAttr( 'aria-activedescendant' );
					input.val( input.data( 'value' ) || '' );

					suggestionsList.scrollTop( 0 );
				}
			};

			input.on( 'input', function() {
				const s = this.value.trim();

				input.data( 'value', s );

				abortPreviousRequest();

				if ( 0 === s.length ) {
					close();

					return;
				}

				const timerId = setTimeout( function() {
					const xhr = $.ajax( {
						type: 'post',
						url: suggestions.data( 'ajax-url' ),
						dataType: 'html',
						data: {
							action: 'yadakstorage_sputnik_search_suggestions',
							nonce: suggestions.data( 'nonce' ),
							s: s,
							id: search.data( 'id-prefix' ),
							yadakstorage_taxonomy: suggestions.attr( 'data-taxonomy' ),
							yadakstorage_taxonomy_value: suggestions.attr( 'data-taxonomy-value' ),
						},
						success: function( response ) {
							$( '.th-suggestions__list', suggestions ).html( response );

							if ( response.trim() === '' ) {
								close();
							} else {
								open();
							}
						},
					} );

					abortPreviousRequest = xhr.abort;
				}, 300 );

				abortPreviousRequest = function() {
					clearTimeout( timerId );
				};
			} );
			input.on( 'keydown', function( event ) {
				if ( 38 === event.which ) { // UP
					event.preventDefault();

					if ( ! hasSuggestions() ) {
						return;
					}

					if ( isOpen() ) {
						selectOption( prevOption() );
					} else {
						open();
					}
				}
				if ( 40 === event.which ) { // DOWN
					event.preventDefault();

					if ( ! hasSuggestions() ) {
						return;
					}

					if ( isOpen() ) {
						selectOption( nextOption() );
					} else {
						open();
					}
				}
				if ( 27 === event.which ) { // ESCAPE
					event.preventDefault();

					input.val( input.data( 'value' ) || '' );

					resetOptions();
					close();
				}
				if ( 13 === event.which ) { // ENTER
					const optionId = input.attr( 'aria-activedescendant' );

					if ( ! optionId ) {
						return;
					}

					const option = $( 'a#' + optionId + '[href]', suggestions );

					if ( option.length === 0 ) {
						return;
					}

					event.preventDefault();

					window.location.href = option.attr( 'href' );
				}
			} );
			input.on( 'focus', function() {
				if ( this.value.trim() !== '' && hasSuggestions() ) {
					open();
				}
			} );
			input.on( 'blur', function( event ) {
				if ( $( event.relatedTarget ).closest( '.th-suggestions' ).is( suggestions ) ) {
					return;
				}

				close();
			} );
		} );
	} );

	/*
	// Autofocus select2 search field.
	// https://github.com/select2/select2/issues/5993
	*/
	$( document ).on( 'select2:open', function() {
		setTimeout( function() {
			const searchField = document.querySelector( '.select2-search__field' );

			if ( searchField ) {
				searchField.focus();
			}
		}, 10 );
	} );
}( jQuery ) );




document.addEventListener('DOMContentLoaded', function() {
    // باز کردن پاپ‌اپ با کلیک روی آیکن ویدئو
    const videoTrigger = document.querySelector('.th-product-gallery__video-trigger');
    if (videoTrigger) {
        videoTrigger.addEventListener('click', function() {
            const videoPopup = document.getElementById('video-popup');
            if (videoPopup) {
                videoPopup.style.display = 'flex';
            }
        });
    }

    // بستن پاپ‌اپ با کلیک روی دکمه بستن
    const closeButton = document.querySelector('.video-popup__close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            const videoPopup = document.getElementById('video-popup');
            if (videoPopup) {
                videoPopup.style.display = 'none';
            }
        });
    }

    // بستن پاپ‌اپ با کلیک روی overlay
    const overlay = document.querySelector('.video-popup__overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            const videoPopup = document.getElementById('video-popup');
            if (videoPopup) {
                videoPopup.style.display = 'none';
            }
        });
    }
});