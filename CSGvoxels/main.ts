

namespace voxels {


	/**
	 * tool is a class which backs all tools that interact with the voxel data model
	 * they provide both a button element which activates the tool, and a properties element
	 * which provides options for modifying the behavior of the tool.
	 * 
	 */
	class Tool {
		protected element: HTMLElement
		protected propertiesElement: HTMLElement;
		protected enabled: boolean = false;
		protected voxelRenderer:voxelRenderer

		constructor(toolbarElement: HTMLElement, toolPropertiesElement: HTMLElement,voxelRenderer:voxelRenderer) {
			//TODO think about the logic here a bit more...	
			this.voxelRenderer = voxelRenderer;
			//construct a new tool button
			this.element = document.createElement("div");
			this.element = this.render();
			//might need to replace the element...
			toolbarElement.appendChild(this.element);

			this.propertiesElement = document.createElement("div");
			this.propertiesElement = this.renderToolProperties();
			//might need to replace the element...
			toolPropertiesElement.appendChild(this.propertiesElement);
		}

		protected render(): HTMLElement {
			//subclasses will attach things to this tool button	
			return this.element;
		}

		protected renderToolProperties(): HTMLElement {
			//subclasses will attach things to this 	
			return this.propertiesElement;
		}

		public onEnable() {

		}

		public onDisable() {

		}

	}

	class brushTool extends Tool {

		private raycaster  = new THREE.Raycaster();
		private mouse = { x: 0, y: 0 };

		constructor(toolbarElement: HTMLElement, toolPropertiesElement: HTMLElement,voxelRender:voxelRenderer) {
			super(toolbarElement, toolPropertiesElement,voxelRender);
		}

		//lets add a button to the element
		render(): HTMLElement {
			//TODO should this exist in the base class?
			let myButton = document.createElement("input");
			myButton.type = "button";
			myButton.value = "my button";
			//invert the state on mouseclick and run the correct function
			myButton.onclick = (ev: MouseEvent) => {
			this.enabled = !this.enabled
				if (this.enabled) {
					this.onEnable();
				}
				else {
					this.onDisable();
				}
			}

			this.element.appendChild(myButton);
			return this.element;
		}

		public onEnable() {
			var intervalId;

			//hookup a callback for mouse down and mouse move
			window.addEventListener('mouseup', (event) => {
				clearInterval(intervalId);
			});
			window.addEventListener('mousemove', (event) => {
				this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
			});

			window.addEventListener('mousedown', (event) => {
				intervalId = setInterval((event) => {
					// calculate mouse position in normalized device coordinates
					// (-1 to +1) for both components


					// update the picking ray with the camera and mouse position
					this.raycaster.setFromCamera(this.mouse, this.voxelRenderer.camera);
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
							if (this.voxelRenderer.voxelData[x][y][z] == 1) {
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

						this.voxelRenderer.voxelData[newPt.x][newPt.y][newPt.z] = 1;
					}
					//delete all voxels in the scene already
					this.voxelRenderer.scene.children.forEach((child) => {
						if (child.userData == "voxel")
						{ this.voxelRenderer.scene.remove(child) }
					});

					//TODO the voxelRenderer should take of watching the voxelData and kicking off
					//a run of this culling algo, we should not do it here.
					this.voxelRenderer.onVoxelDataUpdated();
				}
					, 50, event);

			}, false);
		}

		public onDisable() {
			//unhook all callbacks

		}

	}

	class voxelRenderer {

		private controls: THREE.FirstPersonControls;
		private renderer: THREE.WebGLRenderer;
		public scene: THREE.Scene;
		public camera: THREE.PerspectiveCamera
		private light: THREE.HemisphereLight;
		//add some properties for interacting with this data.
		public voxelData: Array<Array<Array<number>>> = [[[]]];
		private raycaster = new THREE.Raycaster();
		private clock = new THREE.Clock(true);

		constructor() {

			let mouse = { x: 0, y: 0 };

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

		//handler for voxel data being updated
		//usually this should only be called from this class, but clients can force this to execute
		public onVoxelDataUpdated(){
			this.meshVoxelData(this.voxelData,this.scene);
		}

		private render() {
			this.controls.update(this.clock.getDelta());
			requestAnimationFrame(() => { this.render() });
			renderer.render(this.scene, this.camera);
		}

		private range(N: number) {
			return Array.apply(null, { length: N }).map(Function.call, Number)
		}
		
		/** It returns a mesh representation of a 3d array of numbers.
		 * this function takes a 3d array of numbers and culls the interior cubes
		 * instantiating cubes into the given scene on the edges of the volume.
		 */
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


	let voxelData = new voxelRenderer();
	let toolbar = document.getElementById("toolbar");
	let properties = document.getElementById("properties");
	let bTool = new brushTool(toolbar, properties,voxelData);


}