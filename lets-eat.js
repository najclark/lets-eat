var currentOrg;
var currentInfoWindow;
Router.route('/:org?', function () {
  // render the Home template with a custom data context
  var params = this.params;
  currentOrg = params.org;
  console.log("currentOrg:" + currentOrg);
  this.render('main', {data: {title: 'Lets Eat'}});

});
Houston.menu({
  'type': 'template',
  'use': 'AddAccount',
  'title': 'New User'
});

if (Meteor.isClient) {
  navigator.geolocation.getCurrentPosition(function(position) {
    Session.set('lat', position.coords.latitude);
    Session.set('lon', position.coords.longitude);
  });

  currentLocations = new Mongo.Collection(null);

  Meteor.subscribe("markers");

  Template.map.onCreated(function() {
    GoogleMaps.ready('map', function(map) {
      markers = {};

      var myloc = new google.maps.Marker({
        clickable: false,
        icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
        new google.maps.Size(22,22),
        new google.maps.Point(0,18),
        new google.maps.Point(11,11)),
        shadow: null,
        zIndex: 999,
        map: GoogleMaps.get('map').instance,
        position: new google.maps.LatLng(Session.get('lat'), Session.get('lon'))
      });

      map.instance.addListener("idle", function() {
        currentLocations.remove({});
        Markers.find().forEach(function(location) {
          //console.log(location._id);
          //console.log(location.name);
          if(markers[location._id] && map.instance.getBounds().contains(markers[location._id].getPosition())) {
            currentLocations.insert({
              name: location.name,
              street: location.street,
              city: location.city,
              state: location.state,
              zipCode: location.zipCode,
              foods: location.foods,
              hours: location.hours,
              orgID: location.orgID,
              documents: location.documents,
              eligibility: location.eligibility,
              closures: location.closures
            });
          }
        });
      });
      Markers.find().forEach(function(location) {
        currentLocations.insert({
          name: location.name,
          street: location.street,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          foods: location.foods,
          hours: location.hours,
          orgID: location.orgID,
          documents: location.documents,
          eligibility: location.eligibility,
          closures: location.closures
        });
      });

      Markers.find().observe({
        added: function (document) {
          if(document.orgID===currentOrg||currentOrg===undefined){
            var geocoder = new google.maps.Geocoder();
            var address = document.street + ', ' + document.city + ', ' + document.state + ' ' + document.zipCode;
            //Meteor.call('Geocode', address, document.name, document.foods, document.hours);
            if(Markers.findOne(document._id).latitude == undefined){
              geocode(address, document.name, document.foods, document.hours, document._id);
            }
            else {
              var markerImg;
              if (document.orgID.toUpperCase()==="SDFB") {
                markerImg='/sdfb.png';
              }else if (document.orgID.toUpperCase()==="FASD") {
                markerImg='/fasd.png';
              }else{
                markerImg='/blankmarker.png';
              }

              var marker = new google.maps.Marker({
                draggable: false,
                animation: google.maps.Animation.DROP,
                position: new google.maps.LatLng(Markers.findOne(document._id).latitude, Markers.findOne(document._id).longitude),
                map: map.instance,
                id: document._id,
                icon: markerImg
              });
              var currentImg;
              if (document.orgID==="SDFB") {
                currentImg='<img src="/SDFB.Color.Logo.PNG.png" style="height:20%; width:20%;">';
              }else if (document.orgID==="FASD") {
                currentImg='<img src="/FASD.Logo.CMYK.jpg" style="height:30%; width:30%;">';
              }else{
                currentImg="";
              }

              var urlInfo;
              if (typeof document.webURL !== 'undefined') {
                urlInfo='<br><small><a href="'+document.webURL+'">'+name+'\'s Website</a></small>';
              }else{
                urlInfo='';
              }
              var contentString = currentImg +'<h2>' + document.name + '</h2><br><small>' + document.foods + '</small><br><small>' + document.hours + '</small>'+urlInfo;

              var infowindow = new google.maps.InfoWindow({
                content: contentString
              });

              marker.addListener('click', function() {
                if (typeof currentInfoWindow !== 'undefined') {
                  currentInfoWindow.close();
                }
                infowindow.open(map.instance, marker);
                currentInfoWindow=infowindow;
              });

              markers[document._id] = marker;
            }
          }
        },
        changed: function (newDocument, oldDocument) {
          markers[newDocument._id].setPosition({ lat: newDocument.lat, lng: newDocument.lng });
        },
        removed: function (oldDocument) {
          markers[oldDocument._id].setMap(null);
          google.maps.event.clearInstanceListeners(markers[oldDocument._id]);
          delete markers[oldDocument._id];
        }
      });
    });
  });

  Meteor.startup(function() {
    GoogleMaps.load();
  });
}
