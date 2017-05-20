

namespace voxels {
	let ThreeBSP = (window as any).ThreeBSP as any;

	var range = (N): Array<any> => { return Array.apply(null, { length: N }).map(Function.call, Number) };

	var controls: THREE.OrbitControls;
	var renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, light: THREE.Light;
	document.addEventListener("DOMContentLoaded", (event) => {

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementById('viewport').appendChild(renderer.domElement);

		scene = new THREE.Scene();

		light = new THREE.DirectionalLight();
		light.position.set(1, 1, 1).normalize();
		scene.add(light);

		camera = new THREE.PerspectiveCamera(
			35,
			window.innerWidth / window.innerHeight,
			1,
			1000
		);
		camera.position.set(0, 5, 20);
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		scene.add(camera);

		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.rotateSpeed = 0.35;
		controls.autoRotate = true;




		var start_time = (new Date()).getTime();
		let result = null;


		let cube_geometry = new THREE.CubeGeometry(1, 1, 1);
		let cube_mesh = new THREE.Mesh(cube_geometry);
		range(10).forEach((x) => {
			range(10).forEach((y) => {
				range(10).forEach((z) => {
					

					cube_mesh.position.x = x;
					cube_mesh.position.y = y;
					cube_mesh.position.z = z;
					let cube_bsp = new ThreeBSP(cube_mesh);
					//if the result has never been set, initialize it to the first cube
					if (result == null) {
						result = cube_bsp;
					} else {
						result = result.union(cube_bsp);

					}
				})
			})
		});

		let orgGeo = result.toGeometry() as THREE.Geometry;
		//orgGeo.mergeVertices();
		//var simplify = new (THREE as any).SimplifyModifier();
		//let sortedGeometry = simplify.modify(orgGeo) as THREE.Geometry;
		//let simplifiedGeo = changeLOD(orgGeo, sortedGeometry as any, .4);

		//var wiregeo = new THREE.WireframeGeometry(orgGeo);
		//var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
		//var wireframe = new THREE.LineSegments(wiregeo, mat);

		//scene.add(wireframe);
		//let Meshresult = result.toMesh(new THREE.MeshLambertMaterial());
		//Meshresult.geometry.computeVertexNormals();
		scene.add(new THREE.Mesh(orgGeo));




		console.log('Example 1: ' + ((new Date()).getTime() - start_time) + 'ms');
		render();

	});


	function changeLOD(originalGeometry: THREE.Geometry,
		sortedGeometry: { sortedGeometry: any, map: any, vertices: any, faces: any },
		k: number): THREE.Geometry {
		// var LOD = 9;
		var map = sortedGeometry.map;
		var permutations = sortedGeometry.sortedGeometry;
		var sortedVertices = sortedGeometry.vertices;
		var t = sortedVertices.length - 1;
		t = t * k | 0;

		var numFaces = 0;
		var face;

		var geometry = originalGeometry;

		for (let i = 0; i < geometry.faces.length; i++) {

			face = geometry.faces[i];

			var oldFace = sortedGeometry.faces[i];
			face.a = oldFace.a;
			face.b = oldFace.b;
			face.c = oldFace.c;

			while (face.a > t) face.a = map[face.a];
			while (face.b > t) face.b = map[face.b];
			while (face.c > t) face.c = map[face.c];

			if (face.a !== face.b && face.b !== face.c && face.c !== face.a) numFaces++;

		}

		console.log('vertices', t, 'faces', numFaces);

		let simplifiedFaces = numFaces;

		let simplifiedVertices = t;




		// delete geometry.__tmpVertices;
		// console.log(geometry);
		geometry.computeFaceNormals();
		// geometry.computeVertexNormals();
		geometry.verticesNeedUpdate = true;
		geometry.normalsNeedUpdate = true;
		return geometry;
	}



	function render() {
		requestAnimationFrame(render);
		renderer.render(scene, camera);
		controls.update();

	}
}