

namespace voxels {

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

		let cube_geometry = new THREE.CubeGeometry(1, 1, 1);
		let cube_mesh = new THREE.Mesh(cube_geometry);

		//fill a grid of voxels with 1s.
		let voxelData: Array<Array<Array<number>>> = [[[]]];
		range(50).forEach((x) => {
			voxelData[x] = [];
			range(50).forEach((y) => {
				voxelData[x][y] = [];
				range(50).forEach((z) => {
					let dist = new THREE.Vector3(x, y, z).distanceTo(new THREE.Vector3(10, 10, 10));
					let data = 0;
					if (dist < 30) {
						data = 1;
					}
					voxelData[x][y][z] = data;

				});
			});
		});
		console.log(JSON.stringify(voxelData));

		//iterate the voxel data and decide to skip interior cubes
		voxelData.forEach((x, xindex, xarray) => {
			x.forEach((y, yindex, yarray) => {
				y.forEach((z, zindex, zarray) => {
					let skip = false;
					//if this cell is solid
					if (z == 1) {
						//TODO we will need to do bounds checking before doing each of these checks...
						//for now can just bail if we are near any edge.
						if ((xindex > xarray.length - 2) || (yindex > yarray.length - 2) || (zindex > zarray.length - 2) ||
							//or too small
							(xindex < 2) || (yindex < 2) || (zindex < 2)) {

							//for now do nothing TODO but should make a cube.
							skip = true;
						}

						if (skip != true) {


							//and all sorrounding cells are solid
							if ((voxelData[xindex + 1][yindex][zindex] == 1) && (voxelData[xindex - 1][yindex][zindex] == 1)
								&& (voxelData[xindex][yindex + 1][zindex] == 1) && (voxelData[xindex][yindex - 1][zindex] == 1)
								&& (voxelData[xindex][yindex][zindex + 1] == 1) && (voxelData[xindex][yindex][zindex - 1] == 1)) {

								//then don't draw anything

							}
							//if sorrounding cells are not solid
							else {
								//draw the cube
								let cube_mesh = new THREE.Mesh(cube_geometry);
								cube_mesh.position.x = xindex;
								cube_mesh.position.y = yindex;
								cube_mesh.position.z = zindex;
								scene.add(cube_mesh);
							}
						}
					}
				})
			})
		});


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