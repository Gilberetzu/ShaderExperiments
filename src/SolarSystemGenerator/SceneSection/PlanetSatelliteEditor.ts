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
import OrbitController from "./OrbitController";

export let loadMaterialProperties = (material: THREE.Material, planet: ProceduralPlanet) => {
	let planetProperties = Object.keys(planet);
	planetProperties.forEach(prop => {
		let uni = material.uniforms[prop];
		if (uni != null && uni != undefined) {
			uni.value = planet[prop];
		}
	});
	window.threeScene.sceneManager.setPlanetQuality(RaymarchingQuality.medium, material);
	window.threeScene.sceneManager.setCloudQuality(RaymarchingQuality.medium, material);
	//The fidelity of the planet needs to be set in a different way
}

type SatelliteData = {
	id: number,
	planetId: number,
	mesh: THREE.Mesh,

	orbitController: OrbitController

	rotationData: {
		rotationAxis: THREE.Vector3,
		rotationSpeed: number
	}

	planetIdStore: Writable<number>,

	orbitStartStore: Writable<number>,
	orbitElipseStore: Writable<THREE.Vector2>,
	orbitRotationStore: Writable<THREE.Vector2>,
	orbitCenterStore: Writable<THREE.Vector3>,
	orbitSpeedStore: Writable<number>,

	rotationAxisStore: Writable<THREE.Vector2>,
	rotationSpeedStore: Writable<number>,

	scaleStore: Writable<number>,

	currentOrbit: number,
	currentRotation: number,
}

type UnsubCollection = {
	satelliteId: number,
	unsubArray: Array<()=>void>
}

export default class PlanetSatelliteEditor {
	threeScene: ThreeScene;
	enabled: boolean;

	cameraControlStores: CameraStores;

	camera: THREE.Camera;
	scene: THREE.Scene;

	planetGeometry: THREE.SphereGeometry;
	unsubscribeArray: Array<UnsubCollection>;
	
	startTime: number;
	lastFrameTime: number;

	mainPlanetIdStore: Writable<number>;
	planetWSatelliteNameStore: Writable<string>;

	mainPlanetMesh: THREE.Mesh;
	satelliteCollection: Array<SatelliteData>;
	sceneCameraController: SceneCameraController;

	currentObjectId: number;
	currentObjectName: string;

	sceneBackground: SceneBackground;

	showPlanetsPath: Writable<boolean>;

	planetsRaymarchQualityStore: Writable<number>;
	cloudsRaymarchQualityStore: Writable<number>;

