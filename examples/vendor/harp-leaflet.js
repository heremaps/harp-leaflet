(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@here/harp-geoutils'), require('@here/harp-mapview'), require('leaflet')) :
  typeof define === 'function' && define.amd ? define(['@here/harp-geoutils', '@here/harp-mapview', 'leaflet'], factory) :
  (global = global || self, (global.L = global.L || {}, global.L.HarpGL = factory(global.harp, global.harp, global.L)));
}(this, function (harpGeoutils, harpMapview, leaflet) { 'use strict';

  /**
   * https://github.com/gre/bezier-easing
   * BezierEasing - use bezier curve for transition easing function
   * by Gaëtan Renaudeau 2014 - 2015 – MIT License
   */

  // These values are established by empiricism with tests (tradeoff: performance VS precision)
  var NEWTON_ITERATIONS = 4;
  var NEWTON_MIN_SLOPE = 0.001;
  var SUBDIVISION_PRECISION = 0.0000001;
  var SUBDIVISION_MAX_ITERATIONS = 10;

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  var float32ArraySupported = typeof Float32Array === 'function';

  function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C (aA1)      { return 3.0 * aA1; }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

  function binarySubdivide (aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
  }

  function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
   for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
     var currentSlope = getSlope(aGuessT, mX1, mX2);
     if (currentSlope === 0.0) {
       return aGuessT;
     }
     var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
     aGuessT -= currentX / currentSlope;
   }
   return aGuessT;
  }

  function LinearEasing (x) {
    return x;
  }

  var src = function bezier (mX1, mY1, mX2, mY2) {
    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
      throw new Error('bezier x values must be in [0, 1] range');
    }

    if (mX1 === mY1 && mX2 === mY2) {
      return LinearEasing;
    }

    // Precompute samples table
    var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    for (var i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }

    function getTForX (aX) {
      var intervalStart = 0.0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }
      --currentSample;

      // Interpolate to provide an initial guess for t
      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;

      var initialSlope = getSlope(guessForT, mX1, mX2);
      if (initialSlope >= NEWTON_MIN_SLOPE) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }
    }

    return function BezierEasing (x) {
      // Because JavaScript number are imprecise, we should guarantee the extremes are right.
      if (x === 0) {
        return 0;
      }
      if (x === 1) {
        return 1;
      }
      return calcBezier(getTForX(x), mY1, mY2);
    };
  };

  /*
   * Copyright (C) 2019 HERE Europe B.V.
   * Licensed under Apache 2.0, see full license in LICENSE
   * SPDX-License-Identifier: Apache-2.0
   */
  // @ts-ignore
  const oldUpdatePostition = leaflet.Draggable.prototype._updatePosition;
  // @ts-ignore
  leaflet.Draggable.prototype._updatePosition = function (...args) {
      setTimeout(() => {
          oldUpdatePostition.apply(this, args);
      }, 0);
  };

  /*
   * Copyright (C) 2019 HERE Europe B.V.
   * Licensed under Apache 2.0, see full license in LICENSE
   * SPDX-License-Identifier: Apache-2.0
   */
  const GEO_COORD = new harpGeoutils.GeoCoordinates(0, 0, 0);
  const easing = src(0, 0, 0.25, 1);
  function lerp(v0, v1, t) {
      return v0 * (1 - t) + v1 * t;
  }
  function createSmoothZoom(delay) {
      let lastZoom = null;
      let lastCenter = null;
      let startZoomTimestamp = null;
      return {
          compute: (zoom, center) => {
              if (lastZoom === null) {
                  lastZoom = zoom;
              }
              else if (lastZoom !== zoom) {
                  if (startZoomTimestamp === null) {
                      startZoomTimestamp = performance.now();
                  }
                  const diff = performance.now() - startZoomTimestamp;
                  const progress = 1 - easing(Math.max(Math.min(diff / delay, 1), 0));
                  const currentZoom = lerp(lastZoom, zoom, progress);
                  const lat = lerp(lastCenter.lat, center.lat, progress);
                  const lng = lerp(lastCenter.lng, center.lng, progress);
                  return { zoom: currentZoom, center: { lat, lng } };
              }
              return { zoom, center };
          },
          setZoomAndTimestamp: (zoom, center, timestamp) => {
              lastZoom = zoom;
              lastCenter = center;
              startZoomTimestamp = timestamp;
          }
      };
  }
  class HarpGL extends leaflet.Layer {
      constructor(m_options) {
          super(m_options);
          this.m_options = m_options;
          this.m_isMoving = false;
      }
      initialize() {
          this.update();
          this.m_smoothZoom = createSmoothZoom(200); // 1/4 sec
      }
      getEvents() {
          return {
              // movestart: () => this.m_isMoving = true,
              moveend: () => this.m_isMoving = false,
              zoomstart: () => this.m_isMoving = false,
              zoomend: () => this.m_isMoving = false,
              move: () => {
                  this.m_isMoving = true;
                  this.update();
              },
              zoomanim: this.setNewZoom,
              zoom: this.update,
          };
      }
      resize() {
          const size = this._map.getSize();
          this.m_glContainer.style.width = size.x + 'px';
          this.m_glContainer.style.height = size.y + 'px';
          this.m_mapView.resize(size.x, size.y);
      }
      onAdd() {
          if (!this.m_glContainer) {
              this.initContainer();
          }
          this.getPane('mapPane').parentNode.appendChild(this.m_glContainer);
          this.initGL();
          // ...
          this.resize();
          this.m_mapView.addEventListener(harpMapview.MapViewEventNames.AfterRender, () => {
              if (this.m_isMoving) {
                  return;
              }
              this.update();
          });
          this._map.on('resize', this.resize.bind(this));
          return this;
      }
      initContainer() {
          const container = this.m_glContainer = leaflet.DomUtil.create('div', 'leaflet-harpgl-layer');
          const size = this._map.getSize();
          container.style.width = size.x + 'px';
          container.style.height = size.y + 'px';
      }
      initGL() {
          const canvas = this.m_glCanvas = document.createElement('canvas');
          // this styles are needed to sync movement and zoom deltas with leaflet.
          Object.assign(canvas.style, {
              width: "100%",
              height: "100%"
          });
          this.m_glContainer.appendChild(canvas);
          this.m_mapView = new harpMapview.MapView(Object.assign({ canvas, alpha: false, pixelRatio: 1 }, this.m_options));
          this.m_glContainer.appendChild(this.m_mapView.canvas);
      }
      update() {
          if (this._map) {
              const { zoom, center } = this.m_smoothZoom.compute(this._map.getZoom(), this._map.getCenter());
              const cameraDistance = harpMapview.MapViewUtils.calculateDistanceToGroundFromZoomLevel(this.m_mapView, zoom);
              GEO_COORD.latitude = center.lat;
              GEO_COORD.longitude = center.lng;
              GEO_COORD.altitude = cameraDistance;
              // Triggers update of mapview.worldCenter
              this.m_mapView.geoCenter = GEO_COORD;
          }
      }
      setNewZoom(e) {
          this.m_smoothZoom.setZoomAndTimestamp(e.zoom, e.center, performance.now());
      }
      get mapView() {
          return this.m_mapView;
      }
  }

  return HarpGL;

}));
