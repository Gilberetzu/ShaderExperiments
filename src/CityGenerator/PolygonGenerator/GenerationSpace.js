import Polygon2D from "../Geometry/Polygon2D";
import Num from "../Math/Num";
import Vec2 from "../Math/Vec2";
import * as THREE from 'three';
import Draw from "../Draw";
import Triangle2D from "../Geometry/Triangle2D";

const maxVerticalLayers = 8;



export default class GenerationSpace{
	constructor(vertices, triangles, edgeAverageLenght){
		this.vertices = vertices.map(vert => {
			let polygon = [];
			if(!vert.outer){
				let edges = vert.connectedTriangles.map(tri => {
					const vIndex = tri.verts.findIndex(v => v == vert);
					if(vIndex == -1){
						throw new Error("Vertex not found on connected triangle");
					}else{
						return [tri.verts[Num.ModGl(vIndex + 1, 3)], tri.verts[Num.ModGl(vIndex + 2, 3)]];
					}
				});
				let polygonVerts = [edges[0][0], edges[0][1]];
				edges.splice(0, 1);
				while(edges.length > 1){
					for (let i = 0; i < edges.length; i++) {
						const edge = edges[i];
						if(edge[0] == polygonVerts[polygonVerts.length - 1]){
							polygonVerts.push(edge[1]);
							edges.splice(i, 1);
							break;
						}else if(edge[1] == polygonVerts[polygonVerts.length - 1]){
							polygonVerts.push(edge[0]);
							edges.splice(i, 1);
							break;
						}
					}
				}
				polygon = polygonVerts.map(pvert => {
					return vertices.findIndex(v => v == pvert);
				});
			}
			return {
				pos: Vec2.MultScalar(vert.pos, 1/edgeAverageLenght),
				outer: vert.outer,
				polygon,
				polygonCollider: []
			};
		});

		this.vertices.forEach(vert => {
			if(!vert.outer){
				//fill polygon collider with positions
				let polygonCollider = vert.polygon.map(pvert => {
					return this.vertices[pvert].pos;
				});
				const isClockwise = Polygon2D.ClockwiseOrder(polygonCollider);
				if(!isClockwise){
					polygonCollider.reverse();
				}
				for (let i = 0; i < polygonCollider.length; i++) {
					const pVec = polygonCollider[i];
					const toCenter = Vec2.Subtract(vert.pos, pVec);
					Vec2.DivScalar(toCenter, 2, toCenter);
					vert.polygonCollider.push(Vec2.Add(pVec, toCenter));
				}
			}
		});

		this.triangles = triangles.map(tri => {
			return [
				vertices.findIndex(v => v == tri.verts[0]),
				vertices.findIndex(v => v == tri.verts[1]),
				vertices.findIndex(v => v == tri.verts[2])
			];
		});

		this.vertStateLayers = [];
		for (let i = 0; i < maxVerticalLayers; i++) {
			const stateLayer = new Array(this.vertices.length);
			for (let j = 0; j < stateLayer.length; j++) {
				stateLayer[j] = 0;
			}
			this.vertStateLayers.push(stateLayer);
		};
	}

	addSpaceToScene(scene){
		const vertGeometry = new THREE.SphereBufferGeometry(0.1, 4, 4);
		const vertMaterial = new THREE.MeshBasicMaterial( { color: Draw.HexColor(1, 1, 1) } );
		const outsideVerts = new THREE.InstancedMesh(vertGeometry, vertMaterial, this.vertices.length);
		
		for (let i = 0; i < this.vertices.length; i++) {
			const vert = this.vertices[i];
			const instanceMatrix = new THREE.Matrix4();
			instanceMatrix.setPosition(vert.pos.y, 0, vert.pos.x);
			outsideVerts.setMatrixAt(i, instanceMatrix);
			const color =  new THREE.Color(Draw.RandomColor(0.5,0.5,0.5));
			outsideVerts.setColorAt(i,color);
		}
		outsideVerts.instanceMatrix.needsUpdate = true;
		outsideVerts.instanceColor.needsUpdate = true;
		scene.add(outsideVerts);

		let positions = [];
		let colors = [];
		this.triangles.forEach(tri => {
			const v0 = this.vertices[tri[0]].pos;
			const v1 = this.vertices[tri[1]].pos;
			const v2 = this.vertices[tri[2]].pos;

			const pushedVerts = Triangle2D.PushVertices(v0, v1, v2, 0.08);

			positions.push(pushedVerts[0].y, 0, pushedVerts[0].x);
			positions.push(pushedVerts[1].y, 0, pushedVerts[1].x);
			positions.push(pushedVerts[2].y, 0, pushedVerts[2].x);

			const newColor = new THREE.Color(Draw.RandomColor(0.3,0.3,0.3));
			colors.push(newColor.r, newColor.g, newColor.b, 1);
			colors.push(newColor.r, newColor.g, newColor.b, 1);
			colors.push(newColor.r, newColor.g, newColor.b, 1);
			
		});

		const triangleGeometry = new THREE.BufferGeometry();
		function disposeArray() {this.array = null;}
		triangleGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
		triangleGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 4 ).onUpload( disposeArray ) );
		triangleGeometry.computeBoundingBox();

		const triangleMaterial = new THREE.MeshBasicMaterial( {
			color: Draw.HexColor(1, 1, 1), side: THREE.DoubleSide, vertexColors: true
		} );

		const triangleMesh = new THREE.Mesh( triangleGeometry, triangleMaterial );
		scene.add( triangleMesh );
	}
}