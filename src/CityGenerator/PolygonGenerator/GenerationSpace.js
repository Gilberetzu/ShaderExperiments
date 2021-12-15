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
			let polyCollider = [];
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
						tvert: edgeTri[0].edge[1]
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
					polyCollider.push(Vec2.MultScalar(triCanvasCenter, 1/edgeAverageLenght));
				}
			}
			return {
				pos: Vec2.MultScalar(vert.pos, 1/edgeAverageLenght),
				outer: vert.outer,
				polygonCollider: polyCollider
			};
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

	//Relative to the vert position
	generateVertPositionColorBuffer(vertIndex){
		const vert = this.vertices[vertIndex];
		const position = [];
		const color = [];

		for (let i = 0; i < 8; i++) {
			if(i < vert.polygonCollider.length){
				const i0 = i;
				const i1 = Num.ModGl(i + 1, vert.polygonCollider.length);

				const secColor = new THREE.Color(Draw.HexColor(Math.random(), Math.random(), 0.1));
				
				const v0 = Vec2.Zero(); //vert.pos;
				const v1 = Vec2.MultScalar(Vec2.Subtract(vert.polygonCollider[i0], vert.pos), 1.05);//vert.polygonCollider[i0];
				const v2 = Vec2.MultScalar(Vec2.Subtract(vert.polygonCollider[i1], vert.pos), 1.05);//vert.polygonCollider[i1];

				//Bottom
				position.push(v2.y, -0.05, v2.x);
				position.push(v1.y, -0.05, v1.x);
				position.push(v0.y, -0.05, v0.x);

				//Side panel
				position.push(v1.y, -0.05, v1.x);
				position.push(v2.y, -0.05, v2.x);
				position.push(v1.y, 1.05, v1.x);

				position.push(v2.y, -0.05, v2.x);
				position.push(v2.y, 1.05, v2.x);
				position.push(v1.y, 1.05, v1.x);

				//Top
				position.push(v0.y, 1.05, v0.x);
				position.push(v1.y, 1.05, v1.x);
				position.push(v2.y, 1.05, v2.x);

				for (let i = 0; i < 12; i++) {
					color.push(secColor.r, secColor.g, secColor.b, 0.5);
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

		/*this.vertices.forEach(vert => {
			const newColor = new THREE.Color(Draw.HexColor(Math.random(), 0.25,0.25));
			const centerPos = vert.pos;
			for (let i = 0; i < vert.polygonCollider.length; i++) {
				const i0 = i;
				const i1 = Num.ModGl(i+1, vert.polygonCollider.length);

				positions.push(centerPos.y, 0, centerPos.x);
				positions.push(vert.polygonCollider[i0].y, 0, vert.polygonCollider[i0].x);
				positions.push(vert.polygonCollider[i1].y, 0, vert.polygonCollider[i1].x);

				colors.push(newColor.r, newColor.g, newColor.b, 1);
				colors.push(newColor.r, newColor.g, newColor.b, 1);
				colors.push(newColor.r, newColor.g, newColor.b, 1);
			}
		})*/

		const TriColor = new THREE.Color(0xff683b);
		this.triangles.forEach(tri => {
			const v0 = this.vertices[tri[0]].pos;
			const v1 = this.vertices[tri[1]].pos;
			const v2 = this.vertices[tri[2]].pos;

			const pushedVerts = Triangle2D.PushVertices(v0, v1, v2, 0.08);

			positions.push(pushedVerts[0].y, 0, pushedVerts[0].x);
			positions.push(pushedVerts[1].y, 0, pushedVerts[1].x);
			positions.push(pushedVerts[2].y, 0, pushedVerts[2].x);

			
			colors.push(TriColor.r, TriColor.g, TriColor.b, 1);
			colors.push(TriColor.r, TriColor.g, TriColor.b, 1);
			colors.push(TriColor.r, TriColor.g, TriColor.b, 1);
			
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

	getVertCollisionIndex(pos){
		for (let i = 0; i < this.vertices.length; i++) {
			const vert = this.vertices[i];
			if(!vert.outer){
				if(Polygon2D.PointInsidePolygon(pos, vert.polygonCollider)){
					return i;
				}
			}
		}
		return -1;
	}
}