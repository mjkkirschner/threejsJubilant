var container;
let camera:THREE.PerspectiveCamera;
let scene:THREE.Scene;
var raycaster:THREE.Raycaster;
let renderer:THREE.WebGLRenderer;

var mouse = new THREE.Vector2();
var INTERSECTED:THREE.Mesh;
var radius = 100;

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);

    scene = new THREE.Scene();

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    var geometry = new THREE.BoxBufferGeometry(20, 20, 20);

    for (var i = 0; i < 2000; i++) {

        var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
        (object.material as THREE.MeshLambertMaterial).color = new THREE.Color(1,1,1);

        object.position.x = Math.random() * 800 - 400;
        object.position.y = Math.random() * 800 - 400;
        object.position.z = Math.random() * 800 - 400;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() + 0.5;
        object.scale.y = Math.random() + 0.5;
        object.scale.z = Math.random() + 0.5;

        scene.add(object);

    }

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onDocumentClick, false);
    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentClick(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

function animate() {
    requestAnimationFrame(animate);
    render();
}

var oldColor:THREE.Color;
function render() {


    camera.lookAt(scene.position);

    camera.updateMatrixWorld(false);

    // find intersections

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    
    //if there are any intersections 
    if (intersects.length > 0) {
        //and if last intersection is not set to the current intersection object
        if (INTERSECTED != intersects[0].object) {

            if(INTERSECTED){
                 console.log("reset color to",oldColor);
                  //then reset the last objects color to the saved color - if it exists
            (INTERSECTED.material as THREE.MeshLambertMaterial).color = oldColor;
            }
           
           //and set the new objects color to the highlight color, while storing the oldcolor;
            INTERSECTED  = intersects[0].object as THREE.Mesh;
            oldColor =  (INTERSECTED.material as THREE.MeshLambertMaterial).color;
            console.log(oldColor);
            (INTERSECTED.material as THREE.MeshLambertMaterial).color =  new THREE.Color(1.0,.2,.2);

        }
        //if there are no intersections
    } else {
        //but there is a previously selected thing - dont do anything;
        if (INTERSECTED) {
          (INTERSECTED.material as THREE.MeshLambertMaterial).color = oldColor;
        }

        INTERSECTED = null;

    }

    renderer.render(scene, camera);

}