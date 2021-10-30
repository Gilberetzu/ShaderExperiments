<script lang="ts">
	import ObjectsStore from "../../ObjectsStore";
	import Dropdown from "../../DataUI/Dropdown.svelte";
	import {onMount, onDestroy} from 'svelte';
	import {Writable} from "svelte/store";

	export let selectedIdStore: Writable<number>;

	let possibleOptions = [];
	let possibleOptionsLabels = [];
	let dropdownValue = -1;

	let unsubscribeOS : ()=>void;
	let unsubscribeSelect : ()=>void;

	onMount(()=>{
		unsubscribeOS = ObjectsStore.subscribe((data)=>{
			possibleOptions = [];
			data.planets.forEach(planet => {
				possibleOptions.push({
					id: planet.id,
					name: planet.object.name
				});
			});
			data.combinedPlanets.forEach(planet => {
				possibleOptions.push({
					id: planet.id,
					name: planet.object.name
				});
			});
			possibleOptionsLabels = possibleOptions.map(option => {
				return option.name;
			});
		});

		unsubscribeSelect = selectedIdStore.subscribe((id)=>{
			dropdownValue = possibleOptions.findIndex(po => po.id == id);
		})
	});

	onDestroy(()=>{
		unsubscribeOS();
		unsubscribeSelect();
	});
</script>

<div>
	<Dropdown possibleOptions={possibleOptionsLabels} value={dropdownValue} on:click={(event)=>{
		selectedIdStore.set(possibleOptions[event.detail].id);
	}}/>
</div>