import Vec2 from "../Math/Vec2";
import VERT_STATE from "./VertState";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import Vec3 from "../Math/Vec3";

const basePath = "TowerBuilder/BuildingParts/";

const vertMaxDist = 0.866025; //0.866025
const relativeVecs = {
	open: {
		base: new Vec2(0, vertMaxDist),
		v1: new Vec2(-0.5, -vertMaxDist),
		v2: new Vec2(0.5, -vertMaxDist),
		dir: new Vec2(0, 1)
	},
	openInv: {
		base: new Vec2(0, vertMaxDist),
		v1: new Vec2(0.5, -vertMaxDist),
		v2: new Vec2(-0.5, -vertMaxDist),
		dir: new Vec2(0, 1)
	},
	close: {
		base: new Vec2(0, 0),
		v1: new Vec2(-0.5, vertMaxDist),
		v2: new Vec2(0.5, vertMaxDist),
		dir: new Vec2(0, -1)
	},
	closeInv: {
		base: new Vec2(0, 0),
		v1: new Vec2(0.5, vertMaxDist),
		v2: new Vec2(-0.5, vertMaxDist),
		dir: new Vec2(0, -1)
	}
}

const modelDefinition = {
	Floor0: {
		path: "Floor_BA_BA_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Floor1: {
		path: "Floor_AB_AB_AB.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Floor2: {
		path: "Floor_WB_WB_WB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Roof0: {
		path: "Roof_AA_AA_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Roof1: {
		path: "Roof_AA_BA_BA.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	Shore0: {
		path: "Shore_WA_BA_BA.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	Shore1: {
		path: "Shore_WA_WA_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Wall0: {
		path: "Wall_AA_AA_BB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Wall1: {
		path: "Wall_AA_BB_BB.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	Wall2: {
		path: "Wall_BA_BA_BB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Wall3: {
		path: "Wall_BB_BB_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	Wall4: {
		path: "Wall_BB_AA_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Wall5: {
		path: "Wall_BB_AA_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: true
	},
	WallCorner0: {
		path: "WallCorner_AA_AA_AB.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	WallCorner0_1: {
		path: "WallCorner_AA_AA_AB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	WallCorner1: {
		path: "WallCorner_AA_AB_AB.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	WallCorner1_1: {
		path: "WallCorner_AA_AB_AB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	WallCorner2: {
		path: "WallCorner_AB_AB_BB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	WallCorner3: {
		path: "WallCorner_AB_BB_BB.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	SpecialCorner0: {
		path: "SpecialCorner_AA_BB_AB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.BUILDING]
		],
		barycentricVerts: relativeVecs.open,
		reflect: true
	},
	SpecialCorner1: {
		path: "SpecialCorner_AA_BB_AB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	ShoreWall0: {
		path: "ShoreWall_WA_WA_BB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	ShoreWall1: {
		path: "ShoreWall_WA_BB_BB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	ShoreCorner0: {
		path: "ShoreCorner_WA_BB_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.open,
		reflect: true
	},
	ShoreCorner1: {
		path: "ShoreCorner_WA_BB_BA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	ShoreCorner2: {
		path: "ShoreCorner_BA_BA_WB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	ShoreCorner3: {
		path: "ShoreCorner_BA_WB_WB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	ShoreCorner4: {
		path: "ShoreCorner_BA_WB_WA.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.close,
		reflect: false
	},
	ShoreCorner5: {
		path: "ShoreCorner_BA_WB_WA.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.close,
		reflect: true
	},
	Interface0: {
		path: "Interface_AA_BA_AB.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.close,
		reflect: false
	},
	Interface1: {
		path: "Interface_AA_BA_AB.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR]
		],
		barycentricVerts: relativeVecs.close,
		reflect: true
	},
	Interface2: {
		path: "Interface_AB_BA_AB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.closeInv,
		reflect: false
	},
	Interface3: {
		path: "Interface_AB_BA_BA.obj",
		prismState: [
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.close,
		reflect: false
	},
	Interface4: {
		path: "Interface_BA_AB_BB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.close,
		reflect: false
	},
	Interface5: {
		path: "Interface_BA_AB_BB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.AIR, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.close,
		reflect: true
	},
	Interface6: {
		path: "Interface_WB_BA_BB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.open,
		reflect: true
	},
	Interface7: {
		path: "Interface_WB_BA_BB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.AIR],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Interface8: {
		path: "Interface_WB_BB_WA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.AIR],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.open,
		reflect: false
	},
	Interface9: {
		path: "Interface_WB_BB_WA.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.AIR],
		],
		barycentricVerts: relativeVecs.open,
		reflect: true
	},
	Innershore0:{
		path: "Innershore_WB_BB_BB.obj",
		prismState: [
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.close,
		reflect: false
	},
	Innershore1:{
		path: "Innershore_WB_WB_BB.obj",
		prismState: [
			[VERT_STATE.BUILDING, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
			[VERT_STATE.WATER, VERT_STATE.BUILDING],
		],
		barycentricVerts: relativeVecs.openInv,
		reflect: false
	}
}


export default class ModelManager {
	constructor() {
		this.partLoader = new OBJLoader();
		this.modelKeys = Object.keys(modelDefinition);
		this.models = [];
		this.loadModel(0);
	}
	onLoad(object, index) {
		const meshGeometry = object.children[0].geometry;
		const positionAttribute = meshGeometry.getAttribute("position");

		//Transform position attribute array into a collection of barycentric positions
		//Save the geometry buffer too, the UV and index information are required later
		const bVerts = modelDefinition[this.modelKeys[index]].barycentricVerts;
		const reflect = modelDefinition[this.modelKeys[index]].reflect;

		const basePos = bVerts.base;
		const v1 = reflect ? bVerts.v2 : bVerts.v1;
		const v2 = reflect ? bVerts.v1 : bVerts.v2;
		/*const v1 = bVerts.v1;
		const v2 = bVerts.v2;*/
		const det = (v2.y * v1.x) + (-v2.x * v1.y);

		const barycentricPositions = [];
		for (let i = 0; i < positionAttribute.count; i++) {
			const startVertIndex = i * 3;
			let v = new Vec3(
				positionAttribute.array[startVertIndex],
				positionAttribute.array[startVertIndex + 1],
				positionAttribute.array[startVertIndex + 2]
			);

			let relativePos = new Vec2(v.x - basePos.x, v.z - basePos.y);
			let weights = new Vec2(
				(v2.y * relativePos.x - v2.x * relativePos.y) / det,
				(-v1.y * relativePos.x + v1.x * relativePos.y) / det
			);
			let height = v.y;

			barycentricPositions.push({
				weights, height
			});
		}

		const uvAttribute = meshGeometry.getAttribute("uv");
		const grassTriangles = [];
		for (let triIndex = 0; triIndex < barycentricPositions.length / 3; triIndex++) {
			const startVertIndex = triIndex * 3;
			const uvx = uvAttribute.array[startVertIndex * 2];
			if(uvx > 0.099 && uvx <0.199){
				grassTriangles.push([
					barycentricPositions[ startVertIndex	 ],
					barycentricPositions[ startVertIndex + 1 ],
					barycentricPositions[ startVertIndex + 2 ]
				]);
			}
		}

		if(reflect){
			barycentricPositions.reverse();
			let newUVArray = [];
			for (let uvIndex = uvAttribute.count - 1; uvIndex >= 0; uvIndex--) {
				const startVertIndex = uvIndex * 2;
				newUVArray.push(uvAttribute.array[startVertIndex], uvAttribute.array[startVertIndex + 1]);
			}
			meshGeometry.setAttribute("uv", new THREE.Float32BufferAttribute( newUVArray, 2 ));
		}

		//console.log("Model", this.modelKeys[index], object.children[0]);

		this.models.push({
			prismState: modelDefinition[this.modelKeys[index]].prismState,
			geometry: meshGeometry,
			barycentricPositions,
			grassTriangles
		});

		if (index + 1 < this.modelKeys.length) {
			this.loadModel(index + 1);
		} else {
			this.finishedLoading();
		}
	}
	finishedLoading() {
		console.log(this.models);
	}
	loadModel(index) {
		const modelDef = modelDefinition[this.modelKeys[index]];
		this.partLoader.load(
			basePath + modelDef.path,
			(object) => { this.onLoad(object, index) },
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