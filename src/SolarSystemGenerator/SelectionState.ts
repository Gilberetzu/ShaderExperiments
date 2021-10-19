import { writable } from 'svelte/store';

//make the stores throw errors if the correct object types are not sent

function createCameraStore(){
	const { subscribe, set, update } = writable(null);
	return {
		subscribe,
		set
	}
}

function createEditableStore(){
	const { subscribe, set, update } = writable(-1);
	return {
		subscribe,
		set,
		reset: ()=>{
			set(-1);
		}
	}
}

const cameraStore = createCameraStore();
const editableStore = createEditableStore();

export default {
	camera: cameraStore,
	editable: editableStore
};