	constructor(threeScene) {
		this.enabled = false;
		this.threeScene = threeScene;

		this.showPlanetsPath = writable(false);
		this.mainPlanetIdStore = writable(-1);
		this.planetWSatelliteNameStore = writable("");

		this.satelliteCollection = [];
		this.unsubscribeArray = [];

		this.currentObjectId = -1;
		this.currentObjectName ="";

		this.planetGeometry = new THREE.SphereGeometry(1, 24, 24);
		this.mainPlanetMesh = null;
		this.scene = new THREE.Scene();
		this.startTime = 0;

		this.cameraControlStores = {
			cameraRotation: writable(new THREE.Vector2(0, 0)),
			cameraDistance: writable(1.2),
			cameraRotationCenter: writable(new THREE.Vector3(0, 0, 0)),
			cameraFOV: writable(75),
			renderWidth: writable(300),
			pixelPerfect: writable(true)
		};

		this.planetWSatelliteNameStore.subscribe((name)=>{
			this.currentObjectName = name;
		})

		this.mainPlanetIdStore.subscribe((state)=>{
			if(state >= 0){
				let planetData = get(ObjectsStore).planets.find(planet => planet.id == state);
				if(planetData != null && planetData != undefined){
					let pData = planetData.object;
					if(this.mainPlanetMesh == null){
						let planetMat = this.threeScene.planetMaterial.clone();
						loadMaterialProperties(planetMat, pData);
						this.mainPlanetMesh = new THREE.Mesh(this.planetGeometry, planetMat);
						this.setAllPlanetsQualitiesFromStore();
						this.scene.add(this.mainPlanetMesh);
					}else{
						loadMaterialProperties(this.mainPlanetMesh.material, pData);
						this.setAllPlanetsQualitiesFromStore();
					}
				}
			}else{
				if(this.mainPlanetMesh != null && this.mainPlanetMesh != undefined){
					this.scene.remove(this.mainPlanetMesh);
					this.mainPlanetMesh.material.dispose();
					this.mainPlanetMesh = null;
				}
			}
		});

		this.sceneCameraController = new SceneCameraController(threeScene, this.cameraControlStores, this.scene);
		this.sceneBackground = new SceneBackground(threeScene, this.scene);
		
		this.planetsRaymarchQualityStore = writable(1);
		this.planetsRaymarchQualityStore.subscribe(setting => {
			if(this.mainPlanetMesh){
				this.threeScene.setPlanetQuality(setting, this.mainPlanetMesh.material);
			}
			if(this.satelliteCollection.length > 0){
				this.satelliteCollection.forEach(Satellite => {
					this.threeScene.setPlanetQuality(setting, Satellite.mesh.material);
				})
			}
		});

		this.cloudsRaymarchQualityStore = writable(1);
		this.cloudsRaymarchQualityStore.subscribe(setting => {
			if(this.mainPlanetMesh){
				this.threeScene.setCloudQuality(setting, this.mainPlanetMesh.material);
			}
			if(this.satelliteCollection.length > 0){
				this.satelliteCollection.forEach(Satellite => {
					this.threeScene.setCloudQuality(setting, Satellite.mesh.material);
				})
			}
		});

	}

	setAllPlanetsQualitiesFromStore(){
		let pQuality = get(this.planetsRaymarchQualityStore);
		let cQuality = get(this.cloudsRaymarchQualityStore);
		this.setAllPlanetsQualities(pQuality, cQuality);
	}

	setAllPlanetsQualities(planetQuality, cloudQuality){
		if(this.mainPlanetMesh){
			this.threeScene.setPlanetQuality(planetQuality, this.mainPlanetMesh.material);
			this.threeScene.setCloudQuality(cloudQuality, this.mainPlanetMesh.material);
		}
		if(this.satelliteCollection.length > 0){
			this.satelliteCollection.forEach(Satellite => {
				this.threeScene.setPlanetQuality(planetQuality, Satellite.mesh.material);
				this.threeScene.setCloudQuality(cloudQuality, Satellite.mesh.material);
			})
		}
	}

	createMaterialFromProcPlanet(planet: ProceduralPlanet) {
		let clonedMat = this.threeScene.planetMaterial.clone();
		loadMaterialProperties(clonedMat, planet);
		return clonedMat;
	}

	startSystem(planetWSatelliteId: number){
		this.startTime = (new Date()).getTime();
		this.lastFrameTime = this.startTime;
		this.enabled = true;
		let planetWSatellite = get(ObjectsStore).combinedPlanets.find(ps => ps.id == planetWSatelliteId);
		this.currentObjectId = planetWSatellite.id;
		this.loadPlanetWSatellite(planetWSatellite.object);
		this.sceneCameraController.addEventListeners();

		let pQuality = get(this.planetsRaymarchQualityStore);
		let cQuality = get(this.cloudsRaymarchQualityStore);
		this.setAllPlanetsQualities(pQuality, cQuality);
		this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
		this.animate();
	}

	stopSystem(){
		this.enabled = false;
		//Serialize datat and dispose of everything

		let savePlanetWSatellite = new PlanetSatellite(this.currentObjectName);
		savePlanetWSatellite.mainPlanetId = get(this.mainPlanetIdStore);
		savePlanetWSatellite.name = this.currentObjectName;

		savePlanetWSatellite.satelites = this.satelliteCollection.map(satellite => {
			let newSatellite = new Satellite(satellite.planetId);

			newSatellite.orbitCenter = satellite.orbitController.center;
			newSatellite.orbitElipse = satellite.orbitController.ellipse;
			newSatellite.orbitRotation = satellite.orbitController.rotation;
			newSatellite.orbitSpeed = satellite.orbitController.speed;
			newSatellite.orbitStart = satellite.orbitController.startParam;

			newSatellite.rotationAxis = satellite.rotationData.rotationAxis;
			newSatellite.rotationSpeed = satellite.rotationData.rotationSpeed;

			newSatellite.scale = get(satellite.scaleStore);
			return newSatellite;
		});

		ObjectsStore.updateObject({
			id: this.currentObjectId,
			object: savePlanetWSatellite
		}, "combinedPlanets", this.currentObjectId);

		while(this.satelliteCollection.length > 0){
			let satData = this.satelliteCollection.pop();
			satData.orbitController.hideEllipse();
			this.scene.remove(satData.mesh);
			satData.mesh.material.dispose();
		}
		while(this.unsubscribeArray.length > 0){
			let unsub = this.unsubscribeArray.pop();
			unsub.unsubArray.forEach(unsub=>{
				unsub();
			})
		}
		this.sceneCameraController.removeEventListeners();
	}

	loadPlanetWSatellite(planetWSatellite: PlanetSatellite) {
		let planetList = get(ObjectsStore).planets;

		this.planetWSatelliteNameStore.set(planetWSatellite.name);
	
		this.mainPlanetIdStore.set(-1);
		if (planetWSatellite.mainPlanetId >= 0) {
			this.mainPlanetIdStore.set(planetWSatellite.mainPlanetId);
		}


		planetWSatellite.satelites.forEach((satellite, index) => {
			let satellitePlanet = planetList.find(planet => planet.id == satellite.planetId);
			if (satellitePlanet != null && satellitePlanet != undefined) {
				this.addSatellite(satellite, satellitePlanet.object, index);
			}
		});
	}

	createSatellite(planetId) {
		let objects = get(ObjectsStore);
		let planetList = objects.planets;
		let satellitePlanet = planetList.find(planet => planet.id == planetId);
		if (satellitePlanet != null && satellitePlanet != undefined) {
			let satellite = new Satellite(planetId);
			let satIndex = this.satelliteCollection.length <= 0 ? 0 : this.satelliteCollection[this.satelliteCollection.length - 1].id + 1;
			this.satelliteCollection.forEach(satellite => {
				satellite.currentOrbit = 0;
			})
			this.addSatellite(satellite, satellitePlanet.object, satIndex);

			let pQuality = get(this.planetsRaymarchQualityStore);
			let cQuality = get(this.cloudsRaymarchQualityStore);
			this.setAllPlanetsQualities(pQuality, cQuality);
		}
	}

	deleteSatellite(satelliteId) {
		let satUnsubCollection = this.unsubscribeArray.find(arr => arr.satelliteId == satelliteId);
		satUnsubCollection.unsubArray.forEach(unsub => {unsub()});
		this.unsubscribeArray = this.unsubscribeArray.filter(arr => arr.satelliteId != satelliteId);
		let satelliteToRemove = this.satelliteCollection.find(sat => sat.id == satelliteId);
		this.scene.remove(satelliteToRemove.mesh);
		this.satelliteCollection = this.satelliteCollection.filter(sat => sat.id != satelliteId);
	}

	addSatellite(satellite, satellitePlanet, index) {
		let satelliteMat = this.createMaterialFromProcPlanet(satellitePlanet);

		let newOrbitController = new OrbitController(satellite.orbitStart, satellite.orbitElipse, satellite.orbitRotation, 
			satellite.orbitCenter, satellite.orbitSpeed, this.scene);

		let data: SatelliteData = {
			id: index,
			planetId: satellite.planetId,

			orbitController: newOrbitController,

			rotationData: {
				rotationAxis: satellite.rotationAxis,
				rotationSpeed: satellite.rotationSpeed
			},
			mesh: new THREE.Mesh(this.planetGeometry.clone(), satelliteMat),

			planetIdStore: writable(satellite.planetId),

			orbitCenterStore: writable(satellite.orbitCenter),
			orbitElipseStore: writable(satellite.orbitElipse),
			orbitRotationStore: writable(satellite.orbitRotation),
			orbitSpeedStore: writable(satellite.orbitSpeed),
			orbitStartStore: writable(satellite.orbitStart),

			rotationAxisStore: writable(satellite.rotationAxis),
			rotationSpeedStore: writable(satellite.rotationSpeed),

			scaleStore: writable(satellite.scale),

			currentOrbit: satellite.orbitStart,
			currentRotation: 0,
		}

		let unsubSatellite:UnsubCollection = {
			satelliteId : index,
			unsubArray: []
		};

		unsubSatellite.unsubArray.push(this.showPlanetsPath.subscribe((show) => {
			if(show){
				data.orbitController.showEllipse();
			}else{
				data.orbitController.hideEllipse();
			}
		}));

		//Planet id change - material parameter load from planet
		unsubSatellite.unsubArray.push(data.planetIdStore.subscribe((state) => {
			data.planetId = state;
			let planetData = get(ObjectsStore).planets.find(planet => planet.id == data.planetId);
			if (planetData == null || planetData == undefined) console.error("There is no planet with that id");
			loadMaterialProperties(data.mesh.material, planetData.object);
		}));

		//Orbit parameter stores
		unsubSatellite.unsubArray.push(data.orbitCenterStore.subscribe((state) => {
			data.orbitController.center = state;

			//REMOVE FROM HERE
			data.orbitController.updateLineLoop();
		}));
		unsubSatellite.unsubArray.push(data.orbitElipseStore.subscribe((state) => {
			data.orbitController.ellipse = state;
			data.orbitController.computeMovementTable();
			
			//REMOVE FROM HERE
			data.orbitController.updateLineLoop();
		}));
		unsubSatellite.unsubArray.push(data.orbitRotationStore.subscribe((state) => {
			data.orbitController.rotation = state;
			
			//REMOVE FROM HERE
			data.orbitController.updateLineLoop();
		}));
		unsubSatellite.unsubArray.push(data.orbitSpeedStore.subscribe((state) => {
			data.orbitController.speed = state;
		}));
		unsubSatellite.unsubArray.push(data.orbitStartStore.subscribe((state) => {
			data.orbitController.startParam = state;
		}));

		//Rotation parameter stores
		unsubSatellite.unsubArray.push(data.rotationAxisStore.subscribe((state) => {
			data.rotationData.rotationAxis = state;
		}));
		unsubSatellite.unsubArray.push(data.rotationAxisStore.subscribe((state) => {
			data.rotationData.rotationSpeed = state;
		}));

		//Scale store
		unsubSatellite.unsubArray.push(data.scaleStore.subscribe((state) => {
			data.mesh.scale.x = state;
			data.mesh.scale.y = state;
			data.mesh.scale.z = state;
		}));

		this.unsubscribeArray.push(unsubSatellite);

		this.scene.add(data.mesh);

		this.satelliteCollection.push(data);
	}

	animateSatellites(deltaTime:number){
		this.satelliteCollection.forEach((satellite,index) => {
			let pos3d = satellite.orbitController.computeOrbit(deltaTime);
			satellite.mesh.position.x = pos3d.x;
			satellite.mesh.position.y = pos3d.y;
			satellite.mesh.position.z = pos3d.z;
		})
	}

	animate() {
		if (this.enabled) {
			requestAnimationFrame((this.animate).bind(this));
		}else{
			return;
		}
		if (this.sceneCameraController.shouldResize()) {
			this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
		}

		let currentTime = ((new Date()).getTime() - this.startTime) / 1000;

		this.animateSatellites(currentTime - this.lastFrameTime);

		if (this.mainPlanetMesh != null) {
			this.mainPlanetMesh.material.uniforms.iTime.value = currentTime;
		}
		this.satelliteCollection.forEach(data => {
			data.mesh.material.uniforms.iTime.value = currentTime;
		});

		this.sceneBackground.animate(currentTime);

		this.lastFrameTime = currentTime;
		this.threeScene.renderer.render(this.scene, this.sceneCameraController.camera);
	}
}