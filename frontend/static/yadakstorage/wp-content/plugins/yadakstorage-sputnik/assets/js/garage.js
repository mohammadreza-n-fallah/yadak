( function( $ ) {
	'use strict';

	/**
	 * @typedef {Object} YadakStorageSputnikGarageVars
	 * @property {string} ajaxUrl
	 * @property {string} nonceAdd
	 * @property {string} nonceRemove
	 * @property {string} nonceSetCurrent
	 * @property {string} attributeFilterName
	 */

	/**
	 * @member {YadakStorageSputnikGarageVars} yadakStorageSputnikGarageVars
	 */

	/**
	 * @type {YadakStorageSputnikGarageVars}
	 */
	const vars = window.yadakStorageSputnikGarageVars;
	const sputnik = window.yadakStorageSputnik = window.yadakStorageSputnik || {};

	function getGlobalBadges() {
		return $( '[data-th-compatibility-badge]' )
			.toArray()
			.map( function( badgeElement ) {
				const badgeData = $( badgeElement ).data( 'th-compatibility-badge' ).split( ':' );
				const scope = badgeData[ 0 ];

				if ( 'global' !== scope ) {
					return null;
				}

				return badgeData[ 1 ];
			} )
			.filter( function( productId ) {
				return null !== productId;
			} )
			// Filter only unique values.
			.filter( function( value, index, self ) {
				return self.indexOf( value ) === index;
			} );
	}

	function handleGarageResponse( response ) {
		if ( ! response.data || ! response.data.fragments ) {
			return;
		}

		Object.keys( response.data.fragments ).forEach( function( selector ) {
			$( selector ).replaceWith( response.data.fragments[ selector ] );
		} );

		$( document ).trigger( 'th-garage.update', [ response.data.vehicles ] );
	}

	function handleCompatibilityBadgesResponse( response ) {
		if ( ! response.data || ! response.data.compatibility_badges ) {
			return;
		}

		Object.keys( response.data.compatibility_badges ).forEach( function( productId ) {
			const badge = $( '[data-th-compatibility-badge="global:' + productId + '"]' );

			badge.children().remove();
			badge.append( $( response.data.compatibility_badges[ productId ] ).find( '.th-status-badge' ) );
			badge.trigger( 'th-compatibility-badge.update' );
		} );
	}

	sputnik.garage = {
		setCurrentVehicle: function( data ) {
			$( document ).trigger( 'th-garage-set-current', [ data ] );

			$.post( vars.ajaxUrl, {
				action: 'yadakstorage_sputnik_garage_set_current',
				nonce: vars.nonceSetCurrent,
				data: {
					vehicle_key: data.vehicle_key,
					badges: getGlobalBadges().join( ',' ),
				},
			}, function( response ) {
				if ( response.success ) {
					handleCompatibilityBadgesResponse( response );
				}
			} );
		},
	};

	$( function() {
		// Controls .th-garage-empty CSS class.
		$( document ).on( 'th-garage.update', function( event, vehicles ) {
			$( 'body' ).toggleClass( 'th-garage-empty', 0 === vehicles.length );
		} );

		// Garage add button.
		$( '.th-garage-add' ).each( function() {
			const button = $( this );
			let isLoading = false;

			button.on( 'th-garage-add.change', function( event, vehicleKey ) {
				button.data( 'vehicle-key', vehicleKey || '' );
				button.prop( 'disabled', ! vehicleKey );
			} );

			button.on( 'click', function( event ) {
				const vehicleKey = button.data( 'vehicle-key' );

				event.preventDefault();

				if ( ! vehicleKey || isLoading ) {
					return;
				}

				button.toggleClass( button.data( 'loading-class' ), isLoading = true );

				$.post( vars.ajaxUrl, {
					action: 'yadakstorage_sputnik_garage_add',
					nonce: vars.nonceAdd,
					data: {
						vehicle_key: vehicleKey,
					},
				}, function( response ) {
					button.toggleClass( button.data( 'loading-class' ), isLoading = false );

					if ( response.success ) {
						handleGarageResponse( response );
					}
				} );
			} );
		} );

		// Vehicle form.
		$( '.th-vehicle-form' ).each( function() {
			const form = $( this );
			let vehicleFromSelect = null;
			let vehicleFromVin = null;

			const updateState = function() {
				form.trigger( 'th-vehicle-form.change', vehicleFromVin || vehicleFromSelect );
			};

			form.find( '.th-vehicle-select' ).on( 'th-vehicle-select.change', function( event, vehicle ) {
				vehicleFromSelect = vehicle;

				updateState();
			} );

			form.find( '.th-vehicle-vin' ).on( 'th-vehicle-vin.change', function( event, vehicle ) {
				vehicleFromVin = vehicle;

				updateState();
			} );
		} );

		// Garage add form.
		$( '.th-garage-add-form' ).each( function() {
			const form = $( this );
			const control = form.find( '.th-vehicle-form' );
			const button = form.find( '.th-garage-add' );

			control.on( 'th-vehicle-form.change', function( event, vehicle ) {
				button.trigger( 'th-garage-add.change', vehicle && vehicle.instance_id );
			} );
		} );

		// Garage remove button.
		$( document ).on( 'click', '[data-th-garage-remove]', function() {
			const button = $( this );

			if ( true === button.data( 'th-is-loading' ) ) {
				return;
			}

			button.data( 'th-is-loading', true );
			button.addClass( button.data( 'th-loading-class' ) );

			$.post( vars.ajaxUrl, {
				action: 'yadakstorage_sputnik_garage_remove',
				nonce: vars.nonceRemove,
				data: {
					vehicle_key: button.data( 'th-vehicle-key' ),
					badges: getGlobalBadges().join( ',' ),
				},
			}, function( response ) {
				button.data( 'th-is-loading', false );
				button.removeClass( button.data( 'th-loading-class' ) );

				if ( response.success ) {
					handleGarageResponse( response );
					handleCompatibilityBadgesResponse( response );

					if ( response.data && response.data.set_current_vehicle_data ) {
						$( document ).trigger( 'th-garage-set-current', [ response.data.set_current_vehicle_data ] );
					}
				}
			} );
		} );

		// Vehicle select.
		$( '.th-vehicle-select' ).each( function() {
			const widget = $( this );
			const ajaxUrl = widget.data( 'ajax-url' );
			const nonce = widget.data( 'nonce' );
			const selects = widget.find( 'select' );

			if ( selects.selectWoo ) {
				selects.selectWoo( { width: '' } );
			} else {
				selects.select2( { width: '' } );
			}

			selects.on( 'change', function() {
				const control = $( this );
				const item = control.closest( '.th-vehicle-select__item' );
				const index = widget.find( '.th-vehicle-select__item' ).index( item );
				const value = control.val();
				const nextItem = widget.find( '.th-vehicle-select__item' ).slice( index + 1, index + 2 );
				const nextAllItems = widget.find( '.th-vehicle-select__item' ).slice( index + 1 );

				const data = {};

				widget.find( '.th-vehicle-select__item' ).slice( 0, index + 1 ).find( 'select' ).each( function() {
					data[ this.name ] = JSON.parse( this.value );
				} );

				if ( value !== 'null' ) {
					nextAllItems.addClass( 'th-vehicle-select__item--disabled' );
					nextAllItems.find( 'select' ).prop( 'disabled', true ).val( 'null' );
					nextItem.removeClass( 'th-vehicle-select__item--disabled' );
					nextItem.find( 'select' ).prop( 'disabled', false );
				} else {
					nextAllItems.addClass( 'th-vehicle-select__item--disabled' );
					nextAllItems.find( 'select' ).prop( 'disabled', true ).val( 'null' );
				}

				nextAllItems.find( 'select' ).trigger( 'change.select2' );

				if ( 'null' === value ) {
					widget.trigger( 'th-vehicle-select.change', null );
				} else if ( index + 1 === widget.find( '.th-vehicle-select__item' ).length ) {
					widget.trigger( 'th-vehicle-select.change', JSON.parse( item.find( 'select' ).val() ) );
				} else {
					widget.trigger( 'th-vehicle-select.change', null );
					nextItem.addClass( 'th-vehicle-select__item--loading' );

					$.post( ajaxUrl, {
						action: 'yadakstorage_sputnik_vehicle_select_load_data',
						nonce: nonce,
						data: {
							for: nextItem.find( 'select' ).prop( 'name' ),
							values: data,
						},
					}, function( response ) {
						if ( response.success ) {
							nextItem.find( 'select option:not([value="null"])' ).remove();

							response.data.forEach( function( optionData ) {
								const option = $( '<option></option>' );

								option.text( optionData.title );
								option.attr( 'value', JSON.stringify( optionData.value ) );

								nextItem.find( 'select' ).append( option );
							} );

							nextItem.removeClass( 'th-vehicle-select__item--loading' );
						}
					} );
				}
			} );
		} );

		// Vehicle VIN.
		$( '.th-vehicle-vin' ).each( function() {
			const control = $( this );
			const input = control.find( 'input' );
			const alert = control.find( '.th-vehicle-vin__alert' );
			const ajaxUrl = control.data( 'ajax-url' );
			const nonce = control.data( 'nonce' );

			let cancelPreviousRequest = function() {};
			let timeout = 0;

			input.on( 'input', function() {
				const value = this.value.trim();

				cancelPreviousRequest();
				clearTimeout( timeout );

				if ( ! value ) {
					control.removeClass( 'th-vehicle-vin--loading' );
					alert.html( '' );

					control.trigger( 'th-vehicle-vin.change', null );

					return;
				}

				control.addClass( 'th-vehicle-vin--loading' );

				timeout = setTimeout( function() {
					const xhr = $.post( ajaxUrl, {
						action: 'yadakstorage_sputnik_vehicle_vin_load_data',
						nonce: nonce,
						data: {
							vin: value,
						},
					}, function( response ) {
						control.removeClass( 'th-vehicle-vin--loading' );
						alert.html( '' );

						const alertElement = $( '<div class="th-alert th-alert--size--sm"></div>' );

						if ( response.success ) {
							alertElement.addClass( 'th-alert--style--primary' );
						} else {
							alertElement.addClass( 'th-alert--style--danger' );
						}

						alertElement.text( response.data.message );
						alert.append( alertElement );

						if ( response.success ) {
							control.trigger( 'th-vehicle-vin.change', response.data.vehicle );
						} else {
							control.trigger( 'th-vehicle-vin.change', null );
						}
					} );

					cancelPreviousRequest = function() {
						xhr.abort();
					};
				}, 500 );
			} );
		} );

		$( document ).on( 'change', '[data-th-current-vehicle]', function() {
			if ( this.checked ) {
				sputnik.garage.setCurrentVehicle( JSON.parse( $( this ).attr( 'data-th-current-vehicle' ) ) );
			}
		} );

		$( document ).on( 'th-garage-set-current', function( event, data ) {
			const search = $( '.th-search--location--mobile-header, .th-search--location--desktop-header' );

			$( '.th-search__input', search )
				.attr( 'placeholder', data.search_placeholder );
			$( '[name="' + vars.attributeFilterName + '"]', search )
				.prop( 'disabled', ! data.vehicle_key )
				.attr( 'value', data.attribute_filter_value );

			// Set the vehicle for the search suggestions.
			$( '.th-suggestions', search ).attr( 'data-taxonomy-value', data.attribute_filter_value );
		} );

		/*
		// vehicle picker modal
		*/
		function VehiclePickerModalRef( element ) {
			const self = this;

			self._eventHandlers = {};
			self.element = element;
		}

		VehiclePickerModalRef.prototype = {
			on: function( eventName, handler ) {
				if ( undefined === this._eventHandlers[ eventName ] ) {
					this._eventHandlers[ eventName ] = [];
				}

				if ( -1 === this._eventHandlers[ eventName ].indexOf( handler ) ) {
					this._eventHandlers[ eventName ].push( handler );
				}
			},
			off: function( eventName, handler ) {
				if ( undefined === this._eventHandlers[ eventName ] ) {
					this._eventHandlers[ eventName ] = [];
				}

				const index = this._eventHandlers[ eventName ].indexOf( handler );

				if ( -1 !== index ) {
					this._eventHandlers[ eventName ].splice( index, 1 );
				}
			},
			emit: function( eventName, data ) {
				if ( undefined === this._eventHandlers[ eventName ] ) {
					this._eventHandlers[ eventName ] = [];
				}

				this._eventHandlers[ eventName ].forEach( function( handler ) {
					handler.apply( this, [ data ] );
				} );
			},
		};

		function VehiclePickerModal() {
			const self = this;

			self.modal = $( '.th-vehicle-picker-modal' ).first().parents( '.th-modal' );

			self.modal.find( '.th-modal__close, .th-vehicle-picker-modal__close-button' ).on( 'click', function() {
				self.close();
			} );
			self.modal.find( '.th-modal__container' ).on( 'click', function( event ) {
				if ( $( event.target ).closest( '.th-modal__window' ).length === 0 ) {
					self.close();
				}
			} );
			self.modal.find( '.th-modal__window' ).on( 'transitionend', self.onTransitionEnd.bind( this ) );
			self.modal.find( '[data-to-panel]' ).on( 'click', function( event ) {
				event.preventDefault();

				self.switchTo( $( this ).data( 'to-panel' ) );
			} );
			self.modal.on( 'change', '[data-th-current-vehicle]', function( event ) {
				event.stopPropagation();
			} );
			// select
			self.modal.find( '.th-vehicle-picker-modal__select-button' ).on( 'click', function() {
				const checkedVehicle = JSON.parse( self.modal.find( '[data-th-current-vehicle]:checked' ).attr( 'data-th-current-vehicle' ) );

				// setCurrentVehicle( self.modal.find( '[data-th-current-vehicle]:checked' ) );

				self.ref.emit( 'select', checkedVehicle );
				self.close();
			} );

			$( document ).on( 'th-garage.update', function( event, vehicles ) {
				if ( 0 === vehicles.length ) {
					self.switchTo( 'form' );
				} else {
					self.switchTo( 'list' );
				}
			} );
		}

		VehiclePickerModal.prototype = {
			open: function( vehicleKey ) {
				const self = this;

				if ( 'hidden' !== $( document.body ).css( 'overflow' ) ) {
					const bodyWidth = $( document.body ).width();

					$( document.body ).css( 'overflow', 'hidden' );

					const scrollWidth = $( document.body ).width() - bodyWidth;

					$( document.body ).css( 'paddingRight', scrollWidth + 'px' );
				}

				self.modal.addClass( 'th-modal--display' );
				self.modal.width(); // force reflow.
				self.modal.addClass( 'th-modal--open' );

				if ( vehicleKey !== undefined ) {
					self.modal.find( '[name="th-header-vehicle"]' ).each( function( i, element ) {
						const data = JSON.parse( $( element ).attr( 'data-th-current-vehicle' ) );

						$( element ).prop( 'checked', data.vehicle_key.toString() === vehicleKey.toString() );
					} );
				}

				self.ref = new VehiclePickerModalRef( self.modal );

				return self.ref;
			},
			close: function() {
				const self = this;

				self.modal.removeClass( 'th-modal--open' );
			},
			/**
			 * @param {Event} event
			 */
			onTransitionEnd: function( event ) {
				const self = this;
				const modalWindow = self.modal.find( '.th-modal__window' );

				if (
					! self.modal.is( '.th-modal--open' ) &&
					'opacity' === event.originalEvent.propertyName &&
					modalWindow.is( event.target )
				) {
					self.modal.removeClass( 'th-modal--display' );

					$( document.body ).css( 'overflow', '' );
					$( document.body ).css( 'paddingRight', '' );

					if ( ! $( 'body' ).is( '.th-garage-empty' ) ) {
						self.switchTo( 'list' );
					}
				}
			},
			switchTo: function( toPanel ) {
				const self = this;
				const currentPanel = self.modal.find( '.th-vehicle-picker-modal__panel--active' );
				const nextPanel = self.modal.find( '[data-panel="' + toPanel + '"]' );

				currentPanel.removeClass( 'th-vehicle-picker-modal__panel--active' );
				nextPanel.addClass( 'th-vehicle-picker-modal__panel--active' );
			},
		};

		const vehiclePickerModal = new VehiclePickerModal();

		window.yadakStorageSputnik = window.yadakStorageSputnik || {};
		window.yadakStorageSputnik.vehiclePickerModal = vehiclePickerModal;

		/*
		// vehicle filter
		*/
		$( '.th-filter-vehicle' ).each( function() {
			const filter = $( this );

			filter.on( 'click', '.th-filter-vehicle__item-input', function( event ) {
				event.preventDefault();

				const params = new URLSearchParams( window.location.search );

				if ( ! this.checked ) {
					params.delete( vars.attributeFilterName );
					params.set( 'current_' + vars.attributeFilterName, this.value );
				} else {
					params.set( vars.attributeFilterName, this.value );
					params.delete( 'current_' + vars.attributeFilterName );
				}

				window.location.search = params.toString();
			} );

			filter.on( 'click', '.th-filter-vehicle__button .th-button', function() {
				const ref = vehiclePickerModal.open( filter.attr( 'data-th-current-vehicle-key' ) );

				ref.on( 'select', function( currentVehicleData ) {
					const params = new URLSearchParams( window.location.search );

					const attributeFilterValue = currentVehicleData.attribute_filter_value;
					const checked = filter.find( '.th-filter-vehicle__item-input' ).is( ':checked' );

					if ( ! attributeFilterValue ) {
						params.delete( vars.attributeFilterName );
						params.set( 'current_' + vars.attributeFilterName, attributeFilterValue );
					} else if ( ! checked ) {
						params.delete( vars.attributeFilterName );
						params.set( 'current_' + vars.attributeFilterName, attributeFilterValue );
					} else {
						params.set( vars.attributeFilterName, attributeFilterValue );
						params.delete( 'current_' + vars.attributeFilterName );
					}

					window.location.search = params.toString();
				} );
			} );
		} );
	} );
}( jQuery ) );
