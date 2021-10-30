import { Writable } from 'svelte/store';
import * as THREE from 'three';
import Background from '../Background';
import ObjectsStore from '../ObjectsStore';
import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import ThreeScene from './ThreeScene';
import SceneCameraController from './SceneCameraController';
import CameraStores from './CameraStores';

type BackgroundStores = {
	nameStore: Writable<string>,
	color0Store: Writable<THREE.Color>,
	color1Store: Writable<THREE.Color>,
	color2Store: Writable<THREE.Color>,

	colorStarStore: Writable<THREE.Color>,
	noiseStarScaleStore: Writable<number>,
	noiseStarMaskSpeedStore: Writable<number>,

	noise1ScaleStore: Writable<Number>,
	noise1MultStore: Writable<Number>,
	noise1ScrewStore: Writable<Number>,
	noise1SpeedStore: Writable<Number>,

	noise2ScaleStore: Writable<Number>,
	noise2MultStore: Writable<Number>,
	noise2ScrewStore: Writable<Number>,
	noise2SpeedStore: Writable<Number>,

	mainNoiseScaleStore: Writable<Number>,
	mainNoiseScrewStore: Writable<Number>,

	noiseMaskSmoothStepStore: Writable<THREE.Vector2>,
	noiseMaskScaleStore: Writable<number>,
	noiseMaskOffsetStore: Writable<THREE.Vector3>,

	noiseStarSmoothStepStore: Writable<THREE.Vector2>,

	rayStepSizeStore: Writable<Number>,
	densityMultStore: Writable<Number>,
};

export default class BackgroundEditor {
	selectedBackground: Background;
	selectedBackgroundId: number;
	editorStores: BackgroundStores;
	unsubscribeArray: Array<any>;
	enabled: boolean;
	startTime: number;
	threeScene: ThreeScene;

	backgroundMaterial: THREE.Material;
	backgroundGeometry: THREE.SphereGeometry;
	backgroundMesh: THREE.Mesh;
	scene: THREE.Scene;
	sceneCameraController: SceneCameraController;

	cameraControlStores: CameraStores;

	constructor(threeScene) {

		this.threeScene = threeScene;

		this.enabled = false;
		this.selectedBackground = null;
		this.editorStores = null;
		this.unsubscribeArray = [];

		this.scene = new THREE.Scene();

		this.backgroundMaterial = this.threeScene.backgroundMaterial.clone();
		this.backgroundGeometry = new THREE.SphereGeometry(80, 24, 24);

		this.backgroundMesh = new THREE.Mesh(this.backgroundGeometry, this.backgroundMaterial);
		this.scene.add(this.backgroundMesh);

		this.cameraControlStores = {
			cameraRotation: writable(new THREE.Vector2(0, 0)),
			cameraDistance: writable(1.2),
			cameraRotationCenter: writable(new THREE.Vector3(0, 0, 0)),
			cameraFOV: writable(75),
			renderWidth: writable(300),
			pixelPerfect: writable(true)
		};

		this.sceneCameraController = new SceneCameraController(threeScene, this.cameraControlStores, this.scene);
	}

	startSystem(backgroundId: number) {
		let storeObject = get(ObjectsStore).backgrounds.find(bg => bg.id == backgroundId);
		if (storeObject == null || storeObject == undefined) {
			console.error("Selected object is not a background");
			return;
		} else {
			this.startTime = (new Date()).getTime();
			this.selectedBackground = storeObject.object;
			this.selectedBackgroundId = storeObject.id;
			//Create stores
			this.editorStores = {
				nameStore: writable(this.selectedBackground.name),
				color0Store: writable(this.selectedBackground.color0),
				color1Store: writable(this.selectedBackground.color1),
				color2Store: writable(this.selectedBackground.color2),

				colorStarStore: writable(this.selectedBackground.colorStars),
				noiseStarScaleStore: writable(this.selectedBackground.noiseStarScale),
				noiseStarMaskSpeedStore: writable(this.selectedBackground.noiseStarMaskSpeed),

				densityMultStore: writable(this.selectedBackground.densityMult),

				mainNoiseScaleStore: writable(this.selectedBackground.mainNoiseScale),
				mainNoiseScrewStore: writable(this.selectedBackground.mainNoiseScrew),

				noise1MultStore: writable(this.selectedBackground.noise1.mult),
				noise1ScaleStore: writable(this.selectedBackground.noise1.scale),
				noise1ScrewStore: writable(this.selectedBackground.noise1.screw),
				noise1SpeedStore: writable(this.selectedBackground.noise1.speed),

				noise2MultStore: writable(this.selectedBackground.noise2.mult),
				noise2ScaleStore: writable(this.selectedBackground.noise2.scale),
				noise2ScrewStore: writable(this.selectedBackground.noise2.screw),
				noise2SpeedStore: writable(this.selectedBackground.noise2.speed),

				noiseMaskSmoothStepStore: writable(this.selectedBackground.noiseMaskSmoothStep),
				noiseMaskScaleStore: writable(this.selectedBackground.noiseMaskScale),
				noiseMaskOffsetStore: writable(this.selectedBackground.noiseMaskOffset),

				noiseStarSmoothStepStore: writable(this.selectedBackground.noiseStarSmoothStep),
				rayStepSizeStore: writable(this.selectedBackground.stepSize)
			}

			let subscribeToStore = (storeName, propName) => {
				return this.editorStores[storeName].subscribe(
					((value) => {
						this.selectedBackground[propName] = value;
						this.backgroundMesh.material.uniforms[`_${propName}`].value = value;
					}).bind(this)
				)
			}

			let subscribeToStoreInner = (storeName, prop, propIn, uni) => {
				return this.editorStores[storeName].subscribe(
					((value) => {
						this.selectedBackground[prop][propIn] = value;
						this.backgroundMesh.material.uniforms[uni].value = value;
					}).bind(this)
				)
			}

			this.unsubscribeArray.push(subscribeToStore("color0Store", "color0"));
			this.unsubscribeArray.push(subscribeToStore("color1Store", "color1"));
			this.unsubscribeArray.push(subscribeToStore("color2Store", "color2"));

			this.unsubscribeArray.push(subscribeToStore("colorStarStore", "colorStars"));
			this.unsubscribeArray.push(subscribeToStore("noiseStarScaleStore", "noiseStarScale"));
			this.unsubscribeArray.push(subscribeToStore("noiseStarMaskSpeedStore", "noiseStarMaskSpeed"));

			this.unsubscribeArray.push(subscribeToStore("rayStepSizeStore", "stepSize"));

			this.unsubscribeArray.push(subscribeToStore("mainNoiseScaleStore", "mainNoiseScale"));
			this.unsubscribeArray.push(subscribeToStore("mainNoiseScrewStore", "mainNoiseScrew"));

			this.unsubscribeArray.push(subscribeToStore("densityMultStore", "densityMult"));
			this.unsubscribeArray.push(subscribeToStore("noiseStarSmoothStepStore", "noiseStarSmoothStep"));

			this.unsubscribeArray.push(subscribeToStore("noiseMaskSmoothStepStore", "noiseMaskSmoothStep"));
			this.unsubscribeArray.push(subscribeToStore("noiseMaskScaleStore", "noiseMaskScale"));
			this.unsubscribeArray.push(subscribeToStore("noiseMaskOffsetStore", "noiseMaskOffset"));

			this.unsubscribeArray.push(
				subscribeToStoreInner("noise1MultStore", "noise1", "mult", "_noise1Mult"));
			this.unsubscribeArray.push(
				subscribeToStoreInner("noise1ScaleStore", "noise1", "scale", "_noise1Scale"));
			this.unsubscribeArray.push(
				subscribeToStoreInner("noise1ScrewStore", "noise1", "screw", "_noise1Screw"));
			this.unsubscribeArray.push(
				subscribeToStoreInner("noise1SpeedStore", "noise1", "speed", "_noise1Speed"));

			this.unsubscribeArray.push(
				subscribeToStoreInner("noise2MultStore", "noise2", "mult", "_noise2Mult"));
			this.unsubscribeArray.push(
				subscribeToStoreInner("noise2ScaleStore", "noise2", "scale", "_noise2Scale"));
			this.unsubscribeArray.push(
				subscribeToStoreInner("noise2ScrewStore", "noise2", "screw", "_noise2Screw"));
			this.unsubscribeArray.push(
				subscribeToStoreInner("noise2SpeedStore", "noise2", "speed", "_noise2Speed"));

			this.enabled = true;
			this.sceneCameraController.addEventListeners();
			this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
			this.animate();
		}
	}

	stopSystem() {
		this.enabled = false;
		this.sceneCameraController.removeEventListeners();
		ObjectsStore.updateObject({
			id: this.selectedBackgroundId,
			object: this.selectedBackground
		}, "backgrounds", this.selectedBackgroundId);

		while (this.unsubscribeArray.length > 0) {
			let unsub = this.unsubscribeArray.pop();
			unsub();
		}
	}

	animate() {
		if (this.enabled) {
			requestAnimationFrame((this.animate).bind(this));
		}
		if (this.sceneCameraController.shouldResize()) {
			this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
		}

		let currentTime = ((new Date()).getTime() - this.startTime) / 1000;
		
		this.backgroundMesh.material.uniforms._iTime.value = currentTime;

		//This part needs to be on the scene background manager class
		let camPos = this.sceneCameraController.camera.position;
		this.backgroundMesh.position.set(camPos.x, camPos.y, camPos.z);
		//end

		this.threeScene.renderer.render(this.scene, this.sceneCameraController.camera);
	}
}