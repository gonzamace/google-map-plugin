//$.getScript("https://www.gavondet.com.ar/cv/proxy.php?filename=/gmaceira/SP-Plugins/sppGoogleMap/spGoogleMap.js" );
var spGoogleMap = {

  defaults: {
    content : undefined,
    mapApiKey: 'AIzaSyAEtLcFhV6K92LLKPC8IeK4MyX6XnvdswQ',
    latitude: 61.21744,
    longitude: -73.977482,
    sheetId: undefined,
    sheetPage: 1,
    
    size: 14,
    
    infoWindow: true,
    infoWindowTitle: true,
    
    mouseover: false,
    click: true,

    addCustomEvents: true,
    mapElement: "[id*='mapPosition']",
    showOnInit: true,
    
    onInit: null,
    onJsonLoad: null,
    onResize: null,
    onNewMarker: null,
    onClickMarker: null,
    onComplete: null,
    
    verbose: false
    
  },
  settings: {},
  state: {
    htmlMapCreated: false,
    JSONRecieved: false,
    closestStore: undefined,
    APIKeyRecieved: false,
    googleMap: undefined,
    markers: [],
    currentMapElm: undefined,
    mapShown: undefined,
    
  },

  setup: function(options) {
    
    var obj = this;

    if (typeof options === 'undefined') {
        if (typeof window.dynGeoConfig !== 'undefined') {
            options = window.dynGeoConfig;
        }
    }
    obj.settings = $.extend( true, obj.defaults, options );
  
    console.log('%c cGoogleMap initialized', 'background: #222; color: #bada55')
    
    obj.settings.latitude = ((mraid.getCustomData().ut_latitude !== undefined) ? mraid.getCustomData().ut_latitude : obj.settings.latitude);
    obj.settings.longitude = ((mraid.getCustomData().ut_longitude !== undefined) ? mraid.getCustomData().ut_longitude : obj.settings.longitude);
    
    if (obj.settings.addCustomEvents == true){
        ad.addCustomEvent("GOOGLEMAPS – INITIALIZED", 1);
        ad.addCustomEvent("GOOGLEMAPS – ZOOMED MAP", 1);
        ad.addCustomEvent("GOOGLEMAPS – MOVED MAP", 1);
        ad.addCustomEvent("GOOGLEMAPS – SELECTED MAP MARKER", 1);
    }
    
    obj.getJSONGeoData()
    // Eventos            
    $(document).on('adResize adSceneChange adStateChange', function(e){
        if (typeof obj.settings.onResize === 'function') obj.settings.onResize.call(this)
        obj.refresh();
    });
    
  },
  
  getJSONGeoData: function(){
    var obj = this;
    
    var options = {
        cache: false,
        url: 'https://spreadsheets.google.com/feeds/cells/'+obj.settings.sheetId+'/'+obj.settings.sheetPage+'/public/full?alt=json',
        dataType: "json"
    }

    if (obj.settings.sheetId !== undefined){
    
      $.ajax(options)
        .done(function(data){
          
      var entry = data.feed.entry;
          
          if (entry.length < 7){
            console.log('%c JSONGeoData has no data', 'background: #CE3439; color: #fff')
            return false;
          } else {
            console.log('%c JSONGeoData recieved', 'background: #222; color: #bada55')
          }
                      
          var _JSONGeoData = []; 

          obj.state.JSONRecieved = true;

          for (var i = 6; i < entry.length; i += 6){

              var _lat = entry[i+4].content.$t.replace(',','.'),
                  _long = entry[i+5].content.$t.replace(',','.');

              _JSONGeoData.push({
                   geometry: {
                       coordinates:  [ parseFloat(_long),parseFloat(_lat) ]
                    },
                    properties: {
                        name: entry[i].content.$t,
                        address: entry[i+1].content.$t,
                        state: entry[i+2].content.$t,
                        zip: entry[i+3].content.$t,
                        country: "USA"
                    }
              })
          }
      //console.log(_JSONGeoData)
          obj.settings.content = _JSONGeoData;
          //console.log(obj.settings.content)
          obj.init()

        })
        .fail(function(err){
          console.log('%c JSONGeoData call fail', 'background: #CE3439; color: #fff', err)
          return false;
        })
        .always(function(){
          //do something
        }); 
      } else {
        console.log('%c You must provide googleSheet ID', 'background: #ffbf00; color: #fff')
      }

  },
   
  init: function() {
    var obj = this;
    
    if (obj.settings.content && obj.settings.content !== undefined){
        //console.log(obj.settings.content && obj.settings.content !== undefined)
        obj.setContent(obj.settings.content);
    } else {
        console.log('No GeoData founded in ad');
        return false
    }  
    
    if (typeof obj.settings.onInit === 'function') obj.settings.onInit.call(obj)
  
  },

  setContent: function(data){
    var obj = this; 
    
    if(data == undefined || data == null ) {console.log('No GeoData content given');return false;}
    
    obj.settings.content = data; 
    
    obj.getClosestStore()

  },
  
  getClosestStore: function(){
    var obj = this;
    
    var userLatitude = obj.settings.latitude,
        userLongitude = obj.settings.longitude,
        shortestDistance = Number.POSITIVE_INFINITY,
        indexTarget,
        distance = function(lat1, lon1, lat2, lon2) {
            var p = 0.017453292519943295, // Math.PI / 180
              c = Math.cos,
              a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
            return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        };
    
      if (obj.settings.verbose) console.log('Agent Location:', userLongitude,userLatitude)

      for (var i = 0; i < obj.settings.content.length; i++) {

          var currentDistance = distance(userLatitude, userLongitude, obj.settings.content[i].geometry.coordinates[1], obj.settings.content[i].geometry.coordinates[0]);
        
          obj.settings.content[i].geometry.currentDistance_miles = parseFloat((currentDistance /  1.609344).toFixed(2)); //in miles
          obj.settings.content[i].geometry.currentDistance_km = parseFloat(currentDistance.toFixed(2)); //in KM

          if (currentDistance < shortestDistance) {
        
              shortestDistance = currentDistance;

              indexTarget = i;

          }
      }

      //ordenamos content segun locacion mas cercana
      obj.settings.content.sort( obj._compare );

      obj.state.closestStore = obj.settings.content[0];

      if (obj.settings.verbose) console.log('Closest store found:',obj.state.closestStore)

      if (typeof obj.settings.onJsonLoad === 'function') obj.settings.onJsonLoad.call(this, obj)

    },
  
    _compare: function ( a, b ) {
      if ( a.geometry.currentDistance_miles < b.geometry.currentDistance_miles ){
        return -1;
      }
      if ( a.geometry.currentDistance_miles > b.geometry.currentDistance_miles ){
        return 1;
      }
      return 0;
    },
    
    initMap: function(){
      var obj = this;
      
      obj.createHTML()
      
      obj.getGoogleMapAPI()
    },

    createHTML: function(){
      var obj = this;
    
      if(!obj.state.htmlMapCreated){
        $('body').append('<div id="mapAreaContainer">'+
                      '<div id="mapArea"></div>'+
                      '<div id="infoWindow">'+
                          (obj.settings.infoWindowTitle ? '<div id="iw-line1" class="iw-line"></div>' : '')+
                          '<div id="iw-line2" class="iw-line"></div>'+
                          '<div id="iw-line3" class="iw-line"></div>'+
                          '<div id="iw-close">x</div>'+
                      '</div>'+
                      '<div id="zoomContainer">'+
                          '<div id="mapZoomPlus" class="zoomBox">'+
                              '<div class="zoomButton zoomPlus">+</div>'+
                          '</div>'+
                          '<div id="mapZoomMinus" class="zoomBox">'+
                              '<div class="zoomButton zoomMinus">-</div>'+
                          '<div>'+
                      '</div>'+
                  '</div>');

        obj.state.htmlMapCreated = true;

        if (obj.settings.verbose) console.log('>>HTML map created')

      }
      
      $('#iw-close').on('click tap', function(e) {
        obj.hideInfoWindow();
      });
      
    },
  
    getGoogleMapAPI: function(){
      var obj = this;

      if (!obj.state.APIKeyRecieved && obj.state.htmlMapCreated) {

        setTimeout(function(){
          var _elm = obj.getMapElement()
          _elm.append('<div id="wait_api">wait...</div>');
        },1000)


        $.getScript("https://maps.googleapis.com/maps/api/js?key="+obj.settings.mapApiKey)
          .done(function(){
          
            $('#wait_api').hide();          
            console.log('%c Map API key recieved', 'background: #222; color: #bada55')

            obj.state.APIKeyRecieved = true;
            obj.createMarkers()

        }).fail(function(err){
          $('#wait_api').hide()
          console.log('%c Google Map API call fail', 'background: #CE3439; color: #fff', err)
          return false;
        }); 
      } else {
          obj.createMarkers()
      }

    },

    createMarkers: function(){
      var obj = this;

      obj.deleteMarkers()
      
      //Posicion default del mapa, ubicacion más cercana al user agent
      var _lat = obj.state.closestStore.geometry.coordinates[1],
          _lng = obj.state.closestStore.geometry.coordinates[0],
          latLng = new google.maps.LatLng(_lat, _lng);
      
      var mapOptions = {
      center: latLng,
          zoom: 15,
          disableDefaultUI: true,
      };
      
      var map = new google.maps.Map($('#mapArea').get(0), mapOptions);
      
      obj.settings.googleMap = map;
      
      for (var i = 0; i < obj.settings.content.length; i++){

          var markerLat = obj.settings.content[i].geometry.coordinates[1],
              markerLng = obj.settings.content[i].geometry.coordinates[0],
              parameters = {
                position: new google.maps.LatLng(markerLat, markerLng),
                map: map,
                id: i
              };

          if (typeof obj.settings.onNewMarker === 'function') parameters = obj.settings.onNewMarker.call(obj, parameters);

          var marker = new google.maps.Marker(parameters);

          obj.state.markers.push(marker);

          if (obj.settings.click) {
              marker.addListener('click', function() { //google map doesnt support TAP listener

                  var props = obj.settings.content[this.id].properties;

                  obj.changeAddress(props);

                  obj.fireCustomEvent("GOOGLEMAPS – SELECTED MAP MARKER", true)

                  var center = new google.maps.LatLng(obj.settings.content[this.id].geometry.coordinates[1], obj.settings.content[this.id].geometry.coordinates[0]);

                  map.panTo(center);

                  if (obj.settings.infoWindow) obj.showInfoWindow(marker);

              });    
          }


          if (obj.settings.mouseover) {
              marker.addListener('mouseover', function() {
                  var props = obj.settings.content[this.id].properties;

                  obj.changeAddress(props);

                  obj.fireCustomEvent("GOOGLEMAPS – SELECTED MAP MARKER", true)

                  var center = new google.maps.LatLng(obj.settings.content[this.id].geometry.coordinates[1], obj.settings.content[this.id].geometry.coordinates[0]);

                  map.panTo(center);

                  if (obj.settings.infoWindow) obj.showInfoWindow(marker);
              });                        
          }

      }

      obj.changeAddress(obj.state.closestStore.properties);

      obj.fireCustomEvent("GOOGLEMAPS – INITIALIZED", true)
      ad.addCustomEvent("GOOGLEMAPS – SEARCHED FOR LOCATION: "+obj.state.closestStore.properties.address, 1);
      obj.fireCustomEvent("GOOGLEMAPS – SEARCHED FOR LOCATION: "+obj.state.closestStore.properties.address, true); // true will count as an interaction

      obj.refresh()

      map.addListener('dragstart', function() {
        obj.hideInfoWindow();
        obj.fireCustomEvent("GOOGLEMAPS – MOVED MAP", true)
      });
      map.addListener('zoom_changed', function(e) {
    obj.fireCustomEvent("GOOGLEMAPS – ZOOMED MAP", true)
      });
      
      $('[id^="mapZoomPlus"]').on('click tap', function(e) {
    map.setZoom(map.getZoom() + 1);
      });

      $('[id^="mapZoomMinus"]').on('click tap', function(e) {
    map.setZoom(map.getZoom() - 1);
      });
      
      if (typeof obj.settings.onComplete === 'function') obj.settings.onComplete.call(this, obj)

    },

    deleteMarkers: function() {
      var obj = this;
      if (obj.state.markers.length){
          for (var i = 0; i < obj.state.markers.length; i++) {
          obj.state.markers[i].setMap(null);
          }
          obj.state.markers = [];
      }

    },
    
    refresh: function(){
        var obj = this,
            elm = obj.getMapElement();
        
        if (elm.length > 0 && obj.state.htmlMapCreated && obj.state.APIKeyRecieved) {
            var rect = elm.get(0).getBoundingClientRect();

            $('#mapAreaContainer').css({
              'width': (parseInt(rect.width) +2) +'px',
              'height': (parseInt(rect.height) +2)+'px',
              'top': rect.top -1,
              'left': rect.left -1
            });
            $('#mapArea').css({
                'width': (parseInt(rect.width) +2) +'px',
                'height': (parseInt(rect.height) +2)+'px'
            });
          
            obj.hideInfoWindow();
            obj.toggleMapStatus();
        }
        
        if (elm.length > 0 && obj.settings.verbose && obj.state.APIKeyRecieved) {
            console.log('map adjusted to:', elm.attr('id'), elm) 
        }
    },
  
    showInfoWindow: function () {
        var obj = this;
        
        obj.setFontSize();
       
        $('#infoWindow').css({
          'visibility':'visible',
          'opacity':1
        }) 

        var _w = (parseInt($('#mapArea').css('width')) / 2.2) - (parseInt($('#mapArea').css('width')) / 100),
            _t = (parseInt($('#mapArea').css('height')) - parseInt( $('#infoWindow').css('height') ) ) / 2,
            _l = parseInt($('#mapArea').css('width')) / 100;
      
        $('#infoWindow').css({
            'top': _t,
            'width': _w,
            'left': _l
        })
    },
  
    hideInfoWindow: function(){
        var obj = this;
        obj.resetInfoWindowStyle()
        $('#infoWindow').css('visibility','hidden')
    },
  
    resetInfoWindowStyle: function(){
        $('#infoWindow').css({
            'width': (parseInt($('#mapArea').css('width')) / 2.2) - (parseInt($('#mapArea').css('width')) / 100),
            'top': 0,
            'left': 0,
        })
    },

    changeAddress: function(props){
    var obj = this,
          _content = {
              name: props.name,
              address: props.address,
              state: props.state,
              zip: props.zip
            };
        
        if (typeof spGoogleMap.settings.onClickMarker === 'function') _content = spGoogleMap.settings.onClickMarker.call(obj, _content)
        
        if (_content.name !== undefined ) $("div[id^=iw-line1]").html(_content.name);
        if (_content.address !== undefined ) $("div[id^=iw-line2]").html(_content.address);
        if (_content.state !== undefined && _content.zip !== undefined) $("div[id^=iw-line3]").html(_content.state+', '+_content.zip);

    },
    
    hide: function(){
        var obj = this;
        $('#mapAreaContainer').sppAnimationHide();
        obj.state.mapShown = false;
        if (obj.settings.verbose) console.log('map hide in creative')
    },
    show: function(){
        var obj = this;
        $('#mapAreaContainer').sppAnimationShow()
        obj.state.mapShown = true;
        if (obj.settings.verbose) console.log('map show in creative')
    },
    getMapElement: function(){
        var obj = this;
        return obj.state.currentMapElm = $(obj.settings.mapElement, ad.getVisibleSection())
    },
    toggleMapStatus: function(){
        var obj = this;
        if (obj.state.mapShown === undefined || obj.state.mapShown){
            obj.show()
        } else {
            obj.hide()
        }
        
    },
    setFontSize: function() {
      $('#infoWindow').fitText(1)
    },
    fireCustomEvent: function(event, bool){
        var obj = this;
        ad.customEvent(event, bool); // true will count as an interaction        
    }

};

!function(t){t.fn.fitText=function(n,i){var e=n||1,o=t.extend({minFontSize:Number.NEGATIVE_INFINITY,maxFontSize:Number.POSITIVE_INFINITY},i);return this.each(function(){var n=t(this),i=function(){n.css("font-size",Math.max(Math.min(n.width()/(10*e),parseFloat(o.maxFontSize)),parseFloat(o.minFontSize)))};i(),t(window).on("resize.fittext orientationchange.fittext",i)})}}(jQuery);
jQuery.fn.extend({sppAnimationInit:function(){$("<style type='text/css'> .sppAnimation-invisible {visibility: hidden !important; display: none;} </style>").appendTo("head")},sppAnimationHide:function(){return this.each(function(){$(this).addClass("sppAnimation-invisible")})},sppAnimationShow:function(){return this.each(function(){$(this).removeClass("sppAnimation-invisible")})},sppIsVisible:function(){return!$(this).hasClass("sppAnimation-invisible")}});


$(document).on('adReady', function () {
  
  $(document).sppAnimationInit();

    if (window.dynGeoConfig === undefined && !window.hasOwnProperty('dynGeoConfig')) {
      spGoogleMap.setup()
    } else {
      spGoogleMap.setup(dynGeoConfig)
    }

});
