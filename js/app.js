(function(){
  'use strict';

  // Declare functions
  let handleLocationError,
      fillAddress,
      normalizeAddress,
      getAddressFromLocation,
      initLocation,
      watchNumInputs,
      watchPaymentInputs,
      getButtonText;

  handleLocationError = (browserHasGeolocation, infoWindow, pos) => {
    console.log(browserHasGeolocation ?
                  'Error: The Geolocation service failed.' :
                  'Error: Your browser doesn\'t support geolocation.');
  }

  fillAddress = (address) => {
    // console.log(address);
    let addressFields = document.querySelectorAll('input[data-address]');
    const inputs = Array.from(addressFields);

    inputs.forEach(input => {
      // console.log('From Obj', address.hasOwnProperty(input.name));
      input.value = address.hasOwnProperty(input.name) ? address[input.name] : '';
    });
  }

  normalizeAddress = (results) => {
    // let fullAddress = results[0].address_components;
    let fullAddress = results[0].formatted_address;
    const addressArray = fullAddress.split(', ');

    let addressToFill = {
      'usr_street': addressArray[0].match(/(.+\w+)\D/g).join(' '),
      'usr_number': addressArray[0].match(/[\d]/g).join(''),
      'usr_neighborhood': addressArray[1],
      'usr_cp': addressArray[2].match(/[\d]/g).join(''),
      'usr_city': addressArray[2].match(/\D+(.+\w+)\D/g).join(' '),
      'usr_state': addressArray[4]
    }

    fillAddress(addressToFill);

    // console.log(addressToFill);
  }

  getAddressFromLocation = (latt, lngg, geocoder) => {
    let noteSpan = document.querySelector('.note');
    let latlng = {lat: parseFloat(latt), lng: parseFloat(lngg)};
    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === 'OK') {
        if (results.length >= 1) {
          normalizeAddress(results);
        } else {
          console.log('No results found');
        }
      } else {
        console.log('Geocoder failed due to: ' + status);
      }
    });
  }

  initLocation = () => {
    console.log('Init location');
    let noteSpan = document.querySelector('.note');
    let geocoder = new google.maps.Geocoder;
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      noteSpan.innerHTML = 'Estamos buscando tu dirección...';
      navigator.geolocation.getCurrentPosition(function(position) {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;

        getAddressFromLocation(lat, lng, geocoder);

        noteSpan.innerHTML = 'Por favor revisa que los datos sean correctos';

      }, function() {
        handleLocationError(true);
        noteSpan.innerHTML = 'Lamentablemente no pudimos obtener tu ubicación. Nos ayudas con tu datos por favor?';
      });
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false);
    }
  }

  function filterChars(e) {
    let allowedKeyCodes = [8, 9, 18, 37, 39, 91, 16];
    if(allowedKeyCodes.indexOf(e.keyCode) != -1) return;
    if(e.keyCode < 48 || e.keyCode > 57) e.preventDefault();
  }

  function hideCCs(ccType) {
    const icons = document.querySelectorAll('img.payment_icon');
    const icon = document.querySelector(`img[data-type="${ccType}"]`);
    icons.forEach(icon => icon.classList.add('opaque'));
    icon.classList.remove('opaque');
  }

  function toggleCCInput(type, elem) {
    console.log(elem);
    let ccContainer = document.querySelector('div.cc_payment_data');
    let ccInput = document.querySelector('input[name="payment_cc"]');
    let ccType = '';
    let ccTypes = {
          "visa": /^4/,
          "mastercard": /^5[1-5]/,
          "amex": /^3[47]/
    };

    if(type == 'cc') {
      ccContainer.classList.remove('no_show');
    } else {
      ccContainer.classList.add('no_show');
    }

    const icons = document.querySelectorAll('img.payment_icon');
    icons.forEach(icon => icon.classList.add('opaque'));

    function getCCType() {

        let ccNumber = ccInput.value;

        for(let cc in ccTypes){
            if(ccTypes[cc].test(ccNumber)){
              ccType = ccTypes[cc];
              hideCCs(cc);
            }
        }
    }

    ccInput.addEventListener('keyup',getCCType);
  }

  function switchText(newText) {
    let payButton = document.querySelector('input[name="pay_with_method"]');

    payButton.value = newText;
  }

  getButtonText = (e) => {
    const paymentType = e.target.attributes['data-payment'].value;

    let buttonText = '';
    switch(paymentType) {
      case 'cc':
        buttonText = 'Pagar ahora con tu tarjeta';
        break;
      case 'paypal':
        buttonText = 'Presiona para ingresar tus datos de PayPal';
        break;
      case 'oxxo':
        buttonText = 'Presiona para imprimir tu orden de pago';
        break;
      default:
        buttonText = 'Pagar ahora';
    }
    toggleCCInput(paymentType, e.target);
    switchText(buttonText);
  }

  watchNumInputs = () => {
     const inputNumbers = Array.from(document.querySelectorAll('input[data-key="number"]'));
     inputNumbers.forEach(input => input.addEventListener('keydown', filterChars))
  }

  watchPaymentInputs = () => {
    const radioPayments = Array.from(document.querySelectorAll('input[data-payment]'));
    radioPayments.forEach(radio => radio.addEventListener('click', getButtonText));
  }

  function watchInputs() {
    watchNumInputs();
    watchPaymentInputs();
  }

  function checkPaymentForm(e) {
    e.preventDefault();
    let paymentInputs = document.querySelectorAll('.cc_payment_data input');
    let paymentSelects = document.querySelectorAll('.cc_payment_data select');
    let paymentData = [];
    let ccData = {
      'payment_cc': '',
      'payment_sc': '',
      'payment_name': '',
      'payment_month': '',
      'payment_year': '',
      'payment_type': '',
    }

    paymentInputs.forEach(input => {
      paymentData.push(input);
    });

    paymentSelects.forEach(select => {
      paymentData.push(select);
    });

    paymentData.forEach(field => {
      if(field.value == '' || field.value == 'MM' || field.value == 'YY') {
        field.classList.add('missing-data');
      } else {
        if(ccData.hasOwnProperty(field.name)) {
          ccData[field.name] = field.value;
        }
      }
    });

    console.log('ccData', ccData);
  }

  document.querySelector('input[type=button]').addEventListener('click', checkPaymentForm);

  watchInputs();

  google.maps.event.addDomListener(window, 'load', initLocation);

})();
