import * as THREE from 'three';
import ThreeScene from './ThreeScene';
import RaymarchingQuality from '../RaymarchingQuality';
import { writable, get } from "svelte/store";
import { Writable } from 'svelte/store';
import SceneCameraController from './SceneCameraController';
import PlanetSatellite, { Satellite } from "../PlanetSatellite";
import ProceduralPlanet from '../ProceduralPlanet';
import ObjectsStore from "../ObjectsStore";
import CameraStores from './CameraStores';
import SceneBackground from './SceneBackground';
import PlanetarySystem from "../PlanetarySystem";

export default class PlanetarySystemEditor{
	cameraControlStores: CameraStores;
	sceneCameraController: SceneCameraController;
	sceneBackground: SceneBackground;

	scene:THREE.Scene;

	selectedPSId: number;
	selectedPSObject: PlanetarySystem;

	starMesh: THREE.Mesh;

	planetarySystemName: Writable<string>;
	selectedStar: Writable<number>;
	starScale: Writable<number>;

	starAdded: boolean;

	editorStores;

	constructor(threeScene){
		this.cameraControlStores = {
			cameraRotation: writable(new THREE.Vector2(0, 0)),
			cameraDistance: writable(1.2),
			cameraRotationCenter: writable(new THREE.Vector3(0, 0, 0)),
			cameraFOV: writable(75),
			renderWidth: writable(300),
			pixelPerfect: writable(true)
		};

		this.scene = new THREE.Scene();

		this.sceneCameraController = new SceneCameraController(threeScene, this.cameraControlStores);
		this.sceneBackground = new SceneBackground(threeScene, this.scene);

		let starMaterial = threeScene.starMaterial.clone();
		let starGeometry = new THREE.SphereGeometry(1, 24, 24);

		this.starMesh = new THREE.Mesh(starGeometry, starMaterial);
		this.selectedStar = writable(-1);
		this.starScale = writable(1.0);

		this.starAdded = false;

		this.selectedStar.subscribe((starId) => {
			if(starId >= 0){
				let starObj = get(ObjectsStore).stars.find(star => star.id == starId);
				if(starObj != null && starObj != undefined){
					let obj = starObj.object;
					Object.keys(obj).find(key => {
						if(key != "name"){
							this.starMesh.material.uniforms[`_${key}`].value = obj[key];
						}
					})
				}

				if(!this.starAdded){
					this.starAdded = true;
					this.scene.add(this.starMesh);
				}
			}
		});

		this.starScale.subscribe((scale)=>{
			this.starMesh.scale.set(scale, scale, scale);
		});
	}

	startSystem(planetarySystemId: number){
		let psObj = get(ObjectsStore).planetarySystems.find(ps => ps.id == planetarySystemId);
		if(psObj != undefined && psObj != null){
			this.selectedPSId = psObj.id;
			this.selectedPSObject = psObj.object;

			this.selectedPSObject.
		}
	}
}