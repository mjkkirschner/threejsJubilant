

namespace voxels {

	class Tool {
		private element: HTMLElement
		private propertiesElement: HTMLElement;

		constructor(toolbarElement: HTMLElement, toolPropertiesElement: HTMLElement) {
			//construct a new tool button
			this.element = new HTMLElement();
			this.element = this.render();
			//might need to replace the element...
			toolbarElement.appendChild(this.element);

			this.propertiesElement = new HTMLElement();
			this.propertiesElement = this.renderToolProperties();
			//might need to replace the element...
			toolPropertiesElement.appendChild(this.propertiesElement);
		}

		render(): HTMLElement {
			//subclasses will attach things to this tool button	
			return this.element;
		}

		renderToolProperties(): HTMLElement {
			//subclasses will attach things to this 	
			return this.propertiesElement;
		}

		enable() {

		}

		disable() {

		}

	}

	class voxelRenderer {

		private controls: THREE.FirstPersonControls;
		private renderer: THREE.WebGLRenderer;
		private scene: THREE.Scene;
		private camera: THREE.PerspectiveCamera
		private light: THREE.HemisphereLight;
		private voxelData: Array<Array<Array<number>>> = [[[]]];
		private raycaster = new THREE.Raycaster();
		private clock = new THREE.Clock(true);

		constructor() {

			var intervalId;
			let mouse = { x: 0, y: 0 };

			window.addEventListener('mouseup', (event) => {
				clearInterval(intervalId);
			});
			window.addEventListener('mousemove', (event) => {
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
			});

			window.addEventListener('mousedown', (event) => {
				intervalId = setInterval((event) => {
					// calculate mouse position in normalized device coordinates
					// (-1 to +1) for both components


					// update the picking ray with the camera and mouse position
					this.raycaster.setFromCamera(mouse, this.camera);
					let intersects = [];
					let distanceTraveled = 0;
					let step = 0.1;
					//now march along the ray until either we are outside the bounds of the 
					//voxel space or we hit something
					while (intersects.length < 1 && (distanceTraveled < 400)) {
						//march
						distanceTraveled = distanceTraveled + step;
						let currentPoint = this.raycaster.ray.at(distanceTraveled);
						let x = Math.floor(currentPoint.x);
						let y = Math.floor(currentPoint.y);
						let z = Math.floor(currentPoint.z);
						try {
							if (this.voxelData[x][y][z] == 1) {
								intersects.push(currentPoint);
								break;
							}
						}
						catch (e) {

						}
					}

					if (intersects.length > 0) {
						//we need to guess at the normal and create there.... or increase the size of the intersection by x and add a larger cube...
						//we could just back off towards the ray vector and that might work...
						let normEnd = this.raycaster.ray.at(distanceTraveled - 1.0);
						let x = Math.floor(normEnd.x);
						let y = Math.floor(normEnd.y);
						let z = Math.floor(normEnd.z);

						let newPt = new THREE.Vector3(x, y, z);

						this.voxelData[newPt.x][newPt.y][newPt.z] = 1;
					}
					//delete all voxels in the scene already
					this.scene.children.forEach((child) => {
						if (child.userData == "voxel")
						{ this.scene.remove(child) }
					});

					this.meshVoxelData(this.voxelData, this.scene);
				}
					, 50, event);

			}, false);


			document.addEventListener("DOMContentLoaded", (event) => {

				renderer = new THREE.WebGLRenderer({ antialias: true });
				renderer.setSize(window.innerWidth, window.innerHeight);
				renderer.setClearColor(new THREE.Color(.9, .9, .9));
				document.getElementById('viewport').appendChild(renderer.domElement);

				this.scene = new THREE.Scene();

				this.light = (new THREE.HemisphereLight() as THREE.HemisphereLight);
				this.light.color = new THREE.Color(.8, .6, .8);
				this.light.groundColor = new THREE.Color(.8, .4, .4);
				this.light.intensity = 1.3;
				this.light.position.set(0, 120, 0);
				this.scene.add(this.light);

				this.camera = new THREE.PerspectiveCamera(
					35,
					window.innerWidth / window.innerHeight,
					1,
					1000
				);

				this.scene.add(this.camera);

				this.controls = new THREE.FirstPersonControls(this.camera);
				this.controls.lookSpeed = 0.1;
				this.controls.movementSpeed = 100;
				this.controls.movementSpeed = 70;
				this.controls.lookSpeed = 0.05;
				this.controls.autoSpeedFactor = 0;
				this.controls.mouseDragOn = false;
				this.controls.autoForward = false;
				this.controls.noFly = true;

				var start_time = (new Date()).getTime();

				//fill a grid of voxels with 1s.

				this.range(50).forEach((x) => {
					this.voxelData[x] = [];
					this.range(50).forEach((y) => {
						this.voxelData[x][y] = [];
						this.range(50).forEach((z) => {
							let dist = new THREE.Vector3(x, y, z).distanceTo(new THREE.Vector3(25, 25, 25));
							let data = 0;
							if (dist < 10) {
								data = 1;
							}
							this.voxelData[x][y][z] = data;

						});
					});
				});

				this.meshVoxelData(this.voxelData, this.scene);

				let frame = new THREE.CubeGeometry(100, 100, 100);
				frame = frame.translate(50, 50, 50) as THREE.CubeGeometry;
				let bigCube = new THREE.Mesh(frame);

				var geo = new THREE.WireframeGeometry(bigCube.geometry); // or WireframeGeometry( geometry )
				var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
				var wireframe = new THREE.LineSegments(geo, mat);

				this.scene.add(wireframe);

				console.log('Example 1: ' + ((new Date()).getTime() - start_time) + 'ms');
				this.render();

			});


		}

		private render() {
				this.controls.update(this.clock.getDelta());
				requestAnimationFrame(()=>{this.render()});
				renderer.render(this.scene, this.camera);
			}

		private range(N: number) {
			return Array.apply(null, { length: N }).map(Function.call, Number)
		}

		private meshVoxelData(voxelData: Array<Array<Array<number>>>, scene: THREE.Scene) {

			let cube_geometry = new THREE.CubeGeometry(1, 1, 1);
			let cube_mesh = new THREE.Mesh(cube_geometry);
			let voxelmat = new THREE.MeshStandardMaterial();
			voxelmat.color = new THREE.Color(.8, 1, 1);

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

	}


new voxelRenderer();


}