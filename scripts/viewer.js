import { CustomOverviewMap } from './custom-overview-map.js';
import { GoogleLogoControl } from './google-logo-control.js';
import { MapBuilder } from './map-builder.js';


const Viewer = {
    map: null,
    mapBuilder: null,
    overlayLoaded: false,
    currentElement: "",
    initialized: false,

    config: {
        mapExtent: [3349242.4308104203, 7139355.065012198, 3404101.3990526465, 7162232.931680899],
        mapCenter: [3376671.9149315334, 7150793.9983465485],
        overlayExtent: [3366640.807100, 
                        7140502.859828, 
                        3387331.643460, 
                        7160217.381300],
        minZoom: 2,
        maxZoom: 18,
        initialZoom: 12
    },

    BASE_MAPS: {
        "google_hybrid": {
            url: '/.netlify/functions/getgooglemaptiles?lyrs=y&x={x}&y={y}&z={z}',
            attributions: '<a href="https://openlayers.org/">OpenLayers</a> | <a href="https://www.google.com/intl/en_us/help/terms_maps.html">Map data ©' + new Date().getFullYear()+ ' Google</a>'
        },
        "google_satellite": {
            url: '/.netlify/functions/getgooglemaptiles?lyrs=s&x={x}&y={y}&z={z}',
            attributions: '<a href="https://openlayers.org/">OpenLayers</a> | <a href="https://www.google.com/intl/en_us/help/terms_maps.html">Map data ©' + new Date().getFullYear()+ ' Google</a>'
        },
        "google_map": {
            url: '/.netlify/functions/getgooglemaptiles?lyrs=m&x={x}&y={y}&z={z}',
            attributions: '<a href="https://openlayers.org/">OpenLayers</a> | <a href="https://www.google.com/intl/en_us/help/terms_maps.html">Map data ©' + new Date().getFullYear()+ ' Google</a>'
        },
        "osm": {
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            attributions: '<a href="https://openlayers.org/">OpenLayers</a> | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    },
    
    init: function () {
        if (this.initialized) {
            console.log("Map already initialized. Skipping initialization.");
            return;
        }

        try {
            console.log("Initializing map...");

            // Dynamically Set Navbar Height property
            this.uiStyleUtils.setNavbarHeightVar();

            // Calculate the initial map extent ensuring that the overlay layer
            // occupies the area exactly between the navbar and footer. 
            this.uiStyleUtils.setMapContainerHeight();
            this.uiStyleUtils.setMapContainerTopVar();

            // Create the map and set up the extent for the map view to match 
            // the overlay layer extent that is stored in configuration.
            const mapBuilder = new MapBuilder('map', this.config.minZoom, this.config.maxZoom); // Pass the ID of your map container
            this.map = mapBuilder.getMap();
            this.mapBuilder = mapBuilder;
            this.map.updateSize(); // Update map size first
            this.mapUtils.setViewExtent(this.mapBuilder);

            // Add default base map layer to the map
            const defaultBaseMap = "google_hybrid";
            this.map.addLayer(this.mapUtils.getBaseLayer(defaultBaseMap));

            // Add the overlay layer with aerial photos
            const overlayLayer = this.mapUtils.getOverlayLayer();
            this.map.addLayer(overlayLayer);

            // Create the control for the Overview Map and add it to the map
            const overviewMapElement = document.getElementById('overview-map-control');
            const customOverviewMap = new CustomOverviewMap({
                element: overviewMapElement,
                collapsed: true
            });
            this.map.addControl(customOverviewMap);

            // Create the control for the Google logo and add it to the map
            const googleLogoControl = new GoogleLogoControl({});
            this.map.addControl(googleLogoControl);

            this.setupEventListeners();           

        } catch (error) {
            console.error("Error initializing map:", error);
        }
    },
    
    setupEventListeners: function () {
        // Event listener for About link
        document.getElementById('about-link').
            addEventListener('click', this.eventHandlers.handleOpenAboutCard); 

        // Event listener for Close button on the About card
        document.getElementById('close-card').
            addEventListener('click', this.eventHandlers.handleCloseAboutCard);
            
        // Event listener for window resize 
        window.addEventListener(
            'resize', 
            this.eventHandlers.handleWindowResize.bind(this)
        );
        
        // Event listener for Home button
        document.getElementById('home-control').
          addEventListener('click', this.eventHandlers.handleHomeClick);
        
        // Event listener for toggle Change Base Map options visibility.
        document.getElementById('layersToggle').addEventListener('click', function() {
            const options = document.getElementById('basemapOptions');
            options.style.display = options.style.display === 'none' ? 'block' : 'none';
        });
        
        // Event listener for all radio buttons inputs with the name "basemap".
        document.querySelectorAll('input[name="basemap"]').forEach(input => {
            input.addEventListener(
                'change', this.eventHandlers.handleBaseMapChange
            );
        });
        
        // Event listener for when the overlay layer is fully loaded
        const overlayLayer = this.map.getLayers().getArray().find(layer => 
            layer.get('title') === 'overlay'
        );
        overlayLayer.getSource().on(
            'tileloadend',
            this.eventHandlers.handleOverlayLayerLoaded.bind(this)
        );
        
        // Event listener for changes in the map's resolution (zoom level).
        this.map.getView().on(
            'change:resolution', 
            this.eventHandlers.handleMapResolutionChange.bind(this)
        );
        
        // Event listener for when the map stops moving.
        this.map.on(
            'moveend', 
            this.eventHandlers.handleMapResolutionChange.bind(this)
        );

        // Event listener for changes in the swipe input value.
        // Triggers the handleSwipeInput method to update the map overlay.
        const swipe = document.getElementById('swipe');
        swipe.addEventListener('input', this.eventHandlers.handleSwipeInput);

        // Event listeners for the overlay layer's pre-render 
        // and post-render events.
        if (overlayLayer) {
            // Handles any necessary setup before the overlay is rendered.
            overlayLayer.on(
                'prerender', 
                this.eventHandlers.handleOverlayPrerender.bind(this)
            );

            // Handles any necessary cleanup or additional processing 
            // after the overlay is rendered.
            overlayLayer.on(
                'postrender', 
                this.eventHandlers.handleOverlayPostrender.bind(this)
            );
        };

        // Add event listener for navbar collapse event.
        // This event occurs when the dimensions of the screen are changed 
        // or when the Toggle button is clicked.
        const navbarCollapse = document.getElementById('navbarCollapse');
        navbarCollapse.addEventListener('shown.bs.collapse', 
            this.eventHandlers.handleNavbarHeightChange.bind(this));
        navbarCollapse.addEventListener('hidden.bs.collapse', 
            this.eventHandlers.handleNavbarHeightChange.bind(this));

        
    },
    
    eventHandlers: {
        // Handle the event when the user opens the About card
        handleOpenAboutCard: function () {
            document.getElementById('about-card').
                classList.remove('d-none'); // Show card
        },
        
        // Handle the event when the user closes the About card
        handleCloseAboutCard: function () {
            document.getElementById('about-card').
                classList.add('d-none'); // Hide card
        },
        
        handleWindowResize: function () {           
            Viewer.map.updateSize();
            // Add a slight delay before adjusting swipe width and rendering
            setTimeout(() => {
                Viewer.uiStyleUtils.setNavbarHeightVar();
                Viewer.uiStyleUtils.setMapContainerHeight();
                Viewer.uiStyleUtils.setMapContainerTopVar();
                Viewer.mapUtils.setViewExtent(Viewer.mapBuilder);
                Viewer.adjustSwipeWidth();
            }, 100); 
        },
        
        // Handle the event when the user clicks "Home" button
        handleHomeClick: function() {
            Viewer.map.getView().setCenter(Viewer.config.mapCenter);
            Viewer.map.getView().setZoom(Viewer.config.initialZoom);

            // Return Swipe controle in the initial state
            const swipeControl = document.getElementById('swipe');
            swipeControl.value = 0;
        },
        
        // Handle the action when the user clicks "Changes Base Map" button
        handleBaseMapChange: function (evt) {
            const baseMapValue = evt.target.dataset.basemap;
            if (baseMapValue) {
                Viewer.mapUtils.removeLayerByName("base");
                const baseLayer = Viewer.mapUtils.getBaseLayer(baseMapValue, true);
                Viewer.map.addLayer(baseLayer);

                // Close the basemap options menu
                document.getElementById('basemapOptions').style.display = 'none';
                
                // Hide Google logo if not using a Google base map
                const isGoogleMap = baseMapValue.startsWith('google_');
                Viewer.mapUtils.toggleGoogleLogoVisibility(isGoogleMap);

            } else {
                console.warn('No base map value found');
            }           
        },
        
        // Handle the event when the overlay layer with aerial photos 
        // is fully loaded
        handleOverlayLayerLoaded: function () {
            if (!this.overlayLoaded) {
                this.overlayLoaded = true;
                
                this.adjustSwipeWidth();

                console.log("Map initialized successfully");

                this.initialized = true;
            }
        },
        
        // Handle the event when the base map change its resolution
        handleMapResolutionChange: function () {
            Viewer.adjustSwipeWidth();
            // Call OpenLayers method 
            // that triggers a manual re-rendering of the map
            Viewer.map.render();
        },

        handleSwipeInput: function () {
            // Call OpenLayers method 
            // that triggers a manual re-rendering of the map
            Viewer.map.render();
        },

        // Handles the prerender event for the overlay layer.
        // Creates a clipping mask to reveal a portion of the overlay based 
        // on the swipe slider control value and swipe slider control width  
        // taking into account that swipe control width changes dynamically.
        handleOverlayPrerender: function (event) {
            const ctx = event.context; // The rendering context for the map canvas
            const mapSize = this.map.getSize(); // Get map size (width and height)

            // Get current swipe slider value from 0 to 100
            const swipeValue = document.getElementById('swipe').value;

            if (!mapSize || !swipeValue) {
                console.warn("Map size or swipe value is not available.");
                return;
            }

            // Get the swipe slider container's width and left position
            const swipeContainer = document.getElementById('swipe-container');
            // Get width in pixels
            const swipeContainerWidth = parseFloat(swipeContainer.style.width);
            // Get position and dimensions
            const swipeContainerRect = swipeContainer.getBoundingClientRect();
            // Left position relative to viewport
            const swipeContainerLeft = swipeContainerRect.left;

            // Calculate clipping mask width based on swipe slider value
            const maskWidth = (swipeContainerWidth * (swipeValue / 100));

            // Calculate the pixel coordinates for the corners of the clipping area. 
            // The ol.render.getRenderPixel function converts map coordinates to 
            // pixel coordinates on the canvas.
            const topLeftPixel = ol.render.getRenderPixel(event, [
                maskWidth + swipeContainerLeft,
                0
            ]);

            const topRightPixel = ol.render.getRenderPixel(event, [
                swipeContainerWidth + swipeContainerLeft,
                0
            ]);

            const bottomLeftPixel = ol.render.getRenderPixel(event, [
                maskWidth + swipeContainerLeft,
                mapSize[1]
            ]);

            const bottomRightPixel = ol.render.getRenderPixel(event, [
                swipeContainerWidth + swipeContainerLeft,
                mapSize[1]
            ]);

            // Create a path on the canvas context that defines the area 
            // where the overlay should be visible.
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(topLeftPixel[0], topLeftPixel[1]);
            ctx.lineTo(bottomLeftPixel[0], bottomLeftPixel[1]);
            ctx.lineTo(bottomRightPixel[0], bottomRightPixel[1]);
            ctx.lineTo(topRightPixel[0], topRightPixel[1]);
            ctx.closePath();

            ctx.clip(); // Apply clipping path
        },

        handleOverlayPostrender: function (event) {
            const ctx = event.context;
            ctx.restore();
        },
        
        handleNavbarHeightChange: function () {
            this.uiStyleUtils.setNavbarHeightVar();
            this.uiStyleUtils.setMapContainerHeight();
            this.uiStyleUtils.setMapContainerTopVar();
            Viewer.mapUtils.setViewExtent(Viewer.mapBuilder);
            //this.uiStyleUtils.setAboutCardTop();
        },
        
    },
    
    /**
     * Adjusts the width and position of the swipe container based on the map
     * view and overlay extent. This function calculates the intersection 
     * between the current map view and the overlay layer, then updates 
     * the swipe container's dimensions and position accordingly.
     */
    adjustSwipeWidth: function (retryCount = 0) {
        const map = this.map;
        const view = map.getView();
        const mapSize = map.getSize();
    
        if (!mapSize || !view || !view.getCenter()) {
            if (retryCount < 5) {
                console.warn(`Map not fully initialized, retrying... (Attempt ${retryCount + 1})`);
                setTimeout(() => this.adjustSwipeWidth(retryCount + 1), 200);
            } else {
                console.warn("Failed to initialize map after multiple attempts");
            }
            return;
        }
    
        const extent = view.calculateExtent(mapSize);
        const overlayLayer = this.map.getLayers().getArray().find(layer => layer.get('title') === 'overlay');
    
        if (!overlayLayer) {
            console.warn("Overlay layer not found");
            return;
        }
    
        const overlayExtent = overlayLayer.getExtent();
        const intersection = ol.extent.getIntersection(extent, overlayExtent);
        /*
        if (ol.extent.isEmpty(intersection)) {
            if (retryCount < 5) {
                console.warn(`Overlay not ready, retrying... (Attempt ${retryCount + 1})`);
                setTimeout(() => this.adjustSwipeWidth(retryCount + 1), 200);
            } else {
                console.warn("Failed to adjust swipe after multiple attempts");
                document.getElementById('swipe-container').style.display = 'none';
            }
            return;
        }
        */
        document.getElementById('swipe-container').style.display = 'block';
    
        const leftEdgeCoord = [Math.max(intersection[0], extent[0]), (intersection[1] + intersection[3]) / 2];
        const rightEdgeCoord = [Math.min(intersection[2], extent[2]), (intersection[1] + intersection[3]) / 2];
    
        const leftEdgePixel = map.getPixelFromCoordinate(leftEdgeCoord);
        const rightEdgePixel = map.getPixelFromCoordinate(rightEdgeCoord);
    
        if (!leftEdgePixel || !rightEdgePixel) {
            console.warn("Invalid pixel coordinates. Retrying...");
            if (retryCount < 5) {
                setTimeout(() => this.adjustSwipeWidth(retryCount + 1), 200);
            }
            return;
        }

        const swipeContainer = document.getElementById('swipe-container');
        swipeContainer.style.left = `${leftEdgePixel[0]}px`;
        swipeContainer.style.width = `${rightEdgePixel[0] - leftEdgePixel[0]}px`;
    
        const swipeValue = document.getElementById('swipe').value;
        const thumbPosition = leftEdgePixel[0] + ((rightEdgePixel[0] - leftEdgePixel[0]) * (swipeValue / 100));
        document.getElementById('swipe').style.left = `${thumbPosition}px`;

    },
    
    mapUtils: {       
        getExtentWidth(extent) {
            return extent[2] - extent[0]; // maxX - minX
        },

        getExtentHeight(extent) {
            return extent[3] - extent[1]; // maxY - minY
        },

        calculateViewExtent() {
            const map = document.getElementById('map');
            const mapAspectRatio = map.offsetWidth / map.offsetHeight;
            const extentWidth = this.getExtentWidth(Viewer.config.overlayExtent);
            const extentHeight = this.getExtentHeight(Viewer.config.overlayExtent);
            const overlayAspectRatio = extentWidth / extentHeight;
            const center = ol.extent.getCenter(Viewer.config.overlayExtent);
            let width, height;
          
            if (mapAspectRatio > overlayAspectRatio) {
              // Map is wider than overlay
              height = extentHeight;
              width = height * mapAspectRatio;
            } else {
              // Map is taller than overlay
              width = extentWidth;
              height = width / mapAspectRatio;
            }
          
            return [
              center[0] - width / 2,
              center[1] - height / 2,
              center[0] + width / 2,
              center[1] + height / 2
            ];
        },
        
        setViewExtent(mapBuilder) {
            const viewExtent = Viewer.mapUtils.calculateViewExtent();
            mapBuilder.setExtent(viewExtent); // Set the extent for the map view
        },

        getBaseLayer: function (name, background = false) {
            const layerConfig = Viewer.BASE_MAPS[name] || Viewer.BASE_MAPS["osm"];

            return new ol.layer.Tile({
                name: "base",
                source: new ol.source.XYZ({
                  url: layerConfig.url,
                  attributions: layerConfig.attributions,
                  tileLoadFunction(imageTile, src) {
                      fetch(src).then(response => {
                          if (response.ok) {
                              return response.blob().then(blob => {
                                  const objectUrl = URL.createObjectURL(blob);
                                  imageTile.getImage().src = objectUrl;
                              });
                          } else {
                              console.error(
                                'Network response was not ok:', 
                                response.statusText);
                          }
                      }).catch(error => {
                          console.error('Fetch error:', error);
                      });
                  }
                }),
                zIndex: background ? -1 : 0
            });
        },

        getOverlayLayer: function () {
            return new ol.layer.Tile({
                title: 'overlay',
                extent: Viewer.config.overlayExtent,
                source: new ol.source.XYZ({
                    url: './tiles_2_18/{z}/{x}/{y}.png',
                    attributions: '',
                    minZoom: Viewer.config.minZoom,
                    maxZoom: Viewer.config.maxZoom,
                    //zoom: Viewer.config.initialZoom,    
                    tileSize: [256, 256],
                    tileLoadFunction(imageTile, src) {
                        fetch(src).then(response => {
                            if (response.ok) {
                                return response.blob().then(blob => {
                                    const objectUrl = URL.createObjectURL(blob);
                                    imageTile.getImage().src = objectUrl;
                                });
                            } else {
                                console.error(
                                    'Network response was not ok:', 
                                    response.statusText
                                );
                            }
                        }).catch(error => {
                            console.error('Fetch error:', error);
                        });
                    }
                })
            });
        },

        removeLayerByName: function (layerName) {
            Viewer.map.getLayers().getArray()
                .filter(layer => layer.get('name') === layerName)
                .forEach(layer => Viewer.map.removeLayer(layer));
        },

        toggleGoogleLogoVisibility: function(visible) {
            const googleLogoControl = Viewer.map.getControls().getArray().find(
                control => control instanceof GoogleLogoControl
            );

            if (googleLogoControl) {
              googleLogoControl.setVisible(visible);
            }
        }
    },
    
    uiStyleUtils: {

        setNavbarHeightVar: function () {
            // Get the height of the navbar
            const navbarHeight = document.querySelector('nav.navbar').offsetHeight;
            document.documentElement.style.setProperty('--navbar-height', navbarHeight + 'px');
        },

        setMapContainerHeight() {
            // Get navbar height
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            // Get footer height 
            const footerHeight = document.querySelector('.footer').offsetHeight; 
            // Get window height
            const windowHeight = window.innerHeight; 
            
            // Calculate new height for map
            const newHeight = windowHeight - navbarHeight - footerHeight;

            // Set new height to main element
            const main = document.querySelector('main'); 
            main.style.height = `${newHeight}px`; 
            
            // Set new height to map
            const map = document.getElementById('map');
            map.style.height = `${newHeight}px`;

            //this.map.updateSize(); // Force OpenLayers to recognize the new size
        },

        setMapContainerTopVar() {
            //const mainTop = document.querySelector('main').offsetTop; 
            
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            document.documentElement.style.setProperty('--main-top', navbarHeight + 'px');

            //const mapTop = document.getElementById('map').offsetTop; 
            document.documentElement.style.setProperty('--map-top', navbarHeight + 'px');
        },

        setAboutCardTop() {
            const navbarHeight = document.querySelector('.navbar').offsetHeight; // Get navbar height
            const aboutCard = document.getElementById('about-card');
        
            // Set top position of about card just below the navbar
            aboutCard.style.top = `${navbarHeight + 10}px`; // Adjust with a small margin if needed
        }

    }
};

// Export the Viewer object
export { Viewer };

// Export specific functions if needed
export function showPanel(id) {
    Viewer.uiStyleUtils.showPanel(id);
}

export function init() {
    //console.log("I am before init");
    Viewer.init();
}

// Set up window load event listener immediately
window.addEventListener('load', () => {
    Viewer.init(); 

});
