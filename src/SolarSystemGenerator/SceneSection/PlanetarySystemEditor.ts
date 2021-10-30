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
import { PlanetPS } from '../PlanetarySystem';
import OrbitController from './OrbitController';

import {loadMaterialProperties} from "./PlanetSatelliteEditor";

export class ManagedPlanetStore{
	orbitCenterStore: Writable<THREE.Vector3>;
	orbitElipseStore: Writable<THREE.Vector2>;
	orbitRotationStore: Writable<THREE.Vector2>;
	orbitSpeedStore: Writable<number>;
	orbitStartStore: Writable<number>;

	//rotationAxisStore: writable(ps.rotationAxis),
	//rotationSpeedStore: writable(ps.rotationSpeed),

	scaleStore: Writable<number>;

	unsubscribe: Array<()=>void>;
	constructor(center, ellipse, rotation, speed, start, scale){
		this.orbitCenterStore = writable(center);
		this.orbitElipseStore = writable(ellipse);
		this.orbitRotationStore = writable(rotation);
		this.orbitSpeedStore = writable(speed);
		this.orbitStartStore = writable(start);

		this.scaleStore = writable(scale);
		this.unsubscribe = [];
	}
}

export class ManagedPlanet{
	planetPS: PlanetPS;
	planetGeometry: THREE.SphereGeometry;

	mainOrbitController: OrbitController;

	mainPlanet: THREE.Mesh;
	satellites: Array<{
		mesh: THREE.Mesh;
		orbitController: OrbitController
	}>;

	systemHolder: THREE.Object3D; //This object holds the main planet and its satellites
	constructor(planetPs:PlanetPS, planetMaterial, scene:THREE.Scene){
		this.planetPS = planetPs;
		this.satellites = [];
		let oStores = get(ObjectsStore);
		
		let planet = oStores.combinedPlanets.find(planet => planet.id == this.planetPS.planetSatelliteId);
		if(planet == null || planet == undefined){
			planet = oStores.planets.find(planet => planet.id == this.planetPS.planetSatelliteId);
			if(planet == null || planet == undefined){
				console.error("Planet or Planet with satellite not found");
				throw new Error("Planet not found");
			}
		}
		let planetGeometry = new THREE.SphereGeometry(1, 24, 24);
		this.systemHolder = new THREE.Object3D();
		this.systemHolder.scale.set(this.planetPS.scale, this.planetPS.scale, this.planetPS.scale);
		scene.add(this.systemHolder);
		//Clone the planet material for each planet and satellite

		this.mainOrbitController = new OrbitController(this.planetPS.orbitStart, this.planetPS.orbitElipse, this.planetPS.orbitRotation, 
			this.planetPS.orbitCenter, this.planetPS.orbitSpeed, scene);

		if(planet.object instanceof ProceduralPlanet){
			let pMat = planetMaterial.clone();
			loadMaterialProperties(pMat, planet.object);
			this.mainPlanet = new THREE.Mesh(planetGeometry.clone(), pMat);
			
			this.systemHolder.add(this.mainPlanet);
		}else if(planet.object instanceof PlanetSatellite){
			if(planet.object.mainPlanetId >= 0){
				let pPlanet = oStores.planets.find(op => {
					return op.id == planet.object.mainPlanetId;
				});
				pPlanet = pPlanet.object as ProceduralPlanet;
	
				let pMat = planetMaterial.clone();
				loadMaterialProperties(pMat, pPlanet);
				this.mainPlanet = new THREE.Mesh(planetGeometry.clone(), pMat);
	
				this.systemHolder.add(this.mainPlanet);
			}

			planet.object.satelites.forEach(satellite => {
				let satPlanet = oStores.planets.find(planet => planet.id == satellite.planetId).object as ProceduralPlanet;

				let pMat = planetMaterial.clone();
				loadMaterialProperties(pMat, satPlanet);
				let satelliteMesh = new THREE.Mesh(planetGeometry.clone(), pMat);

				satelliteMesh.scale.set(satellite.scale, satellite.scale, satellite.scale);

				let satelliteOrbit = new OrbitController(satellite.orbitStart, satellite.orbitElipse, satellite.orbitRotation, 
					satellite.orbitCenter, satellite.orbitSpeed, this.systemHolder);

				this.satellites.push({
					mesh: satelliteMesh,
					orbitController: satelliteOrbit
				});
				
				this.systemHolder.add(satelliteMesh);
			})
		}else{
			throw new Error("Planet variable has the wrong type");
		}
	}

	disposePlanet(){
		this.mainOrbitController.hideEllipse();
		this.systemHolder.remove(this.mainPlanet);
		this.mainPlanet.geometry.dispose();
		this.mainPlanet.material.dispose();
		this.satellites.forEach(satellite => {
			this.systemHolder.remove(satellite.mesh);
			satellite.mesh.geometry.dispose();
			satellite.mesh.material.dispose();
		})
	}

	setScale(scale){
		this.systemHolder.scale.set(scale, scale, scale);
	}

	animate(time:number, deltaTime:number){
		this.mainPlanet.material.uniforms.iTime.value = time;
		let newPosition = this.mainOrbitController.computeOrbit(deltaTime);
		this.systemHolder.position.set(newPosition.x, newPosition.y, newPosition.z);

		let mainPlanetPos = new THREE.Vector3(0,0,0);
		this.mainPlanet.getWorldPosition(mainPlanetPos);
		mainPlanetPos.normalize();
		this.mainPlanet.material.uniforms.lDirection.value = mainPlanetPos.multiplyScalar(-1.0);
		
		this.satellites.forEach(sat =>{
			let newPosition = sat.orbitController.computeOrbit(deltaTime);
			sat.mesh.position.set(newPosition.x, newPosition.y, newPosition.z);

			let satWorldPos = new THREE.Vector3(0,0,0);
			sat.mesh.getWorldPosition(satWorldPos);
			satWorldPos.normalize();
			sat.mesh.material.uniforms.iTime.value = time;
			sat.mesh.material.uniforms.lDirection.value = satWorldPos.multiplyScalar(-1.0);
		});
	}
}

export default class PlanetarySystemEditor{
	cameraControlStores: CameraStores;
	sceneCameraController: SceneCameraController;
	sceneBackground: SceneBackground;

	threeScene: ThreeScene;
	scene:THREE.Scene;

	selectedPSId: number;
	selectedPSObject: PlanetarySystem;

	starMesh: THREE.Mesh;

	planetarySystemName: Writable<string>;
	selectedStar: Writable<number>;
	starScale: Writable<number>;

	starAdded: boolean;
	managedPlanets: Array<ManagedPlanet>;
	managedPlanetsStores: Array<ManagedPlanetStore>;

	startTime: number;
	lastFrameTime: number;

	showPlanetsPath: Writable<boolean>;

	enabled: boolean;

	editorStores;

	constructor(threeScene){
		this.threeScene = threeScene;
		this.cameraControlStores = {
			cameraRotation: writable(new THREE.Vector2(0, 0)),
			cameraDistance: writable(2.0),
			cameraRotationCenter: writable(new THREE.Vector3(0, 0, 0)),
			cameraFOV: writable(75),
			renderWidth: writable(300),
			pixelPerfect: writable(true)
		};

		this.startTime = 0;
		this.scene = new THREE.Scene();
		this.enabled = false;

		this.showPlanetsPath = writable(false);

		this.sceneCameraController = new SceneCameraController(threeScene, this.cameraControlStores, this.scene);
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
			}else{
				if(this.starAdded){
					this.scene.remove(this.starMesh);
					this.starAdded = false;
				}
			}
		});

		this.starScale.subscribe((scale)=>{
			this.starMesh.scale.set(scale, scale, scale);
		});

		this.managedPlanets = [];
		this.managedPlanetsStores = [];
	}

	startSystem(planetarySystemId: number){
		this.startTime = (new Date()).getTime();
		this.lastFrameTime = this.startTime;

		let psObj = get(ObjectsStore).planetarySystems.find(ps => ps.id == planetarySystemId);
		if(psObj != undefined && psObj != null){
			this.selectedPSId = psObj.id;
			this.selectedPSObject = psObj.object;

			this.selectedStar.set(-1);
			this.selectedStar.set(this.selectedPSObject.starId);
			this.starScale.set(this.selectedPSObject.starScale);

			this.selectedPSObject.planets.forEach(ps => {
				this.addPlanet(ps);
			});

			this.enabled = true;
			this.sceneCameraController.resizeRenderer(this.sceneCameraController.desiredWidth, this.sceneCameraController.camera);
			this.animate();
			this.sceneCameraController.addEventListeners();
		}
	}

	stopSystem(){
		this.enabled = false;

		let newPlanetarySystem = new PlanetarySystem(this.selectedPSObject.name);
		newPlanetarySystem.starId = get(this.selectedStar);
		newPlanetarySystem.starScale = get(this.starScale);
		newPlanetarySystem.planets = this.managedPlanets.map(mp => {
			let newPS = new PlanetPS(mp.planetPS.planetSatelliteId);
			newPS.orbitCenter = mp.mainOrbitController.center;
			newPS.orbitElipse = mp.mainOrbitController.ellipse;
			newPS.orbitRotation = mp.mainOrbitController.rotation;
			newPS.orbitSpeed = mp.mainOrbitController.speed;
			newPS.orbitStart = mp.mainOrbitController.startParam;
			newPS.scale = mp.systemHolder.scale.x;
			return newPS;
		});

		ObjectsStore.updateObject({
			id: this.selectedPSId,
			object: newPlanetarySystem	
		}, "planetarySystems", -1);

		while(this.managedPlanetsStores.length > 0){
			this.removePlanet(0);
		}

		this.selectedStar.set(-1);

		this.sceneCameraController.removeEventListeners();
	}

	addPlanetFromId(planetId: number){
		let ps = new PlanetPS(planetId);
		this.addPlanet(ps);
	}

	addPlanet(ps: PlanetPS){
		let managedPlanet = new ManagedPlanet(ps, this.threeScene.planetMaterial, this.scene);
		this.managedPlanets.push( managedPlanet );

		let managedPlanetStores = new ManagedPlanetStore(
			ps.orbitCenter,
			ps.orbitElipse,
			ps.orbitRotation,
			ps.orbitSpeed,
			ps.orbitStart,
			ps.scale
		);

		managedPlanetStores.unsubscribe.push(this.showPlanetsPath.subscribe((show)=>{
			if(show){
				managedPlanet.mainOrbitController.showEllipse();
				managedPlanet.satellites.forEach(sat => {
					sat.orbitController.showEllipse();
				});
			}else{
				managedPlanet.mainOrbitController.hideEllipse();
				managedPlanet.satellites.forEach(sat => {
					sat.orbitController.hideEllipse();
				});
			}
		}));

		managedPlanetStores.unsubscribe.push(managedPlanetStores.orbitCenterStore.subscribe((center)=>{
			managedPlanet.mainOrbitController.center = center;
			managedPlanet.mainOrbitController.updateLineLoop();
		}));

		managedPlanetStores.unsubscribe.push(managedPlanetStores.orbitElipseStore.subscribe((ellipse)=>{
			managedPlanet.mainOrbitController.ellipse = ellipse;
			managedPlanet.mainOrbitController.computeMovementTable();
			managedPlanet.mainOrbitController.updateLineLoop();
		}));

		managedPlanetStores.unsubscribe.push(managedPlanetStores.orbitRotationStore.subscribe((rotation)=>{
			managedPlanet.mainOrbitController.rotation = rotation;
			managedPlanet.mainOrbitController.updateLineLoop();
		}));

		managedPlanetStores.unsubscribe.push(managedPlanetStores.orbitStartStore.subscribe((start)=>{
			managedPlanet.mainOrbitController.startParam = start;
		}));

		managedPlanetStores.unsubscribe.push(managedPlanetStores.orbitSpeedStore.subscribe((speed)=>{
			managedPlanet.mainOrbitController.speed = speed;
		}));
		
		managedPlanetStores.unsubscribe.push(managedPlanetStores.scaleStore.subscribe((scale)=>{
			managedPlanet.setScale(scale);
		}));

		this.managedPlanetsStores.push(managedPlanetStores);
	}

	removePlanet(index){
		this.managedPlanetsStores[index].unsubscribe.forEach(unsub => {
			unsub();
		});
		this.managedPlanets[index].disposePlanet();
		this.scene.remove(this.managedPlanets[index].systemHolder);

		this.managedPlanetsStores = this.managedPlanetsStores.filter((elem, i) => i != index);
		this.managedPlanets = this.managedPlanets.filter((elem, i) => i != index);
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

		let deltaTime = currentTime - this.lastFrameTime;

		if (this.starMesh != null) {
			this.starMesh.material.uniforms._iTime.value = currentTime;
		}
		this.managedPlanets.forEach(mp => {
			mp.animate(currentTime, deltaTime);
		})

		this.sceneBackground.animate(currentTime);

		this.lastFrameTime = currentTime;
		this.threeScene.renderer.render(this.scene, this.sceneCameraController.camera);
	}
}