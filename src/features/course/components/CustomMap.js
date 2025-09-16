import mapboxgl from 'mapbox-gl';

class CustomMap extends mapboxgl.Map {
  _updateContainerDimensions() {
    if (!this._container) return;

    let width = 0;
    let height = 0;

    const containerRect = this._container.getBoundingClientRect();
    width = containerRect.width || 1957; //Added to fit map on screen. 
    height = containerRect.height || 768; //Added to fit map on screen. 

    let transformValues;
    let transformScaleWidth;
    let transformScaleHeight;
    let el = this._container;
    while (el && (!transformScaleWidth || !transformScaleHeight)) {
      const transformMatrix = window.getComputedStyle(el).transform;
      if (transformMatrix && transformMatrix !== 'none') {
        transformValues = transformMatrix.match(/matrix.*\((.+)\)/)[1].split(', ');
        if (transformValues[0] && transformValues[0] !== '0' && transformValues[0] !== '1') {
          transformScaleWidth = transformValues[0];
        }
        if (transformValues[3] && transformValues[3] !== '0' && transformValues[3] !== '1') {
          transformScaleHeight = transformValues[3];
        }
      }
      el = el.parentElement;
    }

    this._containerWidth = transformScaleWidth ? Math.abs(width / transformScaleWidth) : width;
    this._containerHeight = transformScaleHeight ? Math.abs(height / transformScaleHeight) : height;
  }
}

export default CustomMap;