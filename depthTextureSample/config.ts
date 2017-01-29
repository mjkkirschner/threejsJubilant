define('three', ['../node_modules/three/build/three'], function ( THREE ) {
  window.THREE = THREE;
  return THREE;
});

requirejs.config({

paths: {
          'three' : '../node_modules/three/build/three',
          'orbitControls' : '../node_modules/three/examples/js/controls/OrbitControls' 
    },

    shim: {
        'orbitControls': {
            //These script dependencies should be loaded before loading
            //backbone.js
            deps: ['three']
        }
    }
});