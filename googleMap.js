dynGeoConfig = {

    key: '',
  
    latitude: 61.21744,
    longitude: -73.977482,
  
    sheetId: '',

    sheetPage: 1,
    
    verbose: true,
  
    onInit: function(){
        //do something
        mraid.cancelAutoClose();
    },
    onJsonLoad: function(obj){
        //do something
        $('[id^="findStore"]').on('click tap', function() {
            obj.initMap()
        });

    },
    onNewMarker: function(params){
        //do something returning objetc params
        return params;
    },
    onClickMarker: function(params){
        //do something returning objetc params
        return params;
    },
    onComplete: function(obj){
        //do something
        $('[id^="changeContent_land"]').on('click tap', function() {
            obj.setContent(dynGeoData2.features)
            obj.initMap()
        });
    },
    onResize: function(){
        //do something
    }
}
