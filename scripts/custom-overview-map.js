/**
 * CustomOverviewMap - A custom control for OpenLayers to display an overview 
 * map.
 * 
 * This class extends ol.control.Control to create a customizable overview map
 * that can be collapsed and expanded. It displays a static image as the 
 * overview map.
 *
 * @class
 * @extends ol.control.Control
 * 
 * @param {Object} options - The options for the CustomOverviewMap.
 * @param {string} options.imageSrc - The source URL of the image to be used as
 *                                    the overview map.
 * @param {number[]} [options.size=[150, 150]] - The size of the overview map 
 *                                               container [width, height] in 
 *                                               pixels.
 * @param {boolean} [options.collapsed=true] - Whether the overview map should 
 *                                             be initially collapsed.
 * @param {string|Element} [options.target] - Specify a target if you want the 
 *                                            control to be rendered outside of
 *                                            the map's viewport.
 *
 * @property {boolean} collapsed - The current collapsed state of the overview 
 *                                 map.
 * @property {HTMLElement} overviewContainer - The container element for the 
 *                                             overview map image.
 * @property {HTMLImageElement} image - The image element used for the overview
 *                                      map.
 */
export class CustomOverviewMap extends ol.control.Control {
  constructor(options) {
      const element = document.getElementById('overview-map-control');
      super({ element });

      this.button = element.querySelector('.ol-overview-map-button');
      this.overviewMapDiv = element.querySelector('.ol-overview-map');
      this.imageSrc = options.imageSrc;

      // Access the existing image element directly from the HTML
      // Assuming there's an <img> tag inside .ol-overview-map
      this.img = this.overviewMapDiv.querySelector('img'); 

      // Set initial state based on collapsed option
      const isCollapsed = options.collapsed !== undefined ? options.collapsed : true;
      this.setCollapsed(isCollapsed);

      // Add event listener for button click
      this.button.addEventListener('click', () => {
          this.toggleOverview();
      });
      
  }

  setCollapsed(collapsed) {
      this.collapsed = collapsed;
      this.element.classList.toggle('ol-collapsed', collapsed);
      
      const icon = this.element.querySelector('.ol-overview-map-button-icon');

      // Change icon direction based on collapsed state
      if (collapsed) {
          icon.innerHTML = '«'; // Arrow pointing left when collapsed
          this.overviewMapDiv.style.display = 'none'; // Hide overview map
      } else {
          icon.innerHTML = '»'; // Arrow pointing right when expanded
          this.overviewMapDiv.style.display = 'block'; // Show overview map
      }
  }

  // This method is bound to a click event on the toggle button.
  toggleOverview() {
      this.setCollapsed(!this.collapsed);
  }

  // This method ensures that the overview map control doesn't overlap 
  // with a fixed navbar at the top of the page. It dynamically adjusts 
  // the control's position based on the navbar's height.
  updatePosition() {
      const navbar = document.querySelector('nav.navbar');
      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      this.element.style.top = `${navbarHeight}px`;
  }

  // Ensures proper cleanup when the control is removed from the map.
  // It prevents memory leaks by removing event listeners when they're 
  // no longer needed. it also ensures that all necessary setup or
  // cleanup from the parent class is performed.
  setMap(map) {
      if (!map) {
          window.removeEventListener('resize', this.updatePosition);
      }
      super.setMap(map);
  }
}