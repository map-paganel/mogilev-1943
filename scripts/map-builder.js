export class MapBuilder {
    minZoom = 0;
    maxZoom = 0;
    
    constructor(targetElementId, minZoom, maxZoom) {
      this.minZoom = minZoom;
      this.maxZoom = maxZoom;

      this.map = new ol.Map({
        controls: ol.control.defaults.defaults({
          attribution: false  // Disable the default attribution control
      }).extend([
          new ol.control.Zoom(),
          new ol.control.Attribution({
              collapsible: false  // Make the attribution always visible
            })
      ]),  
        target: targetElementId,
        view: new ol.View({
            center: [0, 0], // Initial center
            zoom: 2, // Initial zoom level
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            enableRotation: false
        })
      });
  }

  getMap() {
      return this.map;
  }

  setExtent(extent) {
      
      // Create a new view and add it to the map
      const newView = new ol.View({
          center: ol.extent.getCenter(extent),
          zoom: this.map.getView().getZoom(),
          minZoom: this.minZoom,
          maxZoom: this.maxZoom,
          enableRotation: false,
          extent: extent
      });

      this.map.setView(newView);
      

  }

}

