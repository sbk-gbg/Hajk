/**
 * Created by hiwe001 on 2017-07-04.
 */
/**
 * Created by hiwe001 on 2017-05-24.
 */
// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

var ToolModel = require('tools/tool');

/**
 * @typedef {Object} LocationModel~LocationModelProperties
 * @property {string} type - Default: search
 * @property {string} panel - Default: searchpanel
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-search icon
 * @property {string} title - Default: Sök i kartan
 * @property {string} visible - Default: false
 */
var RoutingModelProperties = {
  type: 'routing',
  panel: 'routingpanel',
  toolbar: 'bottom',
  icon: 'fa fa-level-up icon',
  title: 'Navigation',
  visible: false,
  Id: 'LocationB',
  state: 'choose_start', // will change to choose_end and choose_mode
  apiKey: "AIzaSyCb-bvLmybNb4QSERR43eGlvvQyUrBAQG4",
  onStartKey: undefined,
  onEndKey: undefined,
  onRoutingKey: undefined,
  routingFinished: undefined,
  position: {
    latitude: undefined,
    longitude: undefined,
    latitudeEnd: undefined,
    longitudeEnd: undefined
  }
};

/**
 * Prototype for creating a search model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {LocationModel~LocationModelProperties} options - Default options
 */
startPoint = undefined;

