import * as THREE from 'three';
import Num from '../Math/Num';
import Vec3 from '../Math/Vec3';
import Vec2 from '../Math/Vec2';

export default class CameraController{
	constructor(scene){
		this.size = window.CityGenerator.getContainerSize();
		this.camera = new THREE.PerspectiveCamera( 75, this.size.width / this.size.height, 0.1, 500 );

		this.cameraPosition = new Vec3(2,2,2);
		this.cameraRotation = new Vec3(1,Num.DegToRad(90 + 45), Num.DegToRad(-45));
		this.cameraRotationStart = Vec3.Copy(this.cameraRotation);

		this.cameraPanPositionStart = Vec2.Copy(this.cameraPosition);

		this.panningCamera = false;
		this.mousePosPanStart = Vec2.Zero();
		this.rotatingCamera = false;
		this.mousePosRotStart = Vec2.Zero();

		scene.add(this.camera);
	}

	cameraMovementAndRotation(inputStore, dt){
		//Movement State Machine
		
		if(this.rotatingCamera == false){
			if(inputStore.mouse.buttons[1] || (inputStore.mouse.buttons[0] && inputStore.keyboard.ControlLeft)){
				//console.log("Start Rotating");
				this.rotatingCamera = true;
				//const size = window.CityGenerator.getContainerSize();
				this.mousePosRotStart = Vec2.Copy(inputStore.mouse.position);
				this.cameraRotationStart = Vec3.Copy(this.cameraRotation);
			}
		}else{
			if(inputStore.mouse.buttons[1] || (inputStore.mouse.buttons[0] && inputStore.keyboard.ControlLeft)){
				window.CityGenerator.UICanvas.setDetailPosition(this.mousePosRotStart);

				const currentPos = Vec2.Copy(inputStore.mouse.position);
				const posDelta = Vec2.Subtract(currentPos, this.mousePosRotStart);
				const movLen = Vec2.Length(posDelta);
				if(movLen > 0.001){
					//const posNorm = Vec2.DivScalar(posDelta, movLen)//Normalize
					//Vec2.MultScalar(posNorm, (inputStore.keyboard["ShiftLeft"] ? 2 : 1) * Num.Smoothstep(Num.ClampedInverseLerp(0, 300, movLen)) * dt * 1 / 1000, posNorm);
					//this.cameraRotation.z += posNorm.x;
					this.cameraRotation.z = this.cameraRotationStart.z + posDelta.x / 500;
					//const currentVerticalRotation = this.cameraRotation.y + posNorm.y;
					const currentVerticalRotation = this.cameraRotationStart.y + posDelta.y / 500;
					this.cameraRotation.y = Num.Clamp(currentVerticalRotation, Num.DegToRad(15), Num.DegToRad(165));
				}
			}else{
				//console.log("Stop Rotating");
				this.rotatingCamera = false;
			}
		}

		const movementInput = new Vec3(
			inputStore.keyboard["KeyD"] ? 1 : inputStore.keyboard["KeyA"] ? -1 : 0,
			inputStore.keyboard["KeyE"] ? 1 : inputStore.keyboard["KeyQ"] ? -1 : 0,
			inputStore.keyboard["KeyW"] ? 1 : inputStore.keyboard["KeyS"] ? -1 : 0,
		);

		const rotToSpace = new Vec3(
			this.cameraRotation.x * Math.sin(this.cameraRotation.z) * Math.sin(this.cameraRotation.y),
			this.cameraRotation.x * Math.cos(this.cameraRotation.y),
			-this.cameraRotation.x * Math.cos(this.cameraRotation.z) * Math.sin(this.cameraRotation.y)
		);

		if(this.panningCamera == false){
			if(inputStore.mouse.buttons[2] && inputStore.keyboard.ControlLeft && !(inputStore.mouse.buttons[0] || inputStore.mouse.buttons[1])){
				this.panningCamera = true;
				this.cameraPanPositionStart = Vec3.Copy(this.cameraPosition);
				this.mousePosPanStart = Vec2.Copy(inputStore.mouse.position);
			}
		}else{
			if(inputStore.mouse.buttons[2] && inputStore.keyboard.ControlLeft && !(inputStore.mouse.buttons[0] || inputStore.mouse.buttons[1])){
				window.CityGenerator.UICanvas.setDetailPosition(this.mousePosPanStart);
				const currentPos = Vec2.Copy(inputStore.mouse.position);
				const posDelta = Vec2.Subtract(currentPos, this.mousePosPanStart);

				const right = Vec3.Cross(rotToSpace, new Vec3(0,1,0));
				const up = Vec3.Cross(rotToSpace, right);

				this.cameraPosition = Vec3.Add(Vec3.Add(this.cameraPanPositionStart, Vec3.MultScalar(up, posDelta.y/ 100)), Vec3.MultScalar(right, posDelta.x / 100));
			}else{
				this.panningCamera = false;
			}
		}

		const movLen = Vec3.Length(movementInput);
		if(movLen > 0.001){
			Vec3.DivScalar(movementInput, movLen, movementInput)//Normalize

			const forward = Vec3.Normalize(new Vec3(rotToSpace.x, 0, rotToSpace.z));
			const right = Vec3.Cross(forward, new Vec3(0,1,0));
			
			const movSpeed = (inputStore.keyboard["ShiftLeft"] ? 4 : 1) * dt * 2 / 1000;

			const movementVec = Vec3.Add(
				new Vec3(0, movSpeed * movementInput.y, 0),
				Vec3.Add(
					Vec3.MultScalar(forward, movSpeed * movementInput.z), 
					Vec3.MultScalar(right, movSpeed * movementInput.x)
				)
			);

			Vec3.Add(this.cameraPosition, movementVec, this.cameraPosition);
		}

		if(Math.abs(inputStore.mouse.scrollDelta.y) > 0.001){
			const movSpeed = - Math.sign(inputStore.mouse.scrollDelta.y) * (inputStore.keyboard["ShiftLeft"] ? 4 : 1) * dt * 0.02;
			Vec3.Add(Vec3.MultScalar(rotToSpace, movSpeed ), this.cameraPosition, this.cameraPosition);
		}
		if(this.cameraPosition.y < 0.2){
			this.cameraPosition.y = 0.2;
		}

		Vec3.Lerp(this.camera.position, this.cameraPosition, 0.5, this.camera.position);
		const lookAtPos = Vec3.Add(this.camera.position, rotToSpace);
		this.camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
	}

	setToCenterPosition(centerPos){
		this.cameraPosition.x = centerPos.y;
		this.cameraPosition.z = centerPos.x;
	}
}