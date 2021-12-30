import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';

const basePath = "CityGenerator/ExtraProps/";

export default class ExtraPropLoader{
	constructor(){
		this.partLoader = new OBJLoader();
		this.extraProps = {};
		
		this.partLoader.load(
			basePath + "Flower.obj",
			(object) => {
				this.extraProps.flower = object.children[0].geometry;
			},
			// called when loading is in progresses
			function (xhr) {
				//console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			// called when loading has errors
			function (error) {
				console.log(error);
				console.log('An error happened');

			}
		)
	}
}