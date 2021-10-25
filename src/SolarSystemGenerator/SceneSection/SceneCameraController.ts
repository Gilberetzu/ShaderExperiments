import * as THREE from 'three';
import ThreeScene from './ThreeScene';
import { writable, get} from "svelte/store";
import { Writable } from 'svelte/store';
import CameraStores from './CameraStores';

export default class SceneCameraController{
	camera: THREE.Camera;

	cameraDistance: number;
	verticalRotation: number;
	planarRotation: number;
	cameraRotationCenter: THREE.Vector3;

	desiredWidth:number;
	threeScene:ThreeScene;

	controlStores: CameraStores;

	isLeftButtonDown:boolean;

	eventListeners: {
		mouseDown: (event)=>void,
		mouseUp: (event)=>void,
		mouseMove: (event)=>void,
		wheel: (event)=>void
	}

	constructor(threeScene, controlStores){
		this.threeScene = threeScene;
		this.desiredWidth = 300;
		this.cameraRotationCenter = new THREE.Vector3(0.0,0.0,0.0);
		this.camera = new THREE.PerspectiveCamera( 75, 1, 0.0001, 150 );
		this.camera.position.z = 2;

		this.controlStores = controlStores;
		this.controlStores.cameraRotation.subscribe((state)=>{
			this.planarRotation = state.x;
			this.verticalRotation = state.y;
			this.updateCameraRotation();
		});
		this.controlStores.cameraDistance.subscribe((this.setCameraDistance).bind(this));
		this.controlStores.cameraRotationCenter.subscribe((state)=>{
			this.cameraRotationCenter = state;
			this.updateCameraRotation();
		});
		this.controlStores.cameraFOV.subscribe((this.setCameraFOV).bind(this));
		this.controlStores.renderWidth.subscribe((this.setRenderWidth).bind(this));
		this.controlStores.pixelPerfect.subscribe((this.setPixelPerfect).bind(this))

		this.isLeftButtonDown = false;

		this.eventListeners = {
			mouseDown: (this.mouseDownEvent).bind(this),
			mouseMove: (this.mouseMoveEvent).bind(this),
			mouseUp: (this.mouseUpEvent).bind(this),
			wheel: (this.mouseWheelEvent).bind(this)
		};
	}

	setPixelPerfect(val){
		this.threeScene.setPixelPerfect(val);
	}

	mouseDownEvent(mouseEvent){
		if(mouseEvent.button == 0){
			this.isLeftButtonDown = true;
		}
	}
	mouseUpEvent(mouseEvent){
		if(mouseEvent.button == 0){
			this.isLeftButtonDown = false;
		}
	}

	mouseWheelEvent(wheelEvent){
		let direction = Math.sign(wheelEvent.deltaY);
		this.cameraDistance = this.cameraDistance * (1 + direction * 0.05);
		this.cameraDistance = this.cameraDistance < 1.1 ? 1.1 : this.cameraDistance;
		this.controlStores.cameraDistance.set(this.cameraDistance);
	}

	mouseMoveEvent(mouseEvent){
		if(this.isLeftButtonDown){
			let newVertical = this.verticalRotation + mouseEvent.movementY * 0.01;
			newVertical = newVertical > 3.14/2 ? 3.1399/2 : newVertical < -3.14/2 ? -3.1399/2 : newVertical;
			this.controlStores.cameraRotation.set({
				x: this.planarRotation - mouseEvent.movementX * 0.01,
				y: newVertical
			});
		}
	}

	addEventListeners(){
		this.threeScene.canvasElement.addEventListener("mousedown", this.eventListeners.mouseDown);
		this.threeScene.canvasElement.addEventListener("mousemove", this.eventListeners.mouseMove);
		this.threeScene.canvasElement.addEventListener("mouseup", this.eventListeners.mouseUp);
		this.threeScene.canvasElement.addEventListener("mouseleave", this.eventListeners.mouseUp);
		this.threeScene.canvasElement.addEventListener("wheel", this.eventListeners.wheel);
	}

	removeEventListeners(){
		this.threeScene.canvasElement.removeEventListener("mousedown", this.eventListeners.mouseDown);
		this.threeScene.canvasElement.removeEventListener("mousemove", this.eventListeners.mouseMove);
		this.threeScene.canvasElement.removeEventListener("mouseup", this.eventListeners.mouseUp);
		this.threeScene.canvasElement.removeEventListener("mouseleave", this.eventListeners.mouseUp);
		this.threeScene.canvasElement.removeEventListener("wheel", this.eventListeners.wheel);
	}

	updateCameraRotation(){
        let x = this.cameraDistance * Math.cos(this.verticalRotation) * Math.sin(this.planarRotation);
        let z = this.cameraDistance * Math.cos(this.verticalRotation) * Math.cos(this.planarRotation);
        let y = this.cameraDistance * Math.sin(this.verticalRotation);

        this.camera.position.x = x + this.cameraRotationCenter.x;
        this.camera.position.y = y + this.cameraRotationCenter.y;
        this.camera.position.z = z + this.cameraRotationCenter.z;
        //this.camera.position =
        this.camera.lookAt(this.cameraRotationCenter);
        this.camera.updateProjectionMatrix();
    }

	setRenderWidth(value){
        this.desiredWidth = value;
		this.resizeRenderer(this.desiredWidth, this.camera);
    }

    setCameraFOV(value){
        this.camera.fov = value;
        this.camera.updateProjectionMatrix();
    }

    setCameraDistance(value){
        this.cameraDistance = value;
        this.updateCameraRotation();
    }

	resizeRendererWH(resolution, camera){
        this.threeScene.renderer.setSize(resolution.x, resolution.y, false);
        this.camera.aspect = resolution.x / resolution.y;
        this.camera.updateProjectionMatrix();
    }

    resizeRenderer(desiredWidth, camera){
        let newWidth = desiredWidth;
        let newHeight = desiredWidth * (this.threeScene.canvasElement.clientHeight / this.threeScene.canvasElement.clientWidth);

        this.threeScene.renderer.setSize(newWidth, newHeight, false);
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
    }

    shouldResize(){
        let dWidth = this.desiredWidth;
        let dHeight = this.desiredWidth * (this.threeScene.canvasElement.clientHeight / this.threeScene.canvasElement.clientWidth);

        let rWidth = this.threeScene.canvasElement.width;
        let rHeight = this.threeScene.canvasElement.height;

        if(Math.abs(dWidth - rWidth) > 1 || Math.abs(dHeight - rHeight) > 1){
            return true;
        }
        return false;
    }
}