var RoutingModel = {

  defaults: RoutingModelProperties,
  /**
   * @instance
   * @property {RoutingModel~RoutingModelProperties} defaults - Default settings
   */


  /* Starting Point */
  /* Get a current position from GPS(button right top)*/
  turnOnGPSClicked: function() {


    if (positioning == undefined || !positioning) {
      this.getLocation();
    } else{
      this.set({
        position:{
          latitude: latitude,
          longitude: longitude
        }
      });
      this.setPosition();
    }

  },

  getLocation: function(){
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(this.setPositionEvent.bind(this));
      positioning = true;
    }else{
      alert("kan inte få position. Skriv startposition i rutan eller tryck position på kartan.");
      positioning = false;
    }

  },


  positionError: function(error){
    /* reset this location setting */
    this.set({
      position: {
        latitude: undefined,
        longitude: undefined
      }
    });
    positioning = undefined;
  },

  /* Choose a starting location on the map manually. and drop a pin */
  startPointSelection: function(event){
    console.log('Running startPointSelection');
    var startPoint = new ol.Feature(); /* startPoint and point(below) must be the same l.134*/
    startPoint.setGeometry(new ol.geom.Point(event.coordinate));
  /* Convert Geometry to Coordinate */

    //var test = ol.proj.transform(startPoint.getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    //console.log(test);
    //var lonlat = startPoint.getGeometry().getCoordinates();
    var lonlat = ol.proj.transform(startPoint.getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    console.log(lonlat);
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.get('layer_start').getSource().clear();
    this.get('layer_start').getSource().addFeature(startPoint);

    var pos = this.get('position');
    pos.latitude = lat;
    pos.longitude = lon;
    this.set('position', pos);
    console.log('position is now, ' + this.get('position'));
   },


  endPointSelection: function(event){
    console.log('Running endPointSelection');
    var endPoint = new ol.Feature();
    endPoint.setGeometry(new ol.geom.Point(event.coordinate));

    var lonlat = ol.proj.transform(endPoint.getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.get('layer_end').getSource().clear();
    this.get('layer_end').getSource().addFeature(endPoint);

    var pos = this.get('position');
    pos.latitudeEnd = lat;
    pos.longitudeEnd = lon;
    this.set('position', pos);
  },


  activateStartMode: function(){
    console.log('activating start mode');
    this.set('state', 'choose_start');
    if(this.get('onEndKey') !== undefined) {
      ol.Observable.unByKey(this.get('onEndKey'));
      this.set('onEndKey', undefined);
    }
    if(this.get('onRoutingKey') !== undefined) {
      ol.Observable.unByKey(this.get('onRoutingKey'));
      this.set('onRoutingKey', undefined);
    }
    if(this.get('onStartKey') === undefined) {
      this.set('onStartKey', this.get('map').on('singleclick', this.startPointSelection.bind(this)));
    }
  },

  activateEndMode: function(){
    console.log('activating end mode');
    this.set('state', 'choose_end');
    if(this.get('onStartKey') !== undefined) {
      ol.Observable.unByKey(this.get('onStartKey'));
      this.set('onStartKey', undefined);
    }
    if(this.get('onRoutingKey') !== undefined) {
      ol.Observable.unByKey(this.get('onRoutingKey'));
      this.set('onRoutingKey', undefined);
    }
    if(this.get('onEndKey') === undefined) {
      this.set('onEndKey', this.get('map').on('singleclick', this.endPointSelection.bind(this)));
    }
    if(this.get('onEndKey') !== undefined && this.get('routingFinished')) {
      this.set('onEndKey', this.get('map').on('singleclick', this.endPointSelection.bind(this)));
      // TODO modify if and clear route
      this.set('routeFinished', false);
    }

  },

  activateTravelMode: function(){
    this.set('state', 'choose_mode');
  },

  activateRoutingMode: function(){
    console.log('activating routing mode');
    this.set('state', 'show_route');
    if(this.get('onStartKey') !== undefined) {
      ol.Observable.unByKey(this.get('onStartKey'));
      this.set('onStartKey', undefined);
    }
    if(this.get('onEndKey') !== undefined) {
      ol.Observable.unByKey(this.get('onEndKey'));
      this.set('onEndKey', undefined);
    }

    if(this.get('onRoutingKey') === undefined) {
      this.set('onRoutingKey', this.get('map').on('singleclick', this.showRoutingInfoPopup.bind(this)));
    }
    this.searchTrip();
  },


  // Executed once when the panel is loaded
  initStartPoint: function() {
    var style_start = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: .8,
        src: 'assets/icons/flagpin_start.png',
        scale: (1)
      })
    });

    var style_end = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: .8,
        src: 'assets/icons/flagpin_end.png',
        scale: (1)
      })
    });

    var style_route = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: .8,
        src: 'assets/icons/routeguide.png',
        scale: (1)
      })
    });

    var style_drawing = new ol.style.Style({
      stroke: new ol.style.Stroke({
        width: 4,
        color: [255, 0, 0, 0.8]
      })
    });

    var source_start = new ol.source.Vector({});
    var source_end = new ol.source.Vector({});
    var source_route = new ol.source.Vector({});
    var source_drawing = new ol.source.Vector({});

    if (this.get('layer_start') === undefined) {
      console.log('creating start layer');
      this.set("layer_start", new ol.layer.Vector({
        source: source_start,
        name: "routing",
        queryable: false,
        style: style_start
      }));

      this.set("layer_end", new ol.layer.Vector({
        source: source_end,
        name: "routing",
        queryable: false,
        style: style_end
      }));

      this.set("layer_route", new ol.layer.Vector({
        source: source_route,
        name: "routing",
        queryable: false,
        style: style_route
      }));

      this.set("layer_drawing", new ol.layer.Vector({
        source: source_drawing,
        name: "routing",
        queryable: false,
        style: style_drawing
      }));

      this.get('map').addLayer(this.get('layer_start'));
      this.get('map').addLayer(this.get('layer_end'));
      this.get('map').addLayer(this.get('layer_route'));
      this.get('map').addLayer(this.get('layer_drawing'));

      console.log('Starting to init popup');
      /*
      var closer = document.getElementById('popup-closer');
      var container = document.getElementById('popup');
      var content = document.getElementById('popup-content');

      console.log('Creating overlay');
      var overlay = new ol.Overlay( ({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      }));
      */

      this.set('overlay', overlay);

      closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };

      console.log('Adding to map');
      this.get('map').addOverlay(overlay);
    }
  },

  showRoutingInfoPopup: function(event){
    console.log('Running showRoutingInfoPopup');
    var overlay = this.get('map').getOverlayById('popup-0');
    this.get('map').forEachFeatureAtPixel(event.pixel, function (feature, layer) {
      console.log('Found feature and layer');
      console.log(feature);
      console.log(layer);
      console.log(layer.get('name'));

      if(layer.get('name') === 'routing'){
        console.log('Correct layer');

        var closer = document.getElementById('popup-closer');
        var container = document.getElementById('popup');
        var content = document.getElementById('popup-content');

        console.log('got elements');
        console.log(closer);
        console.log(container);
        console.log(content);

        var coordinate = event.coordinate;
        console.log('transforming');
        console.log(coordinate);
        var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
          coordinate, 'EPSG:3857', 'EPSG:4326'));
        console.log('transformed');
        content.innerHTML = '<p>You clicked here:</p><code>' + hdms +
          '</code>';
        console.log('setting position of overlay');
        console.log(overlay);
        overlay.setPosition(coordinate);
        console.log('finished');
      }
    })
  },

  setPositionEvent: function(event){
    console.log('setPositionEvent');
    this.set("position", event.coords);
    this.setPosition();
  },

  setPosition: function(){

    console.log('Clearing the source');

    this.get('layer_start').getSource().clear();
    if (this.get('position').longitude && this.get('position').latitude) {
      var point = new ol.geom.Point([
        this.get('position').longitude,
        this.get('position').latitude
      ]);
      var transformed = ol.proj.transform(point.getCoordinates(), "EPSG:4326", this.get('map').getView().getProjection());
      point.setCoordinates(transformed);
      this.get('layer_start').getSource().addFeature(
        new ol.Feature({
          geometry: point
        })
      );
      this.get('map').getView().setCenter(point.getCoordinates());
    }
  },

  configure: function (shell) {
    console.log('Running configure for routing');
    this.set('map', shell.getMap().getMap());
  },

  searchTrip: function(){
    console.log('running searchtrip');
    this.set({'state': undefined});
    var pos = this.get('position');
    if(pos.latitude === undefined || pos.longitude === undefined ||
  pos.latitudeEnd === undefined || pos.longitudeEnd === undefined){
      console.log(pos, pos.latitude + ',' + pos.longi<tude + ',' + pos.latitudeEnd + ',' + pos.longitudeEnd);
      alert('Välj start och slut');
    } else {
      ol.Observable.unByKey(this.get('onEndKey'));
      console.log('Will search for trip');
      var mode_select = document.getElementById('travel_mode_id');
      var mode = mode_select.options[mode_select.selectedIndex].value;
      console.log('mode is:' + mode);
      var url = 'https://karta2.varberg.se/maps/api/directions/json?mode=' + mode + '&origin=' + pos.latitude + ',' + pos.longitude + '&destination=' + pos.latitudeEnd + ',' + pos.longitudeEnd +'&key=' + this.get('apiKey');
      console.log('url is: ' + url);
    var request =$.ajax({
        url: url,
        type: "post",
        contentType: 'text/plain',
        xhrFields: {
          withCredentials: false
        },
        cache: false,
        success: (res) => { this.plotRoute(res, this.get('map'), this.get('layer_route'), this.get('layer_drawing'))},
        error: (err) => {
          alert("Det gick inte att navigera dig. Försök igen senare");
        },
    });
  }
  },

  plotRoute: function(res, map, layer, layer_drawing) {
    console.log(res);

    layer.getSource().clear();
    var steps = res.routes[0].legs[0].steps;
    for(var i = 0; i < steps.length; i++){
      var lat = steps[i].start_location.lat;
      var lng = steps[i].start_location.lng;

      var point = new ol.geom.Point([
        lng,
        lat
      ]);
      console.log('1 ' + lat + ', ' + lng);
      var transformed = ol.proj.transform(point.getCoordinates(), "EPSG:4326", "EPSG:3007");
      console.log('2');
      point.setCoordinates(transformed);
      console.log('3 ' + transformed);


      var tmpFeature = new ol.Feature({geometry: point});
      console.log('4');
      layer.getSource().addFeature(tmpFeature);
      console.log('5');
    }

    console.log('6');
    var routePath = new ol.format.Polyline({
    }).readGeometry(res.routes[0].overview_polyline.points);

    routePath = (new ol.format.Polyline({
    }).readGeometry(res.routes[0].overview_polyline.points, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3007'
    }));

    console.log('7');
    layer_drawing.getSource().clear();
    layer_drawing.getSource().addFeature(
      new ol.Feature({
        type: 'routing',
        geometry: routePath
      })
    );
    console.log('8');
    map.getView().fit(layer_drawing.getSource().getExtent(), map.getSize());
  },

  drawRoute: function(steps){

    var routePath = new ol.format.Polyline({
    }).readGeometry(steps);

    this.get('layer_drawing').getSource().addFeature(
      new ol.Feature({
        type: 'routing',
        geometry: routePath
      })
    );

    this.set('routingFinished', true);

  },

  getOptions: function () {
  },

  deleteLayers: function() {
    this.get('layer_start').getSource().clear();
    this.get('layer_end').getSource().clear();
    this.get('layer_route').getSource().clear();
    this.get('layer_drawing').getSource().clear();

    this.set({
      position:{
        latitude: undefined,
        longitude: undefined,
        latitudeEnd: undefined,
        longitudeEnd: undefined
      }
    });
  },

  removeLayer: function () {
    /*remove event listner from the map ne. the click event(map.un)*/


  },

  ConvertAddressToCoord: function(){
    /* need to create a box with suggestion */
    /* var searchStringStart = "<wfs:GetFeature\
     service = 'WFS'\
     version = '1.1.0'\
     xmlns:wfs = 'http://www.opengis.net/wfs'\
     xmlns:ogc = 'http://www.opengis.net/ogc'\
     xmlns:gml = 'http://www.opengis.net/gml'\
     xmlns:esri = 'http://www.esri.com'\
     xmlns:xsi = 'http://www.w3.org/2001/XMLSchema-instance'\
     xsi:schemaLocation='http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd'\
     outputFormat="GML2"\
     maxFeatures="1000">\
     <wfs:Query typeName='feature:fastighetsytor' srsName='EPSG:3007'>\
     <ogc:Filter>\
     \
     <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">\
     <ogc:PropertyName>text</ogc:PropertyName>\
     <ogc:Literal>";
     var searchStringEnd = "</ogc:Literal>\
     </ogc:PropertyIsLike>\
     </ogc:Filter>\
     </wfs:Query>\
     </wfs:GetFeature>";

     var value = ''; // TODO get value from box
     var forAjax = searchStringStart + value + '*' + searchStringEnd;
     */


  },



  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */

  onCloseTab: function() {
    this.get('layer_start').getSource().clear();
    this.get('layer_end').getSource().clear();
    this.get('layer_route').getSource().clear();
    this.get('layer_drawing').getSource().clear();

    this.set({
      position:{
        latitude: undefined,
        longitude: undefined,
        latitudeEnd: undefined,
        longitudeEnd: undefined
      }
    });
  },

  clicked: function () {
    this.set('visible', true);
    this.set('toggled', !this.get('toggled'));
  },
};

/**
 * Location model module.<br>
 * Use <code>require('models/information')</code> for instantiation.
 * @module LocationModel-module
 * @returns {LocationModel}
 */
module.exports = ToolModel.extend(RoutingModel);