import * as THREE from 'three';
import { get } from 'svelte/store';

import BackgroundShader from "./Materials/SpaceBackground/SpaceBackgroundShader";
import SceneGridShader from "./Materials/SceneGrid/SceneGridShader";
import PlanetShader from "./Materials/Planet/PlanetShader";
import StarShader from "./Materials/Star/StarShader";

import PlanetUniformT from "./Materials/Planet/UniformsType";
import PlanetEditor from './PlanetEditor';

import PlanetSatelliteEditor from "./PlanetSatelliteEditor";
import BackgroundEditor from './BackgroundEditor';
import UniformDefaults from "./Materials/Planet/UniformDefaults";
import RaymarchingQuality from "../RaymarchingQuality";
import StarEditor from './StarEditor';

type RaymarchParams = {
	PSW_StepSize: number,
	PSW_MaxStepCount: number,
	C_StepSize: number,
	C_StepCount: number
}

type Editors = {
	planetEditor: PlanetEditor,
	backgroundEditor: BackgroundEditor,
	planetSatelliteEditor: PlanetSatelliteEditor,
	starEditor: StarEditor,
	planetarySystemEditor,
}

declare global {
	interface Window { 
		threeScene: {
			editors: Editors
		}
	}
}

export default class ThreeScene{
	canvasElement:HTMLCanvasElement;

	lowFidelityParameters:RaymarchParams;
	normalFidelityParameters:RaymarchParams;
	highFidelityParameters:RaymarchParams;

	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;

	desiredWidth: number;

	planetMaterial: THREE.ShaderMaterial;
	backgroundMaterial: THREE.ShaderMaterial;
	sceneGridMaterial: THREE.ShaderMaterial;
	starMaterial: THREE.ShaderMaterial;

	startTime: number;
	editors: Editors;

	setPixelPerfect: (boolean)=>void;

	constructor(canvasHtmlElement, setPixelPerfect){
		this.setPixelPerfect = setPixelPerfect;
		this.canvasElement = canvasHtmlElement;
		this.startTime = (new Date()).getTime();
		
		this.lowFidelityParameters = {
            PSW_StepSize: 0.02,
            PSW_MaxStepCount: 60,
            C_StepSize: 0.05,
            C_StepCount: 60
        }
        this.normalFidelityParameters = {
            PSW_StepSize: 0.01,
            PSW_MaxStepCount: 150,
            C_StepSize: 0.02,
            C_StepCount: 100
        };
        this.highFidelityParameters = {
            PSW_StepSize: 0.005,
            PSW_MaxStepCount: 300,
            C_StepSize: 0.0025,
            C_StepCount: 400
        };

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvasElement,
		});

		this.desiredWidth = 300;

		this.planetMaterial = new THREE.ShaderMaterial({
            vertexShader: PlanetShader.vs,
            fragmentShader: PlanetShader.fs,
            uniforms: UniformDefaults,
        });
		this.planetMaterial.transparent = true;
		//this.planetMaterial.side = THREE.DoubleSide;

		this.backgroundMaterial = new THREE.ShaderMaterial({
			vertexShader: BackgroundShader.vs,
			fragmentShader: BackgroundShader.fs,
			uniforms: BackgroundShader.uniforms
		});
		this.backgroundMaterial.side = THREE.BackSide;

		this.starMaterial = new THREE.ShaderMaterial({
			vertexShader: StarShader.vs,
			fragmentShader: StarShader.fs,
			uniforms: StarShader.uniforms
		});
		this.starMaterial.transparent = true;

		{//Compiling materials
			let compileCamera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
			let sphereGeom = new THREE.SphereGeometry(1, 24, 24);
			let planetMesh = new THREE.Mesh( sphereGeom, this.planetMaterial );
			let bgMesh = new THREE.Mesh( sphereGeom, this.backgroundMaterial );
			let starMesh = new THREE.Mesh( sphereGeom, this.starMaterial );
			
			compileCamera.position.z = 2;
			
			this.scene.add( planetMesh );
			this.scene.add( bgMesh );
			this.scene.add( starMesh );

			this.renderer.compile(this.scene, compileCamera);

			this.scene.remove(planetMesh);
			this.scene.remove( bgMesh );
			this.scene.remove( starMesh );

			sphereGeom.dispose();
		}

        
        this.desiredWidth = 300;
		this.editors = {
			planetEditor: new PlanetEditor(this),
			backgroundEditor: new BackgroundEditor(this),
			planetSatelliteEditor: new PlanetSatelliteEditor(this),
			starEditor: new StarEditor(this),
			planetarySystemEditor: null,
		};

		window.threeScene = {
			editors: this.editors
		};
	}

	setPlanetQuality(quality, planetMat){
		if(quality == RaymarchingQuality.low){
			planetMat.uniforms._PlanetSurfaceWaterStepSize.value = this.lowFidelityParameters.PSW_StepSize;
			planetMat.uniforms._PlanetSurfaceWaterMaxStepCount.value = this.lowFidelityParameters.PSW_MaxStepCount;
		}else if(quality == RaymarchingQuality.medium){
			planetMat.uniforms._PlanetSurfaceWaterStepSize.value = this.normalFidelityParameters.PSW_StepSize;
			planetMat.uniforms._PlanetSurfaceWaterMaxStepCount.value = this.normalFidelityParameters.PSW_MaxStepCount;
		}else if(quality == RaymarchingQuality.high){
			planetMat.uniforms._PlanetSurfaceWaterStepSize.value = this.highFidelityParameters.PSW_StepSize;
			planetMat.uniforms._PlanetSurfaceWaterMaxStepCount.value = this.highFidelityParameters.PSW_MaxStepCount;
		}
	}
	setCloudQuality(quality, planetMat){
		if(quality == RaymarchingQuality.low){
			planetMat.uniforms._CloudsStepSize.value = this.lowFidelityParameters.C_StepSize;
			planetMat.uniforms._CloudsMaxStepCount.value = this.lowFidelityParameters.C_StepCount;
		}else if(quality == RaymarchingQuality.medium){
			planetMat.uniforms._CloudsStepSize.value = this.normalFidelityParameters.C_StepSize;
			planetMat.uniforms._CloudsMaxStepCount.value = this.normalFidelityParameters.C_StepCount;
		}else if(quality == RaymarchingQuality.high){
			planetMat.uniforms._CloudsStepSize.value = this.highFidelityParameters.C_StepSize;
			planetMat.uniforms._CloudsMaxStepCount.value = this.highFidelityParameters.C_StepCount;
		}
	}
}