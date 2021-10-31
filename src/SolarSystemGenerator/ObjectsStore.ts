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
		backgrounds:[],
		stars:[],
		combinedPlanets:[],
		planetarySystems:[],
		galaxies:[]
	});

	return {
		subscribe,
		set,
		addPlanet: (newPlanet) => update(state => {
			let newId = getAvailableID(state);
			newPlanet.name = `${newPlanet.name} - ${newId}`;
			let newArr = [...state.planets, {id: newId, object: newPlanet}];
			return {
				...state,
				planets: newArr,
			};
		}),
		addBackground: (newBackground) => update(state => {
			let newId = getAvailableID(state);
			newBackground.name = `${newBackground.name} - ${newId}`;
			let newArr = [...state.backgrounds, {id: newId, object: newBackground}];
			return {
				...state,
				backgrounds: newArr,
			};
		}),
		addStar: (newStar) => update(state => {
			let newId = getAvailableID(state);
			newStar.name = `${newStar.name} - ${newId}`;
			let newArr = [...state.stars, {id: newId, object: newStar}];
			return {
				...state,
				stars: newArr,
			};
		}),
		addCombinedPlanet: (newCombinedPlanet) => update(state => {
			let newId = getAvailableID(state);
			newCombinedPlanet.name = `${newCombinedPlanet.name} - ${newId}`;
			let newArr = [...state.combinedPlanets, {id: newId, object: newCombinedPlanet}];
			return {
				...state,
				combinedPlanets: newArr,
			};
		}),
		addPlanetarySystem: (newPlanetarySystem)=> update(state => {
			let newId = getAvailableID(state);
			newPlanetarySystem.name = `${newPlanetarySystem.name} - ${newId}`;
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
		updateObject: (obj, key, index) => update(state => {
			let objIndex = state[key].findIndex(elem => {
				return elem.id == obj.id;
			});
			if(objIndex >= 0){
				state[key][objIndex] = obj;
			}
			return {...state};
		}),
		updateObjectName: (name, key, id) => update(state => {
			let objIndex = state[key].findIndex(s => s.id == id);
			if(objIndex >= 0){
				state[key][objIndex].object.name = name;
			}
			return {...state}
		}),
		removeObject: (key, id) => update(state => {
			let newArr = state[key].filter((elem)=>elem.id != id);
			return {
				...state,
				[key]: newArr,
			};
		}),
		duplicateObject: (key:string, id) => update(state => {
			let objToDuplicate = state[key].find(obj => obj.id == id);
			if(objToDuplicate == null || objToDuplicate == undefined){
				return {
					...state
				}
			}else{
				let duplicate = objToDuplicate.object.copy();
				let newId = getAvailableID(state);
				let newArr = [...state[key], {id: newId, object: duplicate}];
				console.log(newArr);
				return {
					...state,
					[key]: newArr,
				}
			}
		})
	};
}
const ObjectsStore = createObjectStore();
export default ObjectsStore;