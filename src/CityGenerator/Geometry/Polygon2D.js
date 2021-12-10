import Num from "../Math/Num";
import Vec2 from "../Math/Vec2";
import Triangle2D from "./Triangle2D";

//Polygon 2d - It is assumed it is a simple polygon (no intersecting edges and no holes)
export default class Polygon2D {
	/**
	 * Returns true if the Vertex is convex. The prev, current, and next have to be in clockwise order
	 * @param {Vec2} PrevVertex 
	 * @param {Vec2} Vertex 
	 * @param {Vec2} NextVertex 
	 */
	static IsConvex(PrevVertex, Vertex, NextVertex) {
		let toPrev = Vec2.Subtract(PrevVertex, Vertex);
		let toNext = Vec2.Subtract(NextVertex, Vertex);

		let c = Vec2.Cross(toPrev, toNext);
		return c >= 0;
	}

	static IsConvexPolygon(vertices) {
		let verts = [];
		if (!Polygon2D.ClockwiseOrder(vertices)) {
			for (let i = vertices.length - 1; i >= 0; i--) {
				verts.push(vertices[i]);
			}
		} else {
			verts = [...vertices];
		}
		let convex = true;
		for (let i = 0; i < verts.length; i++) {
			const prev = Num.ModGl(i - 1, verts.length);
			const current = i;
			const next = Num.ModGl(i + 1, verts.length);

			convex = convex && Polygon2D.IsConvex(verts[prev], verts[current], verts[next]);
			if (convex == false) {
				break;
			}
		}
		return convex;
	}

	static GetBoundingBox(vertices) {
		let vert = vertices[0];
		let maxX = vert.x; let minX = vert.x; let maxY = vert.y; let minY = vert.y;

		for (let i = 1; i < vertices.length; i++) {
			const v = vertices[i];
			if (v.x > maxX) maxX = v.x;
			if (v.x < minX) minX = v.x;
			if (v.y > maxY) maxY = v.y;
			if (v.y < minY) minY = v.y;
		}

		return {
			maxX,
			maxY,
			minX,
			minY,

			position: new Vec2(minX, minY),
			width: Math.abs(maxX - minX),
			height: Math.abs(maxY - minY)
		}
	}

	/**
	 * Returns true if the vertices are in a clockwise order
	 * @param {Array.<Vec2>} vertices 
	 * @returns 
	 */
	static ClockwiseOrder(vertices) {
		let sum = 0;
		for (let i = 0; i < vertices.length; i++) {
			let v = vertices[i];
			let nextIndex = i == vertices.length - 1 ? 0 : i + 1;
			let nv = vertices[nextIndex];

			sum += (nv.x - v.x) * (nv.y + v.y);
		}
		return sum > 0;
	}

	/**
	 * The Vertex list needs to be in clockwise order
	 * @param {Array.<Vec2>} vertices 
	 * @returns 
	 */
	static GetConcaveVertices(vertices) {
		let concaveVertices = [];
		for (let i = 0; i < vertices.length; i++) {
			let prevIndex = i == 0 ? vertices.length - 1 : i - 1;
			let nextIndex = i == vertices.length - 1 ? 0 : i + 1;

			let v = vertices[i];
			let pv = vertices[prevIndex];
			let nv = vertices[nextIndex];

			let convex = Polygon2D.IsConvex(pv, v, nv);
			if (!convex) concaveVertices.push(i);
		}
		return concaveVertices;
	}

	/**
	 * Winding number algorithm form https://web.archive.org/web/20130126163405/http://geomalgorithms.com/a03-_inclusion.html
	 * @param {Vec2} point 
	 * @param {Array.<Vec2>} polygonVertices 
	 * @return {Number} winding number
	 */
	static PointInsidePolygon(point, polygonVertices) {
		const isLeft = (p0, p1, p2) => {
			return ((p1.x - p0.x) * (p2.y - p0.y)) -
				((p2.x - p0.x) * (p1.y - p0.y));
		}
		const cIndex = (index) => index == polygonVertices.length ? 0 : index;

		let wn = 0;
		for (let i = 0; i < polygonVertices.length; i++) {
			const vi = polygonVertices[i]
			const vi_1 = polygonVertices[cIndex(i + 1)];

			if (vi.y <= point.y) {
				if (vi_1.y > point.y)
					if (isLeft(vi, vi_1, point) > 0)
						wn++;
			}
			else {
				if (vi_1.y <= point.y)
					if (isLeft(vi, vi_1, point) < 0)
						wn--;
			}
		}
		return wn;
	}

