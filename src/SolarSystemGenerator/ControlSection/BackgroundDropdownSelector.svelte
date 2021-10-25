<script>
	import {onMount, onDestroy} from 'svelte';
	import ObjectsStore from "../ObjectsStore";

	import Dropdown from "../DataUI/Dropdown.svelte";

	export let backgroundSelectStore;
	let possibleBackgrounds = [];
	let dropdownValues = [];

	let objectUnsub = ()=>{};
	let bgselectUnsub = ()=>{};

	let getDropdownIndex = (id)=>{
		return possibleBackgrounds.findIndex(bg => bg.id == id);
	}

	let selectedBG = -1;
	
	onMount(()=>{
		objectUnsub = ObjectsStore.subscribe((objects) =>{
			possibleBackgrounds = objects.backgrounds.map(bg => {
				return {
					id: bg.id,
					name: bg.object.name
				};
			});
			dropdownValues = possibleBackgrounds.map(bg => {
				return bg.name;
			})
		});

		bgselectUnsub = backgroundSelectStore.subscribe((select)=>{
			selectedBG = select;
		});
	});

	let changeBackground = (cEvent)=>{
		selectedBG = cEvent.detail;
		backgroundSelectStore.set(possibleBackgrounds[cEvent.detail].id);
	}

	onDestroy(()=>{
		objectUnsub();
		bgselectUnsub();
	})
</script>
<style>

</style>
<div>
	<Dropdown possibleOptions={dropdownValues} value={getDropdownIndex(selectedBG)} on:click={changeBackground}/>
</div>