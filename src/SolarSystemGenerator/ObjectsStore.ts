import { writable } from 'svelte/store';

function getAvailableID(stateArrays){
	let arrayKeys = Object.keys(stateArrays);
	let ids = [];
	for (let i = 0; i < arrayKeys.length; i++) {
		const key = arrayKeys[i];
		for (let j = 0; j < stateArrays[key].length; j++) {
			const element = stateArrays[key][j];
			ids.push(element.id);
		}
	}
	ids.sort((a,b) => {return a - b;});

	let prev = 0;
	if(ids.length == 0) return 0;
	for (let i = 0; i < ids.length; i++) {
		const elemId = ids[i];
		if(i == 0){
			if(elemId != 0){
				return 0;
			}
		}else{
			if(elemId - prev > 1){
				return prev + 1;
			}
		}
		prev = elemId
	}
	return prev + 1;
}

function createObjectStore() {
	const { subscribe, set, update } = writable({
		planets:[],
		stars:[],
		combinedPlanets:[],
		planetarySystems:[],
		galaxies:[],
		cameras:[]
	});

	return {
		subscribe,
		addPlanet: (newPlanet) => update(state => {
			let newId = getAvailableID(state);
			let newArr = [...state.planets, {id: newId, object: newPlanet}];
			return {
				...state,
				planets: newArr,
			};
		}),
		addStar: (newStar) => update(state => {
			let newId = getAvailableID(state);
			let newArr = [...state.stars, {id: newId, object: newStar}];
			return {
				...state,
				stars: newArr,
			};
		}),
		addCombinedPlanet: (newCombinedPlanet) => update(state => {
			let newId = getAvailableID(state);
			let newArr = [...state.combinedPlanets, {id: newId, object: newCombinedPlanet}];
			return {
				...state,
				combinedPlanets: newArr,
			};
		}),
		addPlanetarySystem: (newPlanetarySystem)=> update(state => {
			let newId = getAvailableID(state);
			let newArr = [...state.planetarySystems, {id: newId, object: newPlanetarySystem}];
			return {
				...state,
				planetarySystems: newArr,
			};
		}),
		addGalaxy: (newGalaxy)=> update(state => {
			let newId = getAvailableID(state);
			let newArr = [...state.galaxies, {id: newId, object: newGalaxy}];
			return {
				...state,
				galaxies: newArr,
			};
		}),
		addCamera: (newCamera)=> update(state => {
			let newId = getAvailableID(state);
			let newArr = [...state.cameras, {id: newId, object: newCamera}];
			return {
				...state,
				cameras: newArr,
			};
		}),
		updateObject: (obj, listName, index) => update(state => {
			state[listName][index] = obj;
			return {...state};
		})
	};
}
const objectStore = createObjectStore();
export default objectStore;