	static DelaunayTriangulation(vertices, polygon) {
		const DEBUG = true;

		if (DEBUG == false) {
			window.consoleBackup = {};
			//Create a backup of the logging functions
			window.consoleBackup.log = window.console.log;
			window.consoleBackup.group = window.console.group;
			window.consoleBackup.groupEnd = window.console.groupEnd;
			window.consoleBackup.groupCollapsed = window.console.groupCollapsed;
			//Change logging funtions to some empty ones
			window.console.log = () => { };
			window.console.group = () => { };
			window.console.groupEnd = () => { };
			window.console.groupCollapsed = () => { };
		}

		console.log(vertices.length);
		//Step 1
		/*Normalize coodinates of points. Scale the coordinates of the points so that they all lie between 0 and 1
		Normalization x` = (x - xmin) / dmax ; y` = (y - ymin) / dmax
		Where dmax is max( xmax - xmin, ymax - ymin )*/

		let xmin = vertices[0].x;
		let xmax = vertices[0].x;
		let ymin = vertices[0].y;
		let ymax = vertices[0].y;
		for (let i = 1; i < vertices.length; i++) {
			const v = vertices[i];

			if (v.x < xmin) xmin = v.x;
			if (v.x > xmax) xmax = v.x;

			if (v.y < ymin) ymin = v.y;
			if (v.y > ymax) ymax = v.y;
		}
		let dmax = Math.max(xmax - xmin, ymax - ymin);

		console.log("dmax", dmax);
		console.log("xmin", xmin);
		console.log("ymin", ymin);

		/**
		 * @type {Array.<Vec2>}
		 */
		let normVerts = [];
		vertices.forEach(v => {
			const nv = new Vec2(
				(v.x - xmin) / dmax,
				(v.y - ymin) / dmax
			)
			normVerts.push(nv);
		});

		//Step2
		/*Sort points into bins. Cover the region to be triangulated by a rectangular grid so that each 
		rectangle (bin) contains roughly N^1/2 points. --Read more on the paper
		This step is going to be skipped as it is just meant to reduce the time complexity of the algorithm
		*/

		//Step3
		/*Establish a supertriangle. Select three dummy points to formm a supertriangle that completly encompasses
		all of the points to be triangulated. This supertriangle initially defines the Delaunay triangulation which
		is comprised of a single triangle.

		The points are not going to be added to the vertices array, as they are not going to be used after the triangulation is finished
		*/
		const N1 = new Vec2(-1.2, -0.05); //new Vec2(-1.5, -0.5);
		const N2 = new Vec2(2.2, -0.05); //new Vec2(2.5	, -0.5);
		const N3 = new Vec2(0.5, 1.5); //new Vec2(0.5	, 2);

		const invertNorm = (vert) => {
			return new Vec2(
				(vert.x * dmax) + xmin,
				(vert.y * dmax) + ymin
			);
		}

		const getVertex = (index) => {
			if (index == -1) {
				return N1;
			}
			else if (index == -2) {
				return N2;
			}
			else if (index == -3) {
				return N3;
			}
			else {
				return normVerts[index];
			}
		}

		const getVertexReal = (index) => {
			if (index == -1) {
				return invertNorm(N1);
			} else if (index == -2) {
				return invertNorm(N2);
			} else if (index == -3) {
				return invertNorm(N3);
			} else {
				return vertices[index];
			}
		}
		// Whenever a vertex position is needed, this funciton should be used instead of doing the lookup directly
		//on the vertices array, as this function gives the vertex position of the super triangle vertices

		let newTriangle = (verts) => {
			return {
				verts,
				adjacent: [null, null, null]
			};
		}
		const getAdjacentIndex = (triVerts, e0, e1) => {
			if ((triVerts[0] == e0 && triVerts[1] == e1) || (triVerts[1] == e0 && triVerts[0] == e1)) {
				return 0;
			} else if ((triVerts[1] == e0 && triVerts[2] == e1) || (triVerts[2] == e0 && triVerts[1] == e1)) {
				return 1;
			} else if ((triVerts[2] == e0 && triVerts[0] == e1) || (triVerts[0] == e0 && triVerts[2] == e1)) {
				return 2;
			}
			return -1;
		}

		let addedPoints = [];
		/*let trianglesStates = [];*/
		let triangles = [];
		triangles.push(
			newTriangle([-1, -2, -3])
			/*{
				verts: [-1, -2, -3], //index to vertex in vertices array
				adjacent: [null, null, null] //reference of triangle object
			}*/
		);

		//Maybe reprenset the system with a quad edge data structure like the one explained in this article
		//http://gwlucastrig.github.io/Tinfour/doc/TinfourAlgorithmsAndDataElements.pdf

		const circumcircleTest = (p, v1, v2, v3) => {
			//console.group("Circumcircle test");
			//console.log("Point ", JSON.stringify(p));
			//console.log("Vertices ", JSON.stringify(v1), JSON.stringify(v2), JSON.stringify(v3));
			//console.log("Clockwise? ", Polygon2D.ClockwiseOrder([v1, v2, v3]));

			const x13 = v1.x - v3.x;
			const x23 = v2.x - v3.x;
			const x1p = v1.x - p.x;
			const x2p = v2.x - p.x;

			const y13 = v1.y - v3.y;
			const y23 = v2.y - v3.y;
			const y1p = v1.y - p.y;
			const y2p = v2.y - p.y;

			const cosa = (x13 * x23) + (y13 * y23);
			const cosb = (x2p * x1p) + (y2p * y1p);

			//console.log(`cosa ${cosa} | cosb ${cosb}`);

			if ((cosa >= 0) && (cosb >= 0)) {
				//console.log("Result false");
				//console.groupEnd();
				return false;
			}
			//console.log("cosa >= 0 && cosb >= 0 : false");
			if ((cosa < 0) && (cosb < 0)) {
				//console.log("Result true");
				//console.groupEnd();
				return true;
			}
			//console.log("cosa < 0 && cosb < 0 : false");

			const sinab = ((x13 * y23) - (x23 * y13)) * cosb + ((x2p * y1p) - (x1p * y2p)) * cosa;
			if (sinab < 0) {
				//console.log("Result true");
				//console.groupEnd();
				return true;
			}
			//console.log("sinab < 0 : false");
			//console.log("Result false");
			//console.groupEnd();
			return false;
		}

		const setAdjacentTriangles = (e0, e1, triA, triB) => {
			if (triA != null) {
				const adIdTriA = getAdjacentIndex(triA.verts, e0, e1);
				if (adIdTriA == -1) throw Error(`Edge is not found on triangle ${JSON.stringify(triA.verts)} | edge ${e0} , ${e1}`);
				triA.adjacent[adIdTriA] = triB;
			}
			if (triB != null) {
				const adIdTriB = getAdjacentIndex(triB.verts, e0, e1);
				if (adIdTriB == -1) throw Error(`Edge is not found on triangle ${JSON.stringify(triB.verts)} | edge ${e0} , ${e1}`);
				triB.adjacent[adIdTriB] = triA;
			}
		}

		/**
		 * Tri A and B are the triangles that are going to be used to create the new diagonal.
		 * They have to for a convex quadrilateral, as the swapping function does not make sure the resulting diagonal
		 * does not pass through other edges.
		 * TriVertIndex A and B are the vertex indexes on their respective triangles that are going to create the new edge.
		 * The function removes the previous triangles from the triangle list, and returns the triangles opossite to the 
		 * point triAVertIndex and the triangles connected to triAVertIndex they are connected to.
		 * @param {DelaunayTriangle} triA 
		 * @param {DelaunayTriangle} triB 
		 * @param {Number} triAVertIndex 
		 * @param {Number} triBVertIndex 
		 */
		const swapDiagonal = (triA, triB, triAVertIndex, triBVertIndex) => {
			let ptVIndex = triAVertIndex;
			let atVIndex = triBVertIndex;

			const ptVIndex_p1 = Num.ModGl(ptVIndex + 1, 3);
			const ptVIndex_m1 = Num.ModGl(ptVIndex - 1, 3);

			let newTriA = newTriangle(
				[triA.verts[ptVIndex], triA.verts[ptVIndex_p1], triB.verts[atVIndex]]
			);
			let newTriB = newTriangle(
				[triB.verts[atVIndex], triA.verts[ptVIndex_m1], triA.verts[ptVIndex]]
			);

			newTriA.adjacent[2] = newTriB;
			newTriB.adjacent[2] = newTriA;

			const adIdA0 = getAdjacentIndex(triA.verts, triA.verts[ptVIndex], triA.verts[ptVIndex_p1]);
			setAdjacentTriangles(newTriA.verts[0], newTriA.verts[1], newTriA, triA.adjacent[adIdA0]);

			const adIdA1 = getAdjacentIndex(triB.verts, triA.verts[ptVIndex_p1], triB.verts[atVIndex]);
			setAdjacentTriangles(newTriA.verts[1], newTriA.verts[2], newTriA, triB.adjacent[adIdA1]);

			const adIdB0 = getAdjacentIndex(triB.verts, triB.verts[atVIndex], triA.verts[ptVIndex_m1]);
			setAdjacentTriangles(newTriB.verts[0], newTriB.verts[1], newTriB, triB.adjacent[adIdB0]);

			const adIdB1 = getAdjacentIndex(triA.verts, triA.verts[ptVIndex_m1], triA.verts[ptVIndex]);
			setAdjacentTriangles(newTriB.verts[1], newTriB.verts[2], newTriB, triA.adjacent[adIdB1]);

			triangles.push(newTriA);
			triangles.push(newTriB);

			let affectedTriangles = [];

			if (triB.adjacent[adIdB0] != null) {
				affectedTriangles.push({
					at: triB.adjacent[adIdB0], pt: newTriB
				});
			}
			if (triB.adjacent[adIdA1] != null) {
				affectedTriangles.push({
					at: triB.adjacent[adIdA1], pt: newTriA
				});
			}

			const aTriId = triangles.findIndex((triObj) => triObj === triB);
			if (aTriId == -1) {
				throw new Error(`Index for triangle cannot be -1 for triangle ${JSON.stringify(triB.verts)}`);
			}
			triangles.splice(aTriId, 1);

			const pTriId = triangles.findIndex((triObj) => triObj === triA);
			if (pTriId == -1) {
				throw new Error(`Index for triangle cannot be -1 for triangle ${JSON.stringify(triA.verts)}`);
			}
			triangles.splice(pTriId, 1);

			return affectedTriangles;
		}

		//Ordering points into bins is optional, and it is only done to increase the performance of the algorithm
		//Because of that it is going to be implemented in a future version of the system

		let currentOrder = [];
		for (let i = 0; i < normVerts.length; i++) {
			currentOrder.push({
				index: i,
				distance: (Math.random() + Vec2.Length(normVerts[i]) * Math.random())/2
			});
		};
		currentOrder.sort((a, b) => {
			return a.distance - b.distance;
		});

		let error = false;
		//Step 4 Loop over each point doing the steps 5 - 7
		for (let orderIndex = 0; orderIndex < currentOrder.length; orderIndex++) {
			/*trianglesStates.push(
				[...triangles]
			);*/
			if (error) break;
			//if(roId >= 20) break;

			let pointId = currentOrder[orderIndex].index;
			console.group(`ADDING POINT TO DELAUNAY - ID ${pointId}`);
			addedPoints.push(pointId);
			const nPoint = normVerts[pointId];

			//Step 5
			/*
			Insert new point in triangulation. Find an existing triangle which encloses P. Delete this triangle, and form 
			three new triangles by connecting P to each of its vertices. The net gain in total number of triangles after this stage is 2.
			Start the seach at the triangle that was formed most recently (if the bin structure was created)
			*/
			let triId = -1;
			let trianglesIds = [];
			let insideTriCount = 0;
			for (let t = 0; t < triangles.length; t++) {
				const tri = triangles[t];
				const inside = Triangle2D.IsPointInTriangle(nPoint,
					getVertex(tri.verts[0]), getVertex(tri.verts[1]), getVertex(tri.verts[2]));
				if (inside) {
					if (insideTriCount == 0) triId = t;
					trianglesIds.push(t);
					insideTriCount++;
				}
			}
			console.assert(insideTriCount <= 1, "The point is inside multiple triangles");
			if (triId == -1) {
				console.log(`Error - for some reason no triangle was found for index ${pointId}!!`);
				throw new Error("No triangle that contains point was found");
			}

			const foundTri = triangles[triId];

			//Create new triangles
			const nTri0 = newTriangle([foundTri.verts[2], foundTri.verts[0], pointId]);
			const nTri1 = newTriangle([foundTri.verts[0], foundTri.verts[1], pointId]);
			const nTri2 = newTriangle([foundTri.verts[1], foundTri.verts[2], pointId]);

			setAdjacentTriangles(nTri0.verts[0], nTri0.verts[1], nTri0, foundTri.adjacent[2]);
			setAdjacentTriangles(nTri1.verts[0], nTri1.verts[1], nTri1, foundTri.adjacent[0]);
			setAdjacentTriangles(nTri2.verts[0], nTri2.verts[1], nTri2, foundTri.adjacent[1]);

			setAdjacentTriangles(nTri0.verts[1], nTri0.verts[2], nTri0, nTri1);
			setAdjacentTriangles(nTri0.verts[2], nTri0.verts[0], nTri0, nTri2);
			setAdjacentTriangles(nTri1.verts[1], nTri1.verts[2], nTri1, nTri2);

			//Step6
			/*
			Initialize stack. Place all the triangles adjacent to the edges oposite to P on a last-in-first-out stack.
			(Place the triangles that were adjacent to the affected triangle into a stack)
			*/
			let affectedStack = [
				{ at: foundTri.adjacent[2], pt: nTri0 },
				{ at: foundTri.adjacent[0], pt: nTri1 },
				{ at: foundTri.adjacent[1], pt: nTri2 }
			];

			triangles.splice(triId, 1);
			triangles.push(nTri0);
			triangles.push(nTri1);
			triangles.push(nTri2);

			//Step7
			//Restore Delaynay triangulation. While the stack of triangles is not empty, execute Lawsons swapping scheme:
			let swapIterations = 0;

			while (affectedStack.length > 0) {
				//s1. Remove a triangle which is opposite P from the top of the stack.
				const tris = affectedStack.pop();
				if (tris.at == null) { swapIterations++; console.groupEnd(); continue; }

				/*s2. If P is outside (or on) the circumcircle for this triangle, return to s1 (the new point is not affecting the triangle
					so it can be safely remove from the stack). Else, the triangle containing P as a vertex and the currently popped
					triangle form a convex quadrilateral whose diagonal is drawn in the wrong direction. Swap this diagonal so that the
					two triangles are replaced by two new triangles an the structure of the Delaunay triangulation is locally restored.
				*/
				if (pointId == tris.at.verts[0] || pointId == tris.at.verts[1] || pointId == tris.at.verts[2]) {
					console.log("Adjacent tri has the added point: ", `Triangle | ${JSON.stringify(tris.at.verts)} |`, `Point index : ${pointId}`);
					console.error("Added point in adjacent triangle");
					error = true;
					break;
					//throw new Error("Added point in adjacent triangle");
				}

				const fvId = tris.at.verts.findIndex((v) => !tris.pt.verts.includes(v));
				if (fvId == -1) throw new Error("Far vertex not found");
				const fvId_m1 = Num.ModGl(fvId - 1, 3);
				const fvId_p1 = Num.ModGl(fvId + 1, 3);

				/*console.log(`Index order for circumcircle test | N1 : ${fvId_m1} | N2 : ${fvId_p1} | N3 : ${fvId}`);
				console.log("Vertices values: ", getVertex(tris.at.verts[fvId_m1]), getVertex(tris.at.verts[fvId_p1]), getVertex(tris.at.verts[fvId]));*/

				let convexQuad = Polygon2D.IsConvexPolygon([
					getVertex(tris.at.verts[fvId_m1]),
					getVertex(tris.at.verts[fvId]),
					getVertex(tris.at.verts[fvId_p1]),
					nPoint]);

				const circTest = circumcircleTest(nPoint, getVertex(tris.at.verts[fvId_m1]), getVertex(tris.at.verts[fvId_p1]), getVertex(tris.at.verts[fvId]));
				if (circTest == false || convexQuad == false) {
					swapIterations++;
					console.groupEnd();
					continue;
				} else {
					let ptVIndex = tris.pt.verts.findIndex(v => v === pointId);
					let atVIndex = tris.at.verts.findIndex(v => !tris.pt.verts.includes(v));

					let aStack = swapDiagonal(tris.pt, tris.at, ptVIndex, atVIndex);
					aStack.forEach(v => affectedStack.push(v));
				}
				//s3. Place any triangles which are now oposite P on the stack.
			}
		}

		//Now the polygon is triangulated, the problem is that all the points are only locally triangulated,
		//which means that there is no global consistency, lets try to mitage that
		const removeAdjacent = (e0, e1, adi, tri) => {
			const edge0 = [tri.verts[e0], tri.verts[e1]];
			const adjacent0 = tri.adjacent[adi];
			if (adjacent0 != null) {
				const adIndex = getAdjacentIndex(adjacent0.verts, edge0[0], edge0[1]);
				adjacent0.adjacent[adIndex] = null;
			}
		}

		let innerTriangles = [];
		//Using the polygon as a mask, remove any triangles with centers outside of the polygon
		for (let i = 0; i < triangles.length; i++) {
			let tri = triangles[i];
			let triVerts = [
				getVertexReal(tri.verts[0]),
				getVertexReal(tri.verts[1]),
				getVertexReal(tri.verts[2])
			];
			let triCenter = Vec2.DivScalar(Vec2.Add(triVerts[0], Vec2.Add(triVerts[1], triVerts[2])), 3);
			const insidePoly = Polygon2D.PointInsidePolygon(triCenter, polygon);
			if (insidePoly) {
				innerTriangles.push(tri);
			} else {
				//Remove polygon from list
				removeAdjacent(0, 1, 0, tri);
				removeAdjacent(1, 2, 1, tri);
				removeAdjacent(2, 0, 2, tri);
			}
		}
		
		const hasDegenerateAngle = (angles) => {
			const extremeAngle = angles.findIndex((a) => 
				(a < Num.DegToRad(5) || a > Num.DegToRad(175) || isNaN(a))
			);
			return extremeAngle != -1;
		}

		const getDegenerateCount = ()=>{
			let degenerateTriangleCount = 0;
			for (let it = 0; it < innerTriangles.length; it++) {
				const tri = innerTriangles[it];
				const innerAngles = Triangle2D.InternalAngles(
					getVertexReal(tri.verts[0]),
					getVertexReal(tri.verts[1]),
					getVertexReal(tri.verts[2]));
				if (hasDegenerateAngle(innerAngles)) {
					degenerateTriangleCount += 1;
				}
			}
			return degenerateTriangleCount;
		}

		console.log("Degenerate triangle count before : ", getDegenerateCount());

		console.groupCollapsed("Remove While");
		while (true) {
			let stopLoop = true;
			console.group("While Iter");
			for (let it = 0; it < innerTriangles.length; it++) {
				const tri = innerTriangles[it];
				const innerAngles = Triangle2D.InternalAngles(
					getVertexReal(tri.verts[0]),
					getVertexReal(tri.verts[1]),
					getVertexReal(tri.verts[2]));

				if (hasDegenerateAngle(innerAngles)) {
					const sameTriangles = (triA, triB) => {
						if(triA == null || triB == null){
							return false;
						}else{
							const index = triB.verts.findIndex(v => !triA.verts.includes(v));
							return index == -1;
						}
					}

					console.assert(sameTriangles(tri, tri.adjacent[0]) || sameTriangles(tri, tri.adjacent[1]), sameTriangles(tri, tri.adjacent[2]), 
					"It is its own adjacent triangle");

					if((tri.adjacent[0] == null || tri.adjacent[1] == null || tri.adjacent[2] == null)){
						innerTriangles.splice(it, 1);
						removeAdjacent(0, 1, 0, tri);
						removeAdjacent(1, 2, 1, tri);
						removeAdjacent(2, 0, 2, tri);
						stopLoop = false;
						break;
					}
				}
			}
			console.groupEnd();

			if(stopLoop) break;
		}
		console.groupEnd();

		console.group("Left triangle extreme");
		let degenerateTriangles = [];
		for (let it = 0; it < innerTriangles.length; it++) {
			const tri = innerTriangles[it];
			const innerAngles = Triangle2D.InternalAngles(
				getVertexReal(tri.verts[0]),
				getVertexReal(tri.verts[1]),
				getVertexReal(tri.verts[2]));
			if (hasDegenerateAngle(innerAngles)) {
				degenerateTriangles.push(tri);
				if(tri.adjacent[0] != null) degenerateTriangles.push(tri.adjacent[0]);
				if(tri.adjacent[1] != null) degenerateTriangles.push(tri.adjacent[1]);
				if(tri.adjacent[2] != null) degenerateTriangles.push(tri.adjacent[2]);
			}
		}
		console.groupEnd();

		console.log("Degenerate triangle count : ", getDegenerateCount());
		//Add code that 

		console.log("Degenerate triangle count : ", getDegenerateCount());

		if (DEBUG == false) {
			//Revert console loggging functions
			window.console.log = window.consoleBackup.log;
			window.console.group = window.consoleBackup.group;
			window.console.groupEnd = window.consoleBackup.groupEnd;
			window.console.groupCollapsed = window.consoleBackup.groupCollapsed;
		}

		return {
			triangles: innerTriangles,//degenerateTriangles,
			addedPoints,
			negVerts: {
				1: invertNorm(getVertex(-1)),
				2: invertNorm(getVertex(-2)),
				3: invertNorm(getVertex(-3))
			}
		};
	}

	/**
	 * The vertices are assumed to be in clockwise order
	 * @param {Array.<Vec2>} vertices 
	 * @param {Array.<Number>} concaveVertices Array of vertex indexes
	 * @returns 
	 */
	static Triangulate(vertices, concaveVertices) {

		//Create vertices double linked list
		let vertexCount = vertices.length;
		let startVertexCount = vertexCount;

		//Create vertice linked list
		let root = {
			index: 0,
			ears: 0,
			position: vertices[0],
			prev: null,
			next: null,
		};
		let prevNode = root;
		for (let i = 1; i < vertices.length; i++) {
			let node = {
				index: i,
				ears: 0,
				position: vertices[i],
				prev: prevNode,
				next: null
			};
			prevNode.next = node;
			prevNode = node;
		}
		prevNode.next = root;
		root.prev = prevNode;
		//end create linked list

		let isNodeConvex = (node) => {
			return Polygon2D.IsConvex(node.prev.position, node.position, node.next.position);
		}

		let containsConcave = (p0, p1, p2, skipIndexes) => {
			for (let i = 0; i < concaveVertices.length; i++) {
				if (skipIndexes.includes(concaveVertices[i])) continue;
				let p = vertices[concaveVertices[i]];
				if (Triangle2D.IsPointInTriangle(p, p0, p1, p2)) {
					return true;
				}
			}
			return false;
		}

		let isAnEar = (node) => {
			if (concaveVertices.length == 0) {
				return true;
			} else if (isNodeConvex(node)) {
				//check if there are convex vertices inside the possible triangle
				if (!containsConcave(node.prev.position, node.position, node.next.position,
					[node.index, node.prev.index, node.next.index])) {
					return true;
				}
				return false;
			}
			return false;
		}

		let inConcaveList = (node) => {
			return concaveVertices.includes(node.index);
		}

		let removeNode = (node, cNode) => {
			let detatchNode = node;

			node.prev.next = cNode;
			cNode.prev = node.prev;

			detatchNode.prev = null;
			detatchNode.next = null;
		}

		let pushTriangle = (node) => {
			console.log("triangle vertices: ", node.index, node.prev.index, node.prev.prev.index);
			console.log("vertices ear count: ", node.ears, node.prev.ears, node.prev.prev.ears);
			let nTri = {
				p0: Vec2.Copy(node.prev.prev.position),
				p1: Vec2.Copy(node.prev.position),
				p2: Vec2.Copy(node.position)
			};

			nTri.p0.y *= -1;
			nTri.p1.y *= -1;
			nTri.p2.y *= -1;

			node.prev.prev.ears += 1;
			node.prev.ears += 1;
			node.ears += 1;

			triangles.push(nTri);
		}

		let triangles = [];
		let currentNode = root.next.next;
		let iterCount = 0;
		while (true /*currentNode.index != 0*/) {
			console.log("-----------------------------");
			if (iterCount >= 1000) {
				console.log("Too many iterations");
				break;
			}
			console.log("testing node: ", currentNode.index);
			let randomSkip = Math.random();
			randomSkip = 0.5;
			if (randomSkip < 0.75 && isAnEar(currentNode.prev) && vertexCount > 3 && Math.ceil(currentNode.ears) < 2 && Math.ceil(currentNode.prev.prev.ears) < 2) {
				console.log("is an ear: ", currentNode.index);

				/*let angles = Triangle2D.InternalAngles(currentNode.position, currentNode.prev.position, currentNode.prev.prev.position);
				let anglesDeg = angles.map(v => Num.RadToDeg(v));
				let sum = 0;
				anglesDeg.forEach(v =>{
					sum += Math.pow(v - 60, 2);
				})
				let std = Math.sqrt(sum / 3);
				console.log("Standard deviation ", std);
				if(std > 35) {currentNode = currentNode.next; iterCount++; continue;};*/

				//Add ear to triangle list
				//TODO change into a proper triangle vertex index list
				pushTriangle(currentNode);

				vertexCount -= 1;

				//Remove currentNode.prev (ear top) from the list
				removeNode(currentNode.prev, currentNode);

				//if current is included in concave list and is now convex then remove from concave list
				if (inConcaveList(concaveVertices, currentNode) && isNodeConvex(currentNode)) {
					let index = concaveVertices.findIndex((v) => v == currentNode.index)
					concaveVertices.splice(index, 1);
				}
				//if pred is included in concave list and is now convex then remove from concave list
				if (inConcaveList(concaveVertices, currentNode.prev) && isNodeConvex(currentNode.prev)) {
					let index = concaveVertices.findIndex((v) => v == currentNode.prev.index)
					concaveVertices.splice(index, 1);
				}

				if (currentNode.prev.index == 0) {
					currentNode = currentNode.next;
				}
			} else {
				if (randomSkip < 0.75) {
					if (currentNode.ears > 0) currentNode.ears -= 0.5;
				}
				currentNode = currentNode.next;
				//if(currentNode.prev.prev.ears > 0) currentNode.prev.prev.ears -= 1;
			}

			if (vertexCount <= 3) {
				pushTriangle(currentNode);
				break;
			}
			iterCount++;
		}
		console.log(triangles);
		console.log("------------------------------");
		console.log("Iteration count: ", iterCount);
		console.log("Start vertex count: ", startVertexCount);
		console.log("------------------------------");

		return triangles;
	}
}