

namespace voxels {

	var range = (N): Array<any> => { return Array.apply(null, { length: N }).map(Function.call, Number) };

	var meshVoxelData = (voxelData: Array<Array<Array<number>>>, scene: THREE.Scene) => {

		let cube_geometry = new THREE.CubeGeometry(1, 1, 1);
		let cube_mesh = new THREE.Mesh(cube_geometry);
		let voxelmat = new THREE.MeshStandardMaterial();
		voxelmat.color = new THREE.Color(1, 1, 1);

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
								let cube_mesh = new THREE.Mesh(cube_geometry, voxelmat);
								cube_mesh.position.x = xindex;
								cube_mesh.position.y = yindex;
								cube_mesh.position.z = zindex;
								cube_mesh.userData = "voxel";
								scene.add(cube_mesh);
							}
						}
					}
				})
			})
		});
	}

	var controls: THREE.OrbitControls;
	var renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera
	var light: THREE.HemisphereLight;
	var voxelData: Array<Array<Array<number>>> = [[[]]];
	let raycaster = new THREE.Raycaster();


	var intervalId;

	window.addEventListener('mouseup', (event) => {
		clearInterval(intervalId);
	});

	window.addEventListener('mousedown', (event) => {
		intervalId = setInterval( (event) => {
			// calculate mouse position in normalized device coordinates
			// (-1 to +1) for both components
			let mouse = { x: 0, y: 0 };
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

			// update the picking ray with the camera and mouse position
			raycaster.setFromCamera(mouse, camera);

			// calculate objects intersecting the picking ray
			var intersects = raycaster.intersectObjects(scene.children);

			if (intersects.length > 0) {
				let pickedCubePoint = intersects[0].point;
				let x = Math.floor(pickedCubePoint.x) + 1;
				let y = Math.floor(pickedCubePoint.y) + 1;
				let z = Math.floor(pickedCubePoint.z) + 1;

				let newPt = new THREE.Vector3(x, y, z);
				voxelData[x][y][z] = 1;
			}
			//delete all voxels in the scene already
			scene.children.forEach((child) => {
				if (child.userData == "voxel")
				{ scene.remove(child) }
			});

			meshVoxelData(voxelData, scene);
		}
			, 100,event);

	}, false);


	document.addEventListener("DOMContentLoaded", (event) => {

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(new THREE.Color(.9, .9, .9));
		document.getElementById('viewport').appendChild(renderer.domElement);

		scene = new THREE.Scene();

		light = (new THREE.HemisphereLight() as THREE.HemisphereLight);
		light.color = new THREE.Color(1, .8, .8);
		light.groundColor = new THREE.Color(.8, .8, .8);
		light.intensity = 2.0;
		light.position.set(0, 120, 0);
		scene.add(light);

		camera = new THREE.PerspectiveCamera(
			35,
			window.innerWidth / window.innerHeight,
			1,
			1000
		);
		camera.position.set(0, 200, 50);
		scene.add(camera);

		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.rotateSpeed = 0.35;
		controls.enableRotate = false;
		controls.autoRotate = true;
		controls.target = new THREE.Vector3(50, 50, 50);

		var start_time = (new Date()).getTime();

		//fill a grid of voxels with 1s.

		range(100).forEach((x) => {
			voxelData[x] = [];
			range(100).forEach((y) => {
				voxelData[x][y] = [];
				range(100).forEach((z) => {
					let dist = new THREE.Vector3(x, y, z).distanceTo(new THREE.Vector3(50, 50, 50));
					let data = 0;
					if (dist < 20) {
						data = 1;
					}
					voxelData[x][y][z] = data;

				});
			});
		});
		//console.log(JSON.stringify(voxelData));
		meshVoxelData(voxelData, scene);

		let frame = new THREE.CubeGeometry(100, 100, 100);
		frame = frame.translate(50, 50, 50) as THREE.CubeGeometry;
		let bigCube = new THREE.Mesh(frame);

		var geo = new THREE.WireframeGeometry(bigCube.geometry); // or WireframeGeometry( geometry )
		var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
		var wireframe = new THREE.LineSegments(geo, mat);

		scene.add(wireframe);

		console.log('Example 1: ' + ((new Date()).getTime() - start_time) + 'ms');
		render();

	});

	function render() {
		controls.update();
		requestAnimationFrame(render);
		renderer.render(scene, camera);
	}
}