import * as THREE from 'three';
import ThreeScene from './ThreeScene';
import RaymarchingQuality from '../RaymarchingQuality';
import { writable, get} from "svelte/store";
import { Writable } from 'svelte/store';
import SceneCameraController from './SceneCameraController';
import CameraStores from './CameraStores';
import SceneBackground from './SceneBackground';

export default class PlanetEditor{
	enabled: boolean;
	threeScene: ThreeScene;

	planetMaterial: THREE.ShaderMaterial;
	planetGeometry: THREE.SphereGeometry;
	planetMesh: THREE.SphereGeometry;

	unsubscribeArray: Array<any>;
	scene: THREE.Scene;
	startTime: number;

	cameraControlStores: CameraStores;

	sceneCameraController: SceneCameraController;

	//This needs to be added to its own class
	gridMesh: THREE.Mesh;
	backgroundMesh: THREE.Mesh;
	sceneBackground: SceneBackground;

	constructor(threeScene){
		this.enabled = false;
		this.threeScene = threeScene;

		this.planetMaterial = threeScene.planetMaterial.clone();
		this.planetGeometry = new THREE.SphereGeometry(1, 24, 24);
		this.planetMesh = new THREE.Mesh( this.planetGeometry, this.planetMaterial );

		this.scene = new THREE.Scene();
		this.scene.add(this.planetMesh);

		this.unsubscribeArray = [];
		this.startTime = 0;

		this.cameraControlStores = {
			cameraRotation: writable(new THREE.Vector2(0,0)),
			cameraDistance: writable(4),
			cameraRotationCenter: writable(new THREE.Vector3(0,0,0)),
			cameraFOV: writable(75),
			renderWidth: writable(300),
			pixelPerfect: writable(true)
		};

		this.sceneCameraController = new SceneCameraController(threeScene, this.cameraControlStores);
		this.sceneBackground = new SceneBackground(threeScene, this.scene);
	}

	updateMaterialProp(propName, value){
		this.planetMaterial.uniforms[propName].value = value;
	}

	setPlanetQuality(value){
		if(value == RaymarchingQuality.low){
			this.planetMaterial.uniforms._PlanetSurfaceWaterStepSize.value = this.threeScene.lowFidelityParameters.PSW_StepSize;
			this.planetMaterial.uniforms._PlanetSurfaceWaterMaxStepCount.value = this.threeScene.lowFidelityParameters.PSW_MaxStepCount;
		}else if(value == RaymarchingQuality.medium){
			this.planetMaterial.uniforms._PlanetSurfaceWaterStepSize.value = this.threeScene.normalFidelityParameters.PSW_StepSize;
			this.planetMaterial.uniforms._PlanetSurfaceWaterMaxStepCount.value = this.threeScene.normalFidelityParameters.PSW_MaxStepCount;
		}else if(value == RaymarchingQuality.high){
			this.planetMaterial.uniforms._PlanetSurfaceWaterStepSize.value = this.threeScene.highFidelityParameters.PSW_StepSize;
			this.planetMaterial.uniforms._PlanetSurfaceWaterMaxStepCount.value = this.threeScene.highFidelityParameters.PSW_MaxStepCount;
		}
	}

	setCloudQuality(value){
		if(value == RaymarchingQuality.low){
			this.planetMaterial.uniforms._CloudsStepSize.value = this.threeScene.lowFidelityParameters.C_StepSize;
			this.planetMaterial.uniforms._CloudsMaxStepCount.value = this.threeScene.lowFidelityParameters.C_StepCount;
		}else if(value == RaymarchingQuality.medium){
			this.planetMaterial.uniforms._CloudsStepSize.value = this.threeScene.normalFidelityParameters.C_StepSize;
			this.planetMaterial.uniforms._CloudsMaxStepCount.value = this.threeScene.normalFidelityParameters.C_StepCount;
		}else if(value == RaymarchingQuality.high){
			this.planetMaterial.uniforms._CloudsStepSize.value = this.threeScene.highFidelityParameters.C_StepSize;
			this.planetMaterial.uniforms._CloudsMaxStepCount.value = this.threeScene.highFidelityParameters.C_StepCount;
		}
	}

	subscribeToStores(stores){
		this.startTime = (new Date()).getTime();
		this.enabled = true;
		this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
		this.sceneCameraController.addEventListeners();

		//console.log("uniforms", this.planetMaterial.uniforms);

		for (let i = 0; i < stores.editableObject.length; i++) {
			const oStore = stores.editableObject[i];
			//console.log(oStore.propType);
			if(oStore.propType.type == "uniform"){
				let unsubFunc = oStore.store.subscribe((state)=>{
					this.updateMaterialProp(oStore.propName, state);
				});
				this.unsubscribeArray.push(unsubFunc);
			}else if(oStore.propType.type == "function"){
				let unsubFunc = oStore.store.subscribe((state)=>{
					this[oStore.propType.func](state);
				});
				this.unsubscribeArray.push(unsubFunc);
			}
		}

		//this.threeScene.renderer.render( this.scene, this.camera );
		this.animate();
	}

	unsubscribeFromStores(){
		this.enabled = false;
		this.sceneCameraController.removeEventListeners();

		while(this.unsubscribeArray.length > 0){
			let unsub = this.unsubscribeArray.pop();
			unsub();
		}
	}

	generateControlStores(){
		return this.cameraControlStores;
	}

	animate(){
		if(this.enabled){
			requestAnimationFrame( (this.animate).bind(this) );
		}
        if(this.sceneCameraController.shouldResize()){
            this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
        }

		let currentTime = ((new Date()).getTime() - this.startTime) / 1000;

		this.sceneBackground.animate(currentTime);
        this.planetMaterial.uniforms.iTime.value = currentTime;

        this.threeScene.renderer.render( this.scene, this.sceneCameraController.camera );
	}
}