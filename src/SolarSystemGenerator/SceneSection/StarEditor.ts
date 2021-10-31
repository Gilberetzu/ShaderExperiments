import * as THREE from 'three';
import ThreeScene from './ThreeScene';
import RaymarchingQuality from '../RaymarchingQuality';
import { writable, get} from "svelte/store";
import { Writable } from 'svelte/store';
import SceneCameraController from './SceneCameraController';
import CameraStores from './CameraStores';
import SceneBackground from "./SceneBackground";
import ObjectsStore from '../ObjectsStore';
import ProceduralStar from '../ProceduralStar';

export default class StarEditor{
	enabled: boolean;
	startTime: number;

	threeScene: ThreeScene;
	scene: THREE.Scene;

	starMesh: THREE.Mesh;
	cameraControlStores: CameraStores;
	sceneCameraController: SceneCameraController;
	sceneBackground: SceneBackground;

	editorStores;

	selectedStarId;
	selectedStarObj: ProceduralStar;

	unsubscribeArray: Array<()=>void>;

	constructor(threeScene: ThreeScene){
		this.enabled = false;
		this.startTime = 0;

		this.threeScene = threeScene;
		this.scene = new THREE.Scene;

		let starMaterial = threeScene.starMaterial.clone();
		let starGeometry = new THREE.SphereGeometry(1, 24, 24);

		this.starMesh = new THREE.Mesh(starGeometry, starMaterial);
		this.scene.add(this.starMesh);

		this.cameraControlStores = {
			cameraRotation: writable(new THREE.Vector2(0,0)),
			cameraDistance: writable(1.4),
			cameraRotationCenter: writable(new THREE.Vector3(0,0,0)),
			cameraFOV: writable(75),
			renderWidth: writable(300),
			pixelPerfect: writable(true)
		};

		this.selectedStarId = -1;
		this.selectedStarObj = null;

		this.sceneCameraController = new SceneCameraController(threeScene, this.cameraControlStores, this.scene);
		this.sceneBackground = new SceneBackground(threeScene, this.scene);

		this.editorStores = null;
		this.unsubscribeArray = [];
	}

	startSystem(starId: number){
		let starObj = get(ObjectsStore).stars.find(star => star.id == starId);
		if(starObj != undefined && starObj != null){
			this.enabled = true;
			this.startTime = (new Date()).getTime();

			this.selectedStarId = starId;
			this.selectedStarObj = starObj.object;

			this.editorStores = {
				nameStore: writable(this.selectedStarObj.name),
				heightMaskInvLerpStore: writable(this.selectedStarObj.heightMaskInvLerp),
				heightMaskStore: writable(this.selectedStarObj.heightMask),
				
				expansionSpeedStore: writable(this.selectedStarObj.expansionSpeed),
				expansionScaleStore: writable(this.selectedStarObj.expansionScale),
				expansionScaleHeightOffsetStore: writable(this.selectedStarObj.expansionScaleHeightOffset),
				expansionDistanceStore: writable(this.selectedStarObj.expansionDistance),

				screwHeightMaskMultiplierStore: writable(this.selectedStarObj.screwHeightMaskMultiplier),
				screwInterpMultiplierStore: writable(this.selectedStarObj.screwInterpMultiplier),
				screwMultiplierStore: writable(this.selectedStarObj.screwMultiplier),

				voronoiScaleStore: writable(this.selectedStarObj.voronoiScale),
				noiseSample2ScaleStore: writable(this.selectedStarObj.noiseSample2Scale),

				fresnelPowerStore: writable(this.selectedStarObj.fresnelPower),
				fresnelRemapStore: writable(this.selectedStarObj.fresnelRemap),

				color1Store: writable(this.selectedStarObj.color1), //added
				color2Store: writable(this.selectedStarObj.color2), //added

				radiusStore: writable(this.selectedStarObj.radius),

				densityMultiplierStore: writable(this.selectedStarObj.densityMultiplier),

				fireRemapMaxStore: writable(this.selectedStarObj.fireRemapMax),
				fireColorStore: writable(this.selectedStarObj.fireColor), //added
				
				outerLightPowerStore: writable(this.selectedStarObj.outerLightPower),
				outerColorStore: writable(this.selectedStarObj.outerColor) //added
			}

			let subscribeToStore = (propName) => {
				let unsub = this.editorStores[`${propName}Store`].subscribe(
					((value) => {
						this.selectedStarObj[propName] = value;
						this.starMesh.material.uniforms[`_${propName}`].value = value;
					}).bind(this)
				);
				this.unsubscribeArray.push(unsub);
			}

			this.unsubscribeArray.push(this.editorStores["nameStore"].subscribe(
				((value) => {
					this.selectedStarObj.name = value;
					ObjectsStore.updateObjectName(value, "stars", this.selectedStarId);
				}).bind(this)
			));

			subscribeToStore("heightMaskInvLerp");
			subscribeToStore("heightMask");

			subscribeToStore("expansionSpeed");
			subscribeToStore("expansionScale");
			subscribeToStore("expansionScaleHeightOffset");
			subscribeToStore("expansionDistance");

			subscribeToStore("screwHeightMaskMultiplier");
			subscribeToStore("screwInterpMultiplier");
			subscribeToStore("screwMultiplier");

			subscribeToStore("voronoiScale");
			subscribeToStore("noiseSample2Scale");

			subscribeToStore("fresnelPower");
			subscribeToStore("fresnelRemap");

			subscribeToStore("color1");
			subscribeToStore("color2");

			subscribeToStore("radius");

			subscribeToStore("densityMultiplier");

			subscribeToStore("fireRemapMax");
			subscribeToStore("fireColor");

			subscribeToStore("outerLightPower");
			subscribeToStore("outerColor");

			this.sceneCameraController.addEventListeners();
			this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
			this.animate();
		}
	}

	stopSystem(){
		if(this.enabled == true){
			//Save object
			ObjectsStore.updateObject({
				id: this.selectedStarId,
				object: this.selectedStarObj
			}, "stars", 0.0);
		}
		this.enabled = false;
		this.sceneCameraController.removeEventListeners();

		while(this.unsubscribeArray.length > 0){
			let unsub = this.unsubscribeArray.pop();
			unsub();
		}
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
        this.starMesh.material.uniforms._iTime.value = currentTime;

        this.threeScene.renderer.render( this.scene, this.sceneCameraController.camera );
	}
}