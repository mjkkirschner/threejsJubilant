//don't require anything - at this point all scripts are loaded via html...
var vertShader =  
`varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`

   var fragShader = 
    `#include <packing>
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform float cameraNear;
      uniform float cameraFar;
      uniform float scale;
      
      float readDepth (sampler2D depthSampler, vec2 coord) {
        float fragCoordZ = texture2D(depthSampler, coord).x;
        float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar);
        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar);
      }
      void main() {
        vec3 diffuse = (texture2D(tDiffuse, vUv).rgb);
        float depth = readDepth(tDepth, vUv);
        gl_FragColor.rgb = vec3(scale-(depth*depth),scale- depth,scale -depth);
        gl_FragColor.a = 1.0;
      }`
 
      var camera:THREE.PerspectiveCamera, scene:THREE.Scene;
      var renderer:THREE.WebGLRenderer, controls:THREE.OrbitControls;
      var target:THREE.WebGLRenderTarget;
      var scaleVal:{value:string};
      var postScene:THREE.Scene, postCamera:THREE.OrthographicCamera;
      var supportsExtension = true;
      
      init();
      animate();
      
      
      function init() {
        var canvas = document.querySelector('canvas');
        var gl;
        try {
          gl = canvas.getContext('webgl2');
        } catch (err) {
          console.error(err);
        }
        var isWebGL2 = Boolean(gl);
        renderer = new THREE.WebGLRenderer( {
          canvas: canvas,
        } );
        if ( !renderer.extensions.get('WEBGL_depth_texture') ) {
          supportsExtension = false;
          (<HTMLElement>document.querySelector('#error')).style.display = 'block';
          return;
        }
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        //
        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 50 );
        camera.position.z = -4;
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.rotateSpeed = 0.35;
        controls.autoRotate = true;

        // Create a multi render target with Float buffers
        target = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
        target.texture.format = THREE.RGBFormat;
        target.texture.minFilter = THREE.NearestFilter;
        target.texture.magFilter = THREE.NearestFilter;
        target.texture.generateMipmaps = false;
        target.stencilBuffer = false;
        target.depthBuffer = true;
        target.depthTexture = new THREE.DepthTexture(window.innerWidth,window.innerHeight);
        target.depthTexture.type = isWebGL2 ? THREE.FloatType : THREE.UnsignedShortType;

        //get our slider and stick it in a variable
        scaleVal =  {value:(<HTMLInputElement>document.getElementById("myRange")).value};
        // Our scene
        scene = new THREE.Scene();
        setupScene();
        // Setup post-processing step
        setupPost();
        onWindowResize();
        window.addEventListener( 'resize', onWindowResize, false );
      }
      function setupPost () {
        // Setup post processing stage
        postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        var postMaterial = new THREE.ShaderMaterial({
          vertexShader: vertShader.trim(),
          fragmentShader: fragShader.trim(),
          uniforms: {
            cameraNear: { value: camera.near },
            cameraFar:  { value: camera.far },
            tDiffuse:   { value: target.texture },
            tDepth:     { value: target.depthTexture },
            scale:     scaleVal
          }
        });
        var postPlane = new THREE.PlaneGeometry(2, 2);
        var postQuad = new THREE.Mesh(postPlane, postMaterial);
        postScene = new THREE.Scene();
        postScene.add(postQuad);
      }



      function setupScene () {

          // get rid of all children of the scene
            scene.children.forEach(function (object) {
              scene.remove(object);
          });


        var diffuse = new THREE.TextureLoader().load('textures/brick_diffuse.jpg');
        diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
        // Setup some geometries
        var geometry = new THREE.ConeGeometry( 1, 20, 32 );
        var material = new THREE.MeshBasicMaterial({ color: 'blue' });
        var count = 50;
        var scale = 5;
        for ( var i = 0; i < count; i ++ ) {
          var r = Math.random() * 2.0 * Math.PI;
          var z = (Math.random() * 2.0) - 1.0;
          var zScale = Math.sqrt(1.0 - z * z) * scale;
          var mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(
            Math.cos(r) * zScale,
            Math.sin(r) * zScale,
            z * scale
          );
          mesh.rotation.set(Math.random()*3.0, Math.random()*3.0, Math.random()*3.0);
          scene.add(mesh);
        }
      }
      function onWindowResize() {
        var aspect = window.innerWidth / window.innerHeight;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        var dpr = renderer.getPixelRatio();
        target.setSize( window.innerWidth * dpr, window.innerHeight * dpr );
        renderer.setSize( window.innerWidth, window.innerHeight );
      }

      //setInterval(()=>{setupScene()},100);
      
      function animate() {
        if ( !supportsExtension ) return;
        requestAnimationFrame( animate );
        controls.update();
        // render scene into target
        scaleVal.value =  (<HTMLInputElement>document.getElementById("myRange")).value;
        renderer.render( scene, camera, target );
        // render post FX
        renderer.render( postScene, postCamera );
      }
