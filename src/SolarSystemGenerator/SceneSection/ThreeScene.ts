import * as THREE from 'three';
import { get } from 'svelte/store';

import PlanetShader from "./Materials/Planet/PlanetShader";
import PlanetUniformT from "./Materials/Planet/UniformsType";

import ProceduralPlanet from '../ProceduralPlanet';
import ObjectStore from '../ObjectsStore';
import SelectionState from "../SelectionState";

type RaymarchParams = {
	PSW_StepSize: number,
	PSW_MaxStepCount: number,
	C_StepSize: number,
	C_StepCount: number
}

export default class ThreeScene{
	canvasElement:HTMLCanvasElement;

	lowFidelityParameters:RaymarchParams;
	normalFidelityParameters:RaymarchParams;
	highFidelityParameters:RaymarchParams;

	camera: THREE.Camera;
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;

	desiredWidth: number;
	uniforms: PlanetUniformT;

	material: THREE.ShaderMaterial;
	planetMesh: THREE.Mesh;

	startTime: number;

	constructor(canvasHtmlElement){
		this.canvasElement = canvasHtmlElement;
		this.startTime = (new Date()).getTime();
		
		this.lowFidelityParameters = {
            PSW_StepSize: 0.015,
            PSW_MaxStepCount: 60,
            C_StepSize: 0.05,
            C_StepCount: 60
        }
        this.normalFidelityParameters = {
            PSW_StepSize: 0.01,
            PSW_MaxStepCount: 100,
            C_StepSize: 0.01,
            C_StepCount: 100
        };
        this.highFidelityParameters = {
            PSW_StepSize: 0.0020,
            PSW_MaxStepCount: 300,
            C_StepSize: 0.0025,
            C_StepCount: 400
        };

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvasElement,
		});

		this.desiredWidth = 300;
		this.resizeRenderer(this.desiredWidth);

		this.uniforms = {
            iTime: { value: 1 },
            iResolution:  { value: new THREE.Vector3() },
            //Planet uniforms
            _PSNoiseOffset: {value: new THREE.Vector3(10.62, 0, 0)},
            _PSNoiseGlobalScale: {value: 1},
            _PSWaterHeight: {value: 0.5},
            _PSWaterDepthOffset: {value: 0.069},
            _PSMaxHeightOffset: {value: 0.1},
            _PlanetColor1: {value: new THREE.Color(0,0.4,0.3)},
            _PlanetColor2: {value: new THREE.Color(0.2,1,0.8)},
            _PSNoiseScales: {value: new THREE.Vector2(2,20)}, 
            _SecondaryNoiseStrengthGround: {value: 0.07},
            _MaxScrewTerrain: {value: 0},
            _PSDensityOffset: {value: 0},
            _SurfaceMinLight: {value: 0.2},
            _PlanetSurfaceWaterStepSize: {value: 0.005},
            _PlanetSurfaceWaterMaxStepCount: {value: 100},
            _GridHalfSize: {value: 30.0},
            _VoxelNormalInterp: {value: 1.0},
            _EnableVoxelizer: {value: false},
            //Ocean uniforms
            _WaterColorDepth: {value: new THREE.Color(0.1,0.1,0.3)},
            _WaterColor: {value: new THREE.Color(0.6,0.8,1)},
            _WaterMaterialSmoothStep: {value: new THREE.Vector2(4.92, 0)},
            _WaterNormalScale: {value: 12.46},
            _WaterSurfaceMinLight: {value: 0.44},
            _WaterNormalStrength: {value: 0.5},
            _SpecularParams: {value: new THREE.Vector2(3.4, 0.33)},
            _WaterMoveSpeed: {value: 0.2},
            //Cloud uniforms
            _CloudTransparency: {value: 1},
            _CloudColor1: {value: new THREE.Color(0, 0.5, 0.8)},
            _CloudColor2: {value: new THREE.Color(1, 1, 1)},
            _MaxScrewCloud: {value: 0.6},
            _BreakDistanceCloud: {value: 1.1},
            _CloudMidDistance: {value: 0.8},
            _CloudHalfHeight: {value: 0.053},
            _CloudNoiseScales: {value: new THREE.Vector2(3, 30)},
            _CloudNoiseOffset: {value: new THREE.Vector3(0,0,0)},
            _CloudNoiseGlobalScale: {value: 1.07},
            _SecondaryNoiseStrength: {value: 0.1},
            _CloudDensityMultiplier: {value: 1.14},
            _CloudDensityOffset: {value: -0.1},
            _CloudMoveSpeed: {value: 0.1},
            _CloudsStepSize: {value: 0.01},
            _CloudsMaxStepCount: {value: 100},
            _CloudsPosterize: {value: true},
            _CloudsPosterizeCount: {value: 4},
            //Ambient
            _AmbientColor: {value: new THREE.Color(0.1,0.1,0.3)},
            _AmbientPower: {value: 4.0},
            //Misc
            _CylinderHeight: {value: 5.0},
            _CylinderRad: {value: 2.88}
        };

		this.material = new THREE.ShaderMaterial({
            vertexShader: PlanetShader.vs,
            fragmentShader: PlanetShader.fs,
            uniforms: this.uniforms,
        });

		let sphereGeom = new THREE.SphereGeometry(1, 24, 24);
        this.planetMesh = new THREE.Mesh( sphereGeom, this.material );
        this.scene.add( this.planetMesh );
		this.renderer.compile(this.scene, this.camera);
		this.scene.remove(this.planetMesh);
		sphereGeom.dispose();

        this.camera.position.z = 2;
        this.desiredWidth = 300;

		SelectionState.editable.subscribe(this.selectionStateChanged);
	}

	selectionStateChanged(state){
		console.log("Select state changed", state);
		if(state > 0){
			let currentObjectStoreState = get(ObjectStore);
			
		}
	}

	resizeRendererWH(resolution){
        this.renderer.setSize(resolution.x, resolution.y, false);
        this.camera.aspect = resolution.x / resolution.y;
        this.camera.updateProjectionMatrix();
    }

    resizeRenderer(desiredWidth){
        let newWidth = desiredWidth;
        let newHeight = desiredWidth * (this.canvasElement.clientHeight / this.canvasElement.clientWidth);

        this.renderer.setSize(newWidth, newHeight, false);
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
    }

    shouldResize(){
        let dWidth = this.desiredWidth;
        let dHeight = this.desiredWidth * (this.canvasElement.clientHeight / this.canvasElement.clientWidth);

        let rWidth = this.canvasElement.width;
        let rHeight = this.canvasElement.height;

        if(Math.abs(dWidth - rWidth) > 1 || Math.abs(dHeight - rHeight) > 1){
            return true;
        }
        return false;
    }

	animate(){
		requestAnimationFrame( (this.animate).bind(this) );

        if(this.shouldResize()){
            this.resizeRenderer(this.desiredWidth);
        }
        this.uniforms.iTime.value = ((new Date()).getTime() - this.startTime) / 1000;
        this.renderer.render( this.scene, this.camera );
	}
}