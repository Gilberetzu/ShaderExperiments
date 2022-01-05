import Polygon2D from "../Geometry/Polygon2D";
import Num from "../Math/Num";
import Vec2 from "../Math/Vec2";
import * as THREE from 'three';
import Draw from "../Draw";
import Triangle2D from "../Geometry/Triangle2D";
import Ray2D from "../Geometry/Ray";
import Vec3 from "../Math/Vec3";

import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

import BuildingFragmentShader from 	"../Shaders/BasicShader/FragmentShader.glsl?raw";
import BuildingVertexShader from 	"../Shaders/BasicShader/VertexShader.glsl?raw";

import GrassFragmentShader from 	"../Shaders/GrassShader/FragmentShader.glsl?raw";
import GrassVertexShader from 	"../Shaders/GrassShader/VertexShader.glsl?raw";

import WaterFragmentShader from 	"../Shaders/WaterShader/FragmentShader.glsl?raw";
import WaterVertexShader from 	"../Shaders/WaterShader/VertexShader.glsl?raw";

import ReflectionFragmentShader from 	"../Shaders/ReflectionShader/FragmentShader.glsl?raw";
import ReflectionVertexShader from 	"../Shaders/ReflectionShader/VertexShader.glsl?raw";

const maxVerticalLayers = 8;
const grassWidth = 0.075;
const grassHeight = 0.25;
const grassMidHeight = grassHeight / 2;

import VERT_STATE from "./VertState";
import PerlinNoise from "../Math/PerlinNoise";

class RandomLUT{
	constructor(randomCount){
		this.lut = new Float32Array(randomCount);
		for (let i = 0; i < randomCount; i++) {
			this.lut[i] = Math.random();
		}
		this.current = 0;
	}
	next(){
		this.current = this.current + 1 >= this.lut.length ? 0 : this.current + 1;
		return this.lut[this.current];
	}
}

export default class GenerationSpace{
	constructor(triangulatedSpace, scene3d){
		this.scene3d = scene3d;//Should be change to a wrapper for the threejs scene

		this.centerPosition = Vec2.DivScalar(triangulatedSpace.centerPosition, triangulatedSpace.averageEdgeLength);
		this.vertices = triangulatedSpace.vertices.map(vert => {
			let polyCollider = [];
			let adjacentVertices = [];
			if(!vert.outer){
				let edgeTri = vert.connectedTriangles.map(tri => {
					const vIndex = tri.verts.findIndex(v => v == vert);
					if(vIndex == -1){
						throw new Error("Vertex not found on connected triangle");
					}else{
						return {
							edge: [tri.verts[Num.ModGl(vIndex + 1, 3)], tri.verts[Num.ModGl(vIndex + 2, 3)]],
							tri: tri
						};
					}
				});
				let orderedEdges = [
					{
						edgeTri: edgeTri[0],
						tvert: edgeTri[0].edge[0]
					}
				];
				edgeTri.splice(0, 1);
				while(edgeTri.length > 0){
					const tvert = orderedEdges[orderedEdges.length - 1].tvert;

					let foundEdge = false;
					for (let i = 0; i < edgeTri.length; i++) {
						const edgeT = edgeTri[i];
						const edge = edgeT.edge;
						if(edge[0] == tvert){
							orderedEdges.push({
								edgeTri: edgeT,
								tvert: edge[1]
							});
							edgeTri.splice(i, 1);
							foundEdge = true;
							break;
						}else if(edge[1] == tvert){
							orderedEdges.push({
								edgeTri: edgeT,
								tvert: edge[0]
							});
							edgeTri.splice(i, 1);
							foundEdge = true;
							break;
						}
					}
					if(!foundEdge) throw new Error("Following edge not found");
				}

				for (let i = 0; i < orderedEdges.length; i++) {
					const oEdge = orderedEdges[i];
					const triCanvasCenter = oEdge.edgeTri.tri.getCenter();
					adjacentVertices.push(triangulatedSpace.vertices.findIndex(v => v == oEdge.tvert));
					polyCollider.push(Vec2.Subtract(
						Vec2.MultScalar(triCanvasCenter, 1/triangulatedSpace.averageEdgeLength),
						this.centerPosition
					));
				}
			}
			return {
				pos: Vec2.Subtract(
					Vec2.MultScalar(vert.pos, 1/triangulatedSpace.averageEdgeLength),
					this.centerPosition
				),
				outer: vert.outer,
				polygonCollider: polyCollider,
				adjacentVertices
			};
		});

		this.triangles = triangulatedSpace.triangles.map(tri => {
			return [
				triangulatedSpace.vertices.findIndex(v => v == tri.verts[0]),
				triangulatedSpace.vertices.findIndex(v => v == tri.verts[1]),
				triangulatedSpace.vertices.findIndex(v => v == tri.verts[2])
			];
		});

		this.vertStateLayers = [];
		for (let i = 0; i < maxVerticalLayers; i++) {
			const stateLayer = new Array(this.vertices.length);
			for (let j = 0; j < stateLayer.length; j++) {
				if(i == 0){
					stateLayer[j] = VERT_STATE.WATER;
				}else{
					stateLayer[j] = VERT_STATE.AIR;
				}
			}
			this.vertStateLayers.push({
				stateLayer,
				inUse: i==0
			});
		};

		const vertGeometry = new THREE.SphereBufferGeometry(0.1, 4, 2);
		const vertMaterial = new THREE.MeshMatcapMaterial( { color: Draw.HexColor(1, 1, 1) } );

		this.vertLayersInstancedMeshes = new Array(this.vertStateLayers.length);
		for (let i = 0; i < this.vertLayersInstancedMeshes.length; i++) {
			this.vertLayersInstancedMeshes[i] = new THREE.InstancedMesh(vertGeometry, vertMaterial, this.vertices.length);
			
			for (let j = 0; j < this.vertices.length; j++) {
				const vert = this.vertices[j];
				const instanceMatrix = new THREE.Matrix4();
				instanceMatrix.setPosition(vert.pos.y, i, vert.pos.x);
				instanceMatrix.scale(new THREE.Vector3(1,1,1).multiplyScalar(VERT_STATE[this.vertStateLayers[i].stateLayer[j]].scale));
				this.vertLayersInstancedMeshes[i].setMatrixAt(j, instanceMatrix);
				this.vertLayersInstancedMeshes[i].setColorAt(j, VERT_STATE[this.vertStateLayers[i].stateLayer[j]].color);
			}

			this.vertLayersInstancedMeshes[i].position.set(this.centerPosition.y, 0, this.centerPosition.x);
			this.vertLayersInstancedMeshes[i].instanceMatrix.needsUpdate = true;
			this.vertLayersInstancedMeshes[i].instanceColor.needsUpdate = true;
		}

		this.spaceBufferGeometry = new THREE.BufferGeometry();
		this.spaceMaterial = new THREE.ShaderMaterial({
			side: THREE.FrontSide,
			vertexShader: BuildingVertexShader,
			fragmentShader: BuildingFragmentShader,
			uniforms:{
				...this.scene3d.getDirectionalLightUniforms(),
				...this.scene3d.getCloudUniforms()
			}
		}); //new THREE.MeshBasicMaterial({color: new THREE.Color(0.6,0.6,0.8), side: THREE.DoubleSide});
		this.spaceMesh = new THREE.Mesh(this.spaceBufferGeometry, this.spaceMaterial);
		this.spaceMesh.castShadow = true;

		this.grassMovementNoise = new PerlinNoise(256, 16);
		this.grassMovementNoiseTex = this.grassMovementNoise.generateDataTexture();

		this.reflectionMaterial = new THREE.ShaderMaterial({
			side: THREE.FrontSide,
			vertexShader: ReflectionVertexShader,
			fragmentShader: ReflectionFragmentShader,
			uniforms:{
				seaColor: {
					value: new THREE.Color(0x007FC7)
				},
				_movSpeed: {
					value: 0.02
				},
				_noiseScale:{
					value: 0.025
				},
				_distortionMult: {
					value: 1.5
				},
				_movementNoiseTex:{
					value: this.grassMovementNoiseTex
				},
				_time: {
					value: 0
				},
			}
		});
		this.reflectionMesh = new THREE.Mesh(this.spaceBufferGeometry, this.reflectionMaterial);
		this.reflectionMesh.scale.y = -1;

		this.waterMaterial = new THREE.ShaderMaterial({
			transparent: true,
			vertexShader: WaterVertexShader,
			fragmentShader: WaterFragmentShader,
			side: THREE.FrontSide,
			depthWrite: false,
			uniforms: {
				...this.scene3d.getDirectionalLightUniforms(),
				...this.scene3d.getCloudUniforms()
			}
		})

		this.currentTime = 0;

		//this.grassBufferGeometry = new THREE.BufferGeometry();
		this.grassMaterial = new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
			vertexShader: GrassVertexShader,
			fragmentShader: GrassFragmentShader,
			uniforms: {
				_movSpeed: {
					value: 0.02
				},
				_noiseScale:{
					value: 0.025
				},
				_distortionMult: {
					value: 0.4
				},
				_movementNoiseTex:{
					value: this.grassMovementNoiseTex
				},
				_time: {
					value: 0
				},
				...this.scene3d.getDirectionalLightUniforms(),
				...this.scene3d.getCloudUniforms()
			}
		});

		this.currentGrassCount = 0;
		this.grassBladeMesh = null; 
		this.grassFlowersMesh = null;
		
		//this.grassMesh = new THREE.Mesh(this.grassBufferGeometry, this.grassMaterial);

		this.spaceMesh.position.set(this.centerPosition.y, 0, this.centerPosition.x);
		this.reflectionMesh.position.set(this.centerPosition.y, 0, this.centerPosition.x);

		this.randLUT = new RandomLUT(1e5);
	}

	//Relative to the vert position
	generateVertPositionColorBuffer(layerIndex, vertIndex, adjacent){
		const vert = this.vertices[vertIndex];
		const position = [];
		const color = [];

		const redColor = new THREE.Color(1,0.3,0.3);
		const whiteColor = new THREE.Color(1,1,1);

		for (let i = 0; i < 8; i++) {
			if(i < vert.polygonCollider.length){
				const i0 = i;
				const i1 = Num.ModGl(i + 1, vert.polygonCollider.length);
				
				const state = this.vertStateLayers[layerIndex].stateLayer[vertIndex] == VERT_STATE.WATER 		? 0 :
							  this.vertStateLayers[layerIndex].stateLayer[vertIndex] == VERT_STATE.BUILDING && this.vertStateLayers[layerIndex + 1].stateLayer[vertIndex] == VERT_STATE.AIR	? 1 :
							  this.vertStateLayers[layerIndex + 1].stateLayer[vertIndex] == VERT_STATE.BUILDING	? 2 :
							  3;

				const secColor = adjacent ? redColor : whiteColor;

				const height = 0.55;//(state == 0 || state == 1) ? 0.55 : 1.05;
				
				const v0 = Vec2.Zero(); //vert.pos;
				const v1 = Vec2.MultScalar(Vec2.Subtract(vert.polygonCollider[i0], vert.pos), 1.1);
				const v2 = Vec2.MultScalar(Vec2.Subtract(vert.polygonCollider[i1], vert.pos), 1.1);

				//Bottom
				position.push(v0.y, -height, v0.x);
				position.push(v1.y, -height, v1.x);
				position.push(v2.y, -height, v2.x);

				//Side panel
				position.push(v1.y, height, v1.x);
				position.push(v2.y, -height, v2.x);
				position.push(v1.y, -height, v1.x);				

				position.push(v1.y, height, v1.x);
				position.push(v2.y, height, v2.x);
				position.push(v2.y, -height, v2.x);

				for (let i = 0; i < 9; i++) {
					const midColor = state == 0 ? redColor : secColor;
					color.push(midColor.r, midColor.g, midColor.b, 0.75);
				}

				//Top
				position.push(v2.y, height, v2.x);
				position.push(v1.y, height, v1.x);
				position.push(v0.y, height, v0.x);

				for (let i = 0; i < 3; i++) {
					const top = state == 0 || state == 1;
					const topColor = top? redColor : secColor;
					color.push(topColor.r, topColor.g, topColor.b, 0.75);
				}
			}else{
				for (let i = 0; i < 12; i++) {
					position.push(0, 0, 0);
					color.push(0, 0, 0, 1);
				}
			}
		}
		return {
			position: position,
			color: color
		};
	}

	addSpaceToScene(scene){
		/*this.vertLayersInstancedMeshes.forEach(instanceMesh => {
			scene.add(instanceMesh);
		})*/
		
		let positions = [];
		let colors = [];

		const TriColor = new THREE.Color(0x2E75FF);
		/*this.triangles.forEach(tri => {
			const v0 = this.vertices[tri[0]].pos;
			const v1 = this.vertices[tri[1]].pos;
			const v2 = this.vertices[tri[2]].pos;

			const pushedVerts = Triangle2D.PushVertices(v0, v1, v2, 0.0);

			positions.push(pushedVerts[0].y, 0, pushedVerts[0].x);
			positions.push(pushedVerts[1].y, 0, pushedVerts[1].x);
			positions.push(pushedVerts[2].y, 0, pushedVerts[2].x);

			
			colors.push(TriColor.r, TriColor.g, TriColor.b, 1);
			colors.push(TriColor.r, TriColor.g, TriColor.b, 1);
			colors.push(TriColor.r, TriColor.g, TriColor.b, 1);
			
		});*/

		let minX = this.vertices[0].pos.x;
		let maxX = this.vertices[0].pos.x;
		let minY = this.vertices[0].pos.y;
		let maxY = this.vertices[0].pos.y;

		for (let i = 0; i < this.vertices.length; i++) {
			const vpos = this.vertices[i].pos;
			if(minX > vpos.x){
				minX = vpos.x;
			}
			if(maxX < vpos.x){
				maxX = vpos.x;
			}
			if(minY > vpos.y){
				minY = vpos.y;
			}
			if(maxY < vpos.y){
				maxY = vpos.y;
			}
		}

		const p00 = new Vec3(minY - 0.2, 0, minX - 0.2);
		const p01 = new Vec3(maxY + 0.2, 0, minX - 0.2);
		const p10 = new Vec3(minY - 0.2, 0, maxX + 0.2);
		const p11 = new Vec3(maxY + 0.2, 0, maxX + 0.2);

		const cloudBoundsMin = new Vec3(minY - 4 + this.centerPosition.y, 0, minX - 4 + this.centerPosition.x);
		const cloudBoundsMax = new Vec3(maxY + 4 + this.centerPosition.y, 0, maxX + 4 + this.centerPosition.x);

		this.scene3d.setCloudRenderSpace(cloudBoundsMin, cloudBoundsMax);

		positions.push(p10.x, p10.y, p10.z);
		positions.push(p01.x, p01.y, p01.z);
		positions.push(p00.x, p00.y, p00.z);
		
		positions.push(p11.x, p11.y, p11.z);
		positions.push(p01.x, p01.y, p01.z);
		positions.push(p10.x, p10.y, p10.z);

		const triangleGeometry = new THREE.BufferGeometry();
		function disposeArray() {this.array = null;}
		triangleGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
		//triangleGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 4 ).onUpload( disposeArray ) );
		triangleGeometry.computeBoundingBox();

		const triangleMesh = new THREE.Mesh( triangleGeometry, this.waterMaterial );
		triangleMesh.position.set(this.centerPosition.y, 0, this.centerPosition.x);
		this.scene3d.scene.add( triangleMesh );

		//Geneate space border
		let borderTrianglesPosition = [];
		let borderTrianglesColor = [];
		const topColor = new THREE.Color(0.8,0.3,0.3);
		const sideColor = new THREE.Color(0.6,0.1,0.1);
		const innerSideColor = new THREE.Color(0.2,0.2,0.5);
		const height = 0.1;
		const width = 0.125;
		this.triangles.forEach(tri => {
			let outerCount = 0;
			tri.forEach(tv=>{
				if(this.vertices[tv].outer){
					outerCount++;
				}
			});
			
			if(outerCount > 0){
				const vertToUse = tri.findIndex(v=> {
					return outerCount == 1 ? this.vertices[v].outer : !this.vertices[v].outer;
				});
	
				if(outerCount == 1){
					const v0 = this.vertices[tri[vertToUse]].pos;
					
					const n0 = Num.ModGl(vertToUse - 1, 3);
					const n1 = Num.ModGl(vertToUse + 1, 3);
					
					const v1 = this.vertices[tri[n0]].pos;
					const v2 = this.vertices[tri[n1]].pos;

					const p1 = Vec2.Zero();
					const p2 = Vec2.Zero();

					Vec2.Add(Vec2.MultScalar(Vec2.Subtract(v1, v0, p1), width, p1), v0, p1);
					Vec2.Add(Vec2.MultScalar(Vec2.Subtract(v2, v0, p2), width, p2), v0, p2);

					borderTrianglesPosition.push(v0.y, height, v0.x);
					borderTrianglesPosition.push(p1.y, height, p1.x);
					borderTrianglesPosition.push(p2.y, height, p2.x);

					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);

					borderTrianglesPosition.push(p1.y, height, p1.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, height, p2.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, 0.0, p2.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);

					borderTrianglesPosition.push(p1.y, 0.0, p1.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, 0.0, p2.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p1.y, height, p1.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
				}else if(outerCount == 2){
					const v0 = this.vertices[tri[vertToUse]].pos;
					
					const n0 = Num.ModGl(vertToUse - 1, 3);
					const n1 = Num.ModGl(vertToUse + 1, 3);
					
					const v1 = this.vertices[tri[n0]].pos;
					const v2 = this.vertices[tri[n1]].pos;

					const p1 = Vec2.Zero();
					const p2 = Vec2.Zero();

					Vec2.Add(Vec2.MultScalar(Vec2.Subtract(v1, v0, p1), 1-width, p1), v0, p1);
					Vec2.Add(Vec2.MultScalar(Vec2.Subtract(v2, v0, p2), 1-width, p2), v0, p2);

					borderTrianglesPosition.push(p1.y, height, p1.x);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);
					borderTrianglesPosition.push(v1.y, height, v1.x);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, height, p2.x);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);

					borderTrianglesPosition.push(v1.y, height, v1.x);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);
					borderTrianglesPosition.push(v2.y, height, v2.x);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, height, p2.x);
					borderTrianglesColor.push(topColor.r, topColor.g, topColor.b, 1.0);

					//Side
					borderTrianglesPosition.push(v1.y, height, v1.x);
					borderTrianglesColor.push(sideColor.r, sideColor.g, sideColor.b, 1.0);
					borderTrianglesPosition.push(v2.y, height, v2.x);
					borderTrianglesColor.push(sideColor.r, sideColor.g, sideColor.b, 1.0);
					borderTrianglesPosition.push(v2.y, 0.0, v2.x);
					borderTrianglesColor.push(sideColor.r, sideColor.g, sideColor.b, 1.0);

					borderTrianglesPosition.push(v1.y, 0.0, v1.x);
					borderTrianglesColor.push(sideColor.r, sideColor.g, sideColor.b, 1.0);
					borderTrianglesPosition.push(v2.y, 0.0, v2.x);
					borderTrianglesColor.push(sideColor.r, sideColor.g, sideColor.b, 1.0);
					borderTrianglesPosition.push(v1.y, height, v1.x);
					borderTrianglesColor.push(sideColor.r, sideColor.g, sideColor.b, 1.0);

					borderTrianglesPosition.push(p1.y, height, p1.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, height, p2.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, 0.0, p2.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);

					borderTrianglesPosition.push(p1.y, 0.0, p1.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p2.y, 0.0, p2.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
					borderTrianglesPosition.push(p1.y, height, p1.x);
					borderTrianglesColor.push(innerSideColor.r, innerSideColor.g, innerSideColor.b, 1.0);
				}else{
					throw new Error("No triangle can have 3 outer vertices");
				}
			}
		});

		const borderMaterial = new THREE.MeshBasicMaterial({
			color: new THREE.Color(0xFFFFFF),
			side: THREE.DoubleSide,
			vertexColors: true,
		});

		const borderGeometry = new THREE.BufferGeometry();
		borderGeometry.setAttribute('position', new THREE.Float32BufferAttribute(borderTrianglesPosition, 3));
		borderGeometry.setAttribute('color', new THREE.Float32BufferAttribute(borderTrianglesColor, 4));

		const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
		borderMesh.position.set(this.centerPosition.y, 0, this.centerPosition.x);

		this.scene3d.scene.add( borderMesh );
		this.scene3d.scene.add( this.spaceMesh );
		this.scene3d.scene.add( this.reflectionMesh );
	}

	rayToPolygonPlane(planeHeight, ray, layerIndex, predicate){
		const plane = new THREE.Plane(new THREE.Vector3(0,1,0), planeHeight);
		const planeIntersection = new THREE.Vector3(0,0,0);
		ray.intersectPlane(plane, planeIntersection);
		if(planeIntersection != null){
			const stateLayer = this.vertStateLayers[layerIndex].stateLayer;
			const pos2d = Vec2.Subtract(new Vec2(planeIntersection.z, planeIntersection.x), this.centerPosition);
			for (let vertIndex = 0; vertIndex < this.vertices.length; vertIndex++) {
				const vert = this.vertices[vertIndex];
				if(!vert.outer && predicate(stateLayer[vertIndex])){
					if(Polygon2D.PointInsidePolygon(pos2d, vert.polygonCollider)){
						return vertIndex;
					}
				}
			}
		}
		return -1;
	}

	/**
	 * 
	 * @param {THREE.Ray} ray 
	 */
	raycastToSpace(ray){
		const currentLayer = Num.Clamp(Math.floor(ray.origin.y), 0, maxVerticalLayers - 1);
		const dotVertical = Vec3.Dot(ray.direction, new Vec3(0,1,0));

		//const plane = new THREE.Plane(new THREE.Vector3(0,1,0));
		const ray2dDir = new Vec2(ray.direction.z, ray.direction.x);
		const ray2dOrigin = Vec2.Subtract(new Vec2(ray.origin.z, ray.origin.x), this.centerPosition);

		const len2d = Vec2.Length(ray2dDir);
		const ray2d = len2d > 0.001 ? new Ray2D( ray2dOrigin, Vec2.Normalize(ray2dDir)) : null;
		if(dotVertical < 0){
			for (let layerIndex = currentLayer; layerIndex >= 0; layerIndex--) {
				//Check top part of the vertex
				const planeHeight = -layerIndex - 0.5;

				if(ray.origin.y >= -planeHeight){
					const vertIndex = this.rayToPolygonPlane(planeHeight, ray, layerIndex, 
						(state)=>{return state != VERT_STATE.AIR && state != VERT_STATE.WATER;})
					if(vertIndex != -1){
						return {
							layerIndex,
							vertIndex: vertIndex,
							adjacentIndex: -1
						};
					}
				}

				//Check sides of vertex
				if(ray2d != null){
					const layerIndex1 = layerIndex + 1;
					const layer = this.vertStateLayers[layerIndex];
					if(layer.inUse){
						let minDistance = -1;
						let hitData = {
							vertIndex: -1,
							adjacentIndex: -1
						}
						//Collide with all the polygon faces in 2d space
						for (let vertIndex = 0; vertIndex < this.vertices.length; vertIndex++) {
							if(layer.stateLayer[vertIndex] == VERT_STATE.BUILDING)
							{
								const vert = this.vertices[vertIndex];
								const polyCollider = vert.polygonCollider;
								const adjacentVertices = vert.adjacentVertices;
								for (let pIndex = 0; pIndex < polyCollider.length; pIndex++) {
									const i0 = pIndex;
									const i1 = Num.ModGl(pIndex + 1, polyCollider.length);
									
									const adVertIndex = adjacentVertices[i0];
									if(layer.stateLayer[adVertIndex] != VERT_STATE.BUILDING){
										const edge = {a: polyCollider[i0], b: polyCollider[i1]}
										let hitInfo = {};
										if(Ray2D.RayLineIntersect(ray2d, edge, hitInfo)){
											if(minDistance == -1 || hitInfo.t1 < minDistance ){
												const hitPosition3d = Vec3.Add(Vec3.MultScalar(ray.direction, hitInfo.t1 / len2d), ray.origin);
												if(hitPosition3d.y >= layerIndex - 0.5 && hitPosition3d.y < layerIndex + 0.5){
													minDistance = hitInfo.t1,
													hitData.vertIndex = vertIndex;
													hitData.adjacentIndex = adVertIndex;
												}
											}
										}
									}
								}
							}
						}
						//Check if the collision is valid in 3d space
						if(minDistance != -1){
							return {
								layerIndex,
								vertIndex: hitData.vertIndex,
								adjacentIndex: hitData.adjacentIndex
							}
						}
					}
				}

				if(layerIndex == 0){
					const planeHeight = 0.0;
					const vertIndex = this.rayToPolygonPlane(planeHeight, ray, 0, 
						(state)=>{return state != VERT_STATE.AIR;})
					if(vertIndex != -1){
						return {
							layerIndex,
							vertIndex: vertIndex,
							adjacentIndex: -1
						};
					}
				}

				 
			}
			/*for (let layerIndex = currentLayer; layerIndex >= 0; layerIndex--) {
				const layer = this.vertStateLayers[layerIndex];
				//Check collision in layer section
				if(ray2d != null){
					if(layerIndex < maxVerticalLayers - 1){
						const layerIndex1 = layerIndex + 1;
						const topLayer = this.vertStateLayers[layerIndex1];
						if(layer.inUse && topLayer.inUse){
							let minDistance = -1;
							let hitData = {
								vertIndex: -1,
								adjacentIndex: -1
							}
							//Collide with all the polygon faces in 2d space
							for (let vertIndex = 0; vertIndex < this.vertices.length; vertIndex++) {
								if(	(layer.stateLayer[vertIndex] == VERT_STATE.BUILDING) &&
									topLayer.stateLayer[vertIndex] == VERT_STATE.BUILDING)
								{
									const vert = this.vertices[vertIndex];
									const polyCollider = vert.polygonCollider;
									const adjacentVertices = vert.adjacentVertices;
									for (let pIndex = 0; pIndex < polyCollider.length; pIndex++) {
										const i0 = pIndex;
										const i1 = Num.ModGl(pIndex + 1, polyCollider.length);
										
										const adVertIndex = adjacentVertices[i0];
										if(layer.stateLayer[adVertIndex] != VERT_STATE.BUILDING){
											const edge = {a: polyCollider[i0], b: polyCollider[i1]}
											let hitInfo = {};
											if(Ray2D.RayLineIntersect(ray2d, edge, hitInfo)){
												if(minDistance == -1 || hitInfo.t1 < minDistance ){
													const hitPosition3d = Vec3.Add(Vec3.MultScalar(ray.direction, hitInfo.t1 / len2d), ray.origin);
													if(hitPosition3d.y >= layerIndex && hitPosition3d.y < layerIndex + 1){
														minDistance = hitInfo.t1,
														hitData.vertIndex = vertIndex;
														hitData.adjacentIndex = adVertIndex;
													}
												}
											}
										}
									}
								}
							}
							//Check if the collision is valid in 3d space
							if(minDistance != -1){
								return {
									layerIndex,
									vertIndex: hitData.vertIndex,
									adjacentIndex: hitData.adjacentIndex
								}
							}
						}
					}
				}

				//If a valid hit on the section was not found, then try finding a valid collision on the floor
				//Check collision in layer floor
				if(layerIndex < maxVerticalLayers - 2){
					plane.constant = -layerIndex;
					const planeIntersection = new THREE.Vector3(0,0,0);
					ray.intersectPlane(plane, planeIntersection);
					if(planeIntersection != null){
						const belowLayer = this.vertStateLayers[layerIndex];//this.vertStateLayers[layerIndex > 0 ? layerIndex - 1 : 0];
						const pos2d = new Vec2(planeIntersection.z, planeIntersection.x);
						for (let vertIndex = 0; vertIndex < this.vertices.length; vertIndex++) {
							const vert = this.vertices[vertIndex];
							if(!vert.outer && (belowLayer.stateLayer[vertIndex] == VERT_STATE.BUILDING || 
								(layerIndex == 0 && belowLayer.stateLayer[vertIndex] == VERT_STATE.WATER))){
								if(Polygon2D.PointInsidePolygon(pos2d, vert.polygonCollider)){
									return {
										layerIndex,
										vertIndex: vertIndex,
										adjacentIndex: -1
									}
								}
							}
						}
					}
				}
				
			}*/
		}

		return {
			layerIndex: -1,
			vertIndex: -1,
			adjacentIndex: -1
		};
	}

	changeInstanceScaleColor(layerIndex, vertIndex){
		const vert = this.vertices[vertIndex];
		const state = this.vertStateLayers[layerIndex].stateLayer[vertIndex];
		const instanceMatrix = new THREE.Matrix4();
		instanceMatrix.setPosition(vert.pos.y, layerIndex, vert.pos.x);
		instanceMatrix.scale(new THREE.Vector3(1,1,1).multiplyScalar(VERT_STATE[state].scale));
		this.vertLayersInstancedMeshes[layerIndex].setMatrixAt(vertIndex, instanceMatrix);
		this.vertLayersInstancedMeshes[layerIndex].setColorAt(vertIndex, VERT_STATE[state].color);

		this.vertLayersInstancedMeshes[layerIndex].instanceMatrix.needsUpdate = true;
		this.vertLayersInstancedMeshes[layerIndex].instanceColor.needsUpdate = true;
	}

	setVertStateToBuilding(hitInfo){
		if(hitInfo.layerIndex != -1 && hitInfo.vertIndex != -1){
			const changeVertIndex = hitInfo.adjacentIndex == -1 ? hitInfo.vertIndex : hitInfo.adjacentIndex;
			if(!this.vertices[changeVertIndex].outer){
				let layerIndex = hitInfo.layerIndex;
				if(this.vertStateLayers[layerIndex].stateLayer[changeVertIndex] == VERT_STATE.BUILDING && hitInfo.layerIndex < maxVerticalLayers - 2){
					layerIndex++;
				}

				this.vertStateLayers[layerIndex].stateLayer[changeVertIndex] = VERT_STATE.BUILDING;
				this.changeInstanceScaleColor(layerIndex, changeVertIndex);
				this.vertStateLayers[layerIndex].inUse = true;
			}
		}
	}

	clearVertState(hitInfo){
		if(hitInfo.layerIndex != -1 && hitInfo.vertIndex != -1){
			const changeVertIndex = hitInfo.vertIndex;
			if(!this.vertices[changeVertIndex].outer){
				let layerIndex = hitInfo.layerIndex;
				this.vertStateLayers[layerIndex].stateLayer[changeVertIndex] = layerIndex == 0 ? VERT_STATE.WATER : VERT_STATE.AIR;
				this.changeInstanceScaleColor(layerIndex, changeVertIndex);
			}
		}
	}

	grassBladeGeometry(){
		const grassRot = new Vec2(1,0);
							
		const p0 = Vec2.MultScalar(grassRot, grassWidth * 0.75);
		const p1 = Vec2.MultScalar(grassRot,-grassWidth * 0.75);

		const p01 = Vec2.MultScalar(grassRot, grassWidth * 0.4);
		const p11 = Vec2.MultScalar(grassRot,-grassWidth * 0.4);

		let positions = [];
		let uvs = [];

		positions.push(
			p0.x, 0					, p0.y,
			p1.x, 0					, p1.y,
			p01.x, grassMidHeight	, p01.y
		);

		uvs.push(
			0,	0,
			0,	0,
			0,	0.5
		);

		positions.push(
			p1.x, 0					, p1.y,
			p01.x, grassMidHeight	, p01.y,
			p11.x, grassMidHeight	, p11.y
		);

		uvs.push(
			0,	0,
			0,	0.5,
			0,	0.5
		);

		positions.push(
			p01.x, 			grassMidHeight	, p01.y,
			p11.x, 			grassMidHeight	, p11.y,
			0, 	grassHeight		, 0
			
		);

		uvs.push(
			0,	0.5,
			0,	0.5,
			0,	1
		);

		const grassBufferGeometry = new THREE.BufferGeometry();
		grassBufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		grassBufferGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
		return grassBufferGeometry;
	}

	generateGrassInstancedMeshes(flowerGeometryBuffer){
		//console.log("Generate instance mesh");
		this.grassBladeMesh = new THREE.InstancedMesh(this.grassBladeGeometry(), this.grassMaterial, this.currentGrassCount);
		this.grassFlowersMesh = new THREE.InstancedMesh(flowerGeometryBuffer, this.grassMaterial, this.currentGrassCount);

		this.grassBladeMesh.position.set(this.centerPosition.y, 0.0, this.centerPosition.x);
		this.grassFlowersMesh.position.set(this.centerPosition.y, 0.0, this.centerPosition.x);

		this.scene3d.scene.add(this.grassBladeMesh);
		this.scene3d.scene.add(this.grassFlowersMesh);
	}

	updateSpaceGeometry(modelManager, extraPropLoader){
		let geometryCollection = [];
		let grassTrianglesToAdd = [];		

		const startAddModel = performance.now();

		for (let layerIndex = 0; layerIndex < maxVerticalLayers - 1; layerIndex++) { //layer loop
			for (let prismIndex = 0; prismIndex < this.triangles.length; prismIndex++) { //prism loop
				const tri = this.triangles[prismIndex];
				
				const stateLayer0 = this.vertStateLayers[layerIndex].stateLayer;
				const stateLayer1 = this.vertStateLayers[layerIndex + 1].stateLayer;

				const prismState = [
					[stateLayer0[tri[0]], stateLayer1[tri[0]]],
					[stateLayer0[tri[1]], stateLayer1[tri[1]]],
					[stateLayer0[tri[2]], stateLayer1[tri[2]]],
				];

				//console.log(prismState);
				const modelCount = modelManager.models.length;
				const models = modelManager.models;
				let foundValidTile = false;
				for (let modelIndex = 0; modelIndex < modelCount; modelIndex++) {
					const model = models[modelIndex];
					const p0State = model.prismState[0];
					//console.log(model);
					//console.log(prismState);
					const baseVert = prismState.findIndex(ps => ps[0] == p0State[0] && ps[1] == p0State[1]);
					
					
					if(baseVert != -1){//One of the verticals is present
						//Check if the other verticals match
						const prevVertical = prismState[Num.ModGl(baseVert - 1, 3)];
						const nextVertical = prismState[Num.ModGl(baseVert + 1, 3)];

						const p1State = model.prismState[1];
						const p2State = model.prismState[2];

						if(
							prevVertical[0] == p1State[0] && prevVertical[1] == p1State[1] &&
							nextVertical[0] == p2State[0] && nextVertical[1] == p2State[1]
						){//Is the corrent model, generate the geometry
							const basePos = this.vertices[tri[baseVert]].pos;

							const v1 = this.vertices[tri[Num.ModGl(baseVert - 1, 3)]].pos;
							const v2 = this.vertices[tri[Num.ModGl(baseVert + 1, 3)]].pos;

							const relativeV1 = Vec2.Subtract(v1, basePos);
							const relativeV2 = Vec2.Subtract(v2, basePos);

							//Generate position buffer form model
							let positions = [];
							model.barycentricPositions.forEach(bp => {
								const pos2d = 
									Vec2.Add(basePos, 
										Vec2.Add(
											Vec2.MultScalar(relativeV1, bp.weights.x), 
											Vec2.MultScalar(relativeV2, bp.weights.y)
										)
									);
								positions.push(pos2d.y, bp.height + layerIndex, pos2d.x);
							});

							const sectionGeometry = model.geometry.clone();
							sectionGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
							geometryCollection.push(sectionGeometry);

							grassTrianglesToAdd.push({
								grassTriangles: model.grassTriangles,
								layerIndex,
								basePos,
								relativeV1,
								relativeV2
							})
							//Generate grass and flowers
							/**/
							
							foundValidTile = true;
							break;
						}
					}
				}
				if(stateLayer0[tri[0]] == VERT_STATE.BUILDING && !foundValidTile){
					//console.log("Not found suitable tile", JSON.stringify(prismState));
				}
			}
		}

		const endAddModel = performance.now();
		//console.log("Add Model : Time taken: ", endAddModel - startAddModel, "ms");

		let grassBladeMatrices = [];
		let grassFlowerMatrices = [];

		const startAddGrass = performance.now();

		for (let gtIndex = 0; gtIndex < grassTrianglesToAdd.length; gtIndex++) {
			const gt = grassTrianglesToAdd[gtIndex];
			for (let gTriIndex = 0; gTriIndex < gt.grassTriangles.length; gTriIndex++) {
				const gTri = gt.grassTriangles[gTriIndex];
				let triPos = [];
				gTri.forEach(bp => {
					const pos2d = 
						Vec2.Add(gt.basePos, 
							Vec2.Add(
								Vec2.MultScalar(gt.relativeV1, bp.weights.x), 
								Vec2.MultScalar(gt.relativeV2, bp.weights.y)
						)
					);
					triPos.push({
						pos: new Vec2(pos2d.y, pos2d.x),
						h: bp.height + gt.layerIndex
					});
				});
				const bHeight = triPos[0].h;

				const minX = Math.min(triPos[0].pos.x, triPos[1].pos.x, triPos[2].pos.x);
				const maxX = Math.max(triPos[0].pos.x, triPos[1].pos.x, triPos[2].pos.x);

				const minY = Math.min(triPos[0].pos.y, triPos[1].pos.y, triPos[2].pos.y);
				const maxY = Math.max(triPos[0].pos.y, triPos[1].pos.y, triPos[2].pos.y);

				const countX = Math.ceil((maxX - minX)	/	(grassWidth * 0.25));
				const countY = Math.ceil((maxY - minY)	/	(grassWidth * 0.25));

				const triBPos = new Vec2(minX, minY);

				const grassCenter = Vec2.Zero();
				const randMatrix = new THREE.Matrix4();
				const randScalevec = new THREE.Vector3(0,0,0);
				for (let i = 0; i < countX - 1; i++) {
					for (let j = 0; j < countY - 1; j++) {
						const randPos = this.randLUT.next() * 0.4;
						grassCenter.x = (i + 0.3 + randPos) * grassWidth + triBPos.x;
						grassCenter.y = (j + 0.3 + randPos) * grassWidth + triBPos.y;
						
						const valid = Triangle2D.IsPointInTriangle(grassCenter,
							triPos[0].pos, triPos[1].pos, triPos[2].pos);
						if(valid){
							if(this.randLUT.next() > 0.95){
								randMatrix.makeRotationY(this.randLUT.next() * 6.28);
								randMatrix.setPosition(grassCenter.x, bHeight, grassCenter.y);
								const randScale = 0.85 + this.randLUT.next() * 0.3;
								randScalevec.set(randScale, randScale, randScale);
								randMatrix.scale(randScalevec);

								grassFlowerMatrices.push(randMatrix.clone());
							}else{
								randMatrix.makeRotationY(this.randLUT.next() * 6.28);
								randMatrix.setPosition(grassCenter.x, bHeight, grassCenter.y);
								const randScale = 0.6 + this.randLUT.next() * 0.8;
								randScalevec.set(1.5, randScale, 1.5);
								randMatrix.scale(randScalevec);

								grassBladeMatrices.push(randMatrix.clone());
							}
						}
					}
				}
			}
		}

		if(this.grassBladeMesh == null && this.grassFlowersMesh == null && (grassBladeMatrices.length > 0 || grassFlowerMatrices.length > 0)){
			this.currentGrassCount = Math.max(grassBladeMatrices.length, grassFlowerMatrices.length) * 2;

			this.generateGrassInstancedMeshes(extraPropLoader.extraProps.flower.clone());
		}else if(this.currentGrassCount < grassBladeMatrices.length || this.currentGrassCount < grassFlowerMatrices.length){
			this.scene3d.scene.remove(this.grassBladeMesh);
			this.scene3d.scene.remove(this.grassFlowersMesh);
			
			this.grassBladeMesh.dispose();
			this.grassFlowersMesh.dispose();

			this.currentGrassCount = this.currentGrassCount * 2;

			this.generateGrassInstancedMeshes(extraPropLoader.extraProps.flower.clone());
		}

		if(this.grassBladeMesh != null){
			grassBladeMatrices.forEach((gbMat, index) => {
				this.grassBladeMesh.setMatrixAt(index, gbMat);
			});
			this.grassBladeMesh.count = grassBladeMatrices.length;
			this.grassBladeMesh.instanceMatrix.needsUpdate = true;
		}

		if(this.grassFlowersMesh != null){
			grassFlowerMatrices.forEach((gfMat, index) => {
				this.grassFlowersMesh.setMatrixAt(index, gfMat);
			});
			this.grassFlowersMesh.count = grassFlowerMatrices.length;
			this.grassFlowersMesh.instanceMatrix.needsUpdate = true;
		}

		const endAddGrass = performance.now();

		//console.log("Add Grass : Time taken: ", endAddGrass - startAddGrass, "ms", "Blade count", grassBladeMatrices.length, "Flower Count:", grassFlowerMatrices.length);
		
		
		if(geometryCollection.length > 0){
			this.spaceBufferGeometry.dispose();
			this.spaceBufferGeometry = BufferGeometryUtils.mergeBufferGeometries(geometryCollection);
			//this.spaceBufferGeometry = BufferGeometryUtils.mergeVertices(this.spaceBufferGeometry, 0.001);
			this.spaceBufferGeometry.computeVertexNormals();
			//this.spaceBufferGeometry.computeTangents();
			//console.log(this.spaceBufferGeometry);
		}else{
			this.spaceBufferGeometry.dispose();
			this.spaceBufferGeometry = new THREE.BufferGeometry();
		}
		this.spaceMesh.geometry = this.spaceBufferGeometry;
		this.reflectionMesh.geometry = this.spaceBufferGeometry;
	}

	update(dt){
		this.currentTime += dt;
		this.grassMaterial.uniforms._time.value = (this.currentTime) / 1000;
		this.reflectionMaterial.uniforms._time.value = (this.currentTime) / 1000;

		this.scene3d.updateLightUniforms(this.grassMaterial.uniforms);
		this.scene3d.updateLightUniforms(this.spaceMaterial.uniforms);
		this.scene3d.updateLightUniforms(this.waterMaterial.uniforms);

		this.scene3d.updateCloudUniforms(this.grassMaterial.uniforms);
		this.scene3d.updateCloudUniforms(this.spaceMaterial.uniforms);
		this.scene3d.updateCloudUniforms(this.waterMaterial.uniforms);
	}
}