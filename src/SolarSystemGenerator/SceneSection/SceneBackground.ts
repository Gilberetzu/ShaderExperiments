import { get, writable, Writable } from "svelte/store";
import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import ObjectsStore from "../ObjectsStore";

export default class SceneBackground{
	showBackgroundStore: Writable<boolean>;
	showGridStore: Writable<boolean>; 

	selectedBackgroundStore: Writable<number>;

	sceneGrid: THREE.GridHelper;
	sceneBackgroundMesh: THREE.Mesh;
	
	constructor(threeScene:ThreeScene, scene: THREE.Scene){
		this.sceneGrid = new THREE.GridHelper( 10, 10, 0xFF7777, 0x888888);

		this.showBackgroundStore = writable(false);
		this.showGridStore = writable(false);
		this.selectedBackgroundStore = writable(-1);

		let backgroundGeometry = new THREE.SphereGeometry(80, 24, 24);
		this.sceneBackgroundMesh = new THREE.Mesh(backgroundGeometry, threeScene.backgroundMaterial.clone());

		this.showBackgroundStore.subscribe((show)=>{
			if(show){
				if(get(this.selectedBackgroundStore) == -1){
					this.showBackgroundStore.set(false);
				}else{
					scene.add(this.sceneBackgroundMesh);
				}				
			}else{
				scene.remove(this.sceneBackgroundMesh)
			}
		});

		this.showGridStore.subscribe((show)=>{
			if(show){
				scene.add(this.sceneGrid);
			}else{
				scene.remove(this.sceneGrid)
			}
		});

		this.selectedBackgroundStore.subscribe((id)=>{
			if(id >= 0){
				let bg = get(ObjectsStore).backgrounds.find(background => background.id == id).object;
				this.sceneBackgroundMesh.material.uniforms._color0.value = bg.color0;
				this.sceneBackgroundMesh.material.uniforms._color1.value = bg.color1;
				this.sceneBackgroundMesh.material.uniforms._color2.value = bg.color2;
				
				this.sceneBackgroundMesh.material.uniforms._colorStars.value = bg.colorStars;
				this.sceneBackgroundMesh.material.uniforms._noiseStarScale.value = bg.noiseStarScale;
				this.sceneBackgroundMesh.material.uniforms._noiseStarSmoothStep.value = bg.noiseStarSmoothStep;
				this.sceneBackgroundMesh.material.uniforms._noiseStarMaskSpeed.value = bg.noiseStarMaskSpeed;

				this.sceneBackgroundMesh.material.uniforms._noise1Mult.value = bg.noise1.mult;
				this.sceneBackgroundMesh.material.uniforms._noise1Scale.value = bg.noise1.scale;
				this.sceneBackgroundMesh.material.uniforms._noise1Screw.value = bg.noise1.screw;
				this.sceneBackgroundMesh.material.uniforms._noise1Speed.value = bg.noise1.speed;

				this.sceneBackgroundMesh.material.uniforms._noise2Mult.value = bg.noise2.mult;
				this.sceneBackgroundMesh.material.uniforms._noise2Scale.value = bg.noise2.scale;
				this.sceneBackgroundMesh.material.uniforms._noise2Screw.value = bg.noise2.screw;
				this.sceneBackgroundMesh.material.uniforms._noise2Speed.value = bg.noise2.speed;

				this.sceneBackgroundMesh.material.uniforms._mainNoiseScale.value = bg.mainNoiseScale;
				this.sceneBackgroundMesh.material.uniforms._mainNoiseScrew.value = bg.mainNoiseScrew;

				this.sceneBackgroundMesh.material.uniforms._noiseMaskSmoothStep.value = bg.noiseMaskSmoothStep;
				this.sceneBackgroundMesh.material.uniforms._noiseMaskOffset.value = bg.noiseMaskOffset;
				this.sceneBackgroundMesh.material.uniforms._noiseMaskScale.value = bg.noiseMaskScale;

				this.sceneBackgroundMesh.material.uniforms._stepSize.value = bg.stepSize;

				this.sceneBackgroundMesh.material.uniforms._densityMult.value = bg.densityMult;
			}
		});
	}

	animate(currenTime){
		this.sceneBackgroundMesh.material.uniforms._iTime.value = currenTime;
	}
}