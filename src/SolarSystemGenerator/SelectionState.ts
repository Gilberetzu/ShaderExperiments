import { writable } from 'svelte/store';

//make the stores throw errors if the correct object types are not sent

function createCameraStore(){
	const { subscribe, set, update } = writable(null);
	return {
		subscribe,
		set
	}
}


const selectedEditableInit = {
	id: -1,
	key: ""
};
function createEditableStore(){
	const { subscribe, set, update } = writable(selectedEditableInit);
	return {
		subscribe,
		setSelected: (id, key) => {
			set({
				id,
				key
			});
		},
		reset: ()=>{
			set(selectedEditableInit);
		}
	}
}

const cameraStore = createCameraStore();
const editableStore = createEditableStore();

export default {
	camera: cameraStore,
	editable: editableStore
};