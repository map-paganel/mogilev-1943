export class GoogleLogoControl extends ol.control.Control {
  constructor(options) {
    const element = document.createElement('div');
    element.className = 'ol-google-logo ol-unselectable ol-control';
    
    const img = document.createElement('img');
    img.src = './images/google_on_non_white.png';
    img.alt = 'Google';
    element.appendChild(img);

    super({
      element: element,
      target: options.target,
    });
  }

  setVisible(visible) {
      this.element.style.display = visible ? 'block' : 'none';
    }
}
