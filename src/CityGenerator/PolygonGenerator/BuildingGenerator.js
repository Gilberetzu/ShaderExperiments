import * as THREE from 'three';
import Draw from '../Draw';
import Num from '../Math/Num';
import Vec2 from '../Math/Vec2';
import Vec3 from '../Math/Vec3';
import GenerationSpace from './GenerationSpace';

export default class BuildingGenerator{
	/**
	 * @param {HTMLCanvasElement} canvasHTMLElement 
	 */
	constructor(canvasHTMLElement){
		let size = window.CityGenerator.getContainerSize();

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( Draw.HexColor(0.05,0.05,0.1) );
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

		this.renderer = new THREE.WebGLRenderer({
			canvas: canvasHTMLElement
		});
		this.renderer.setSize( size.width, size.height);

		const gridHelper = new THREE.GridHelper( 10, 10, Draw.HexColor(1.0,0.2,0.2));
		gridHelper.position.y = -0.01;
		const gridHelperVertical = new THREE.GridHelper( 10, 10, Draw.HexColor(1.0,0.2,0.2));
		gridHelperVertical.rotateX(Num.DegToRad(90));
		this.scene.add( gridHelper );
		this.scene.add( gridHelperVertical );

		this.lastTime = performance.now();

		this.cameraPosition = new Vec3(2,2,2);
		this.cameraRotation = new Vec3(1,Num.DegToRad(90 + 45), Num.DegToRad(-45)); /* (R, Theta, Phi) */

		this.rotation
		
		//Rotation State Machine
		this.rotatingCamera = false;
		this.mousePosRotStart = Vec2.Zero();

		this.cameraChange = true;

		this.generationSpaces = [];
	}

	systemUpdate(time){
		const currentTime = time;
		this.update(currentTime - this.lastTime);
		this.lastTime = currentTime;
		this.renderer.render( this.scene, this.camera );
	}

	cameraMovementAndRotation(inputStore, dt){
		//Movement State Machine
		const movementInput = new Vec3(
			inputStore.keyboard["KeyD"] ? 1 : inputStore.keyboard["KeyA"] ? -1 : 0,
			inputStore.keyboard["KeyE"] ? 1 : inputStore.keyboard["KeyQ"] ? -1 : 0,
			inputStore.keyboard["KeyW"] ? 1 : inputStore.keyboard["KeyS"] ? -1 : 0,
		);

		
		if(this.rotatingCamera == false){
			if(inputStore.mouse.buttons[1]){
				//console.log("Start Rotating");
				this.rotatingCamera = true;
				//const size = window.CityGenerator.getContainerSize();
				this.mousePosRotStart = Vec2.Copy(inputStore.mouse.position);
			}
		}else{
			if(inputStore.mouse.buttons[1]){
				window.CityGenerator.UICanvas.setDetailPosition(this.mousePosRotStart);

				const currentPos = Vec2.Copy(inputStore.mouse.position);
				const posDelta = Vec2.Subtract(currentPos, this.mousePosRotStart);
				const movLen = Vec2.Length(posDelta);
				if(movLen > 0.001){
					const posNorm = Vec2.DivScalar(posDelta, movLen)//Normalize
					Vec2.MultScalar(posNorm, (inputStore.keyboard["ShiftLeft"] ? 2 : 1) * Num.Smoothstep(Num.ClampedInverseLerp(0, 300, movLen)) * dt * 1 / 1000, posNorm);
					this.cameraRotation.z += posNorm.x;
					const currentVerticalRotation = this.cameraRotation.y + posNorm.y;
					this.cameraRotation.y = Num.Clamp(currentVerticalRotation, Num.DegToRad(15), Num.DegToRad(165));
					
					this.cameraChange = true;
				}
			}else{
				//console.log("Stop Rotating");
				this.rotatingCamera = false;
			}
		}

		const rotToSpace = new Vec3(
			this.cameraRotation.x * Math.sin(this.cameraRotation.z) * Math.sin(this.cameraRotation.y),
			this.cameraRotation.x * Math.cos(this.cameraRotation.y),
			-this.cameraRotation.x * Math.cos(this.cameraRotation.z) * Math.sin(this.cameraRotation.y)
		);
		
		const movLen = Vec3.Length(movementInput);
		if(movLen > 0.001){
			Vec3.DivScalar(movementInput, movLen, movementInput)//Normalize

			const forward = Vec3.Normalize(new Vec3(rotToSpace.x, 0, rotToSpace.z));
			const right = Vec3.Cross(forward, new Vec3(0,1,0));
			
			const movSpeed = (inputStore.keyboard["ShiftLeft"] ? 2.5 : 1) * dt * 2 / 1000;

			const movementVec = Vec3.Add(
				new Vec3(0, movSpeed * movementInput.y, 0),
				Vec3.Add(
					Vec3.MultScalar(forward, movSpeed * movementInput.z), 
					Vec3.MultScalar(right, movSpeed * movementInput.x)
				)
			);

			Vec3.Add(this.cameraPosition, movementVec, this.cameraPosition);

			this.cameraChange = true;
		}

		if(this.cameraChange){
			Vec3.Copy(this.cameraPosition, this.camera.position);
			const lookAtPos = Vec3.Add(this.cameraPosition, rotToSpace);
			this.camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
			
			this.cameraChange = false;
		}
	}

	addGenerationSpace(vertices, triangles, edgeAverageLength){
		const newGenSpace = new GenerationSpace(vertices, triangles, edgeAverageLength);
		newGenSpace.addSpaceToScene(this.scene);
		this.generationSpaces.push(newGenSpace);
	}

	update(dt){
		let inputStore = window.CityGenerator.input;
		this.cameraMovementAndRotation(inputStore, dt);
	}
}