dynGeoConfig = {

    key: 'AIzaSyAEtLcFhV6K92LLKPC8IeK4MyX6XnvdswQ',
  
    //latitude: 61.21744,
    //longitude: -73.977482,
  
    sheetId: '17mlDB8LBvpaRWPI-f7OAcv4vM_O3qsUipvMB3w8SArU',

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
