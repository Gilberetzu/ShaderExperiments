<script>
	import Arrow from "../../CommonComponents/Icons/Arrow.svelte";
	import ProceduralPlanet from "../ProceduralPlanet";
	import ObjectStore from "../ObjectsStore";
	import SelectionState from "../SelectionState";
	import { get } from 'svelte/store';
	import {onMount, onDestroy} from "svelte";
	
	let objectList = [
		{label: "Planets", key: "planets"},
		{label: "Stars", key: "stars"},
		{label: "Planets - Satelite", key: "combinedPlanets"},
		{label: "Planetary System", key: "planetarySystems"},
		{label: "Galaxies", key: "galaxies"},
		{label: "Cameras", key: "cameras"}
	];
	let openSelector = false;
	let selectedList = 0;

	let openContextId = -1;
	let selectedEditable = -1;

	let storeObjectsLists = {
		planets: [],
		stars: [],
		combinedPlanets: [],
		planetarySystems: [],
		galaxies: [],
		cameras: []
	}

	let fillSelectableObjectList = (store)=>{
		//console.log("subscription call", store);
		let newList = {
			planets: store.planets.map(obj => {return {id: obj.id, name: obj.object.name}}),
			stars: store.stars.map(obj => {return {id: obj.id, name: obj.object.name}}),
			combinedPlanets: store.combinedPlanets.map(obj => {return {id: obj.id, name: obj.object.name}}),
			planetarySystems: store.planetarySystems.map(obj => {return {id: obj.id, name: obj.object.name}}),
			galaxies: store.galaxies.map(obj => {return {id: obj.id, name: obj.object.name}}),
			cameras: store.cameras.map(obj => {return {id: obj.id, name: obj.object.name}}),
		}
		storeObjectsLists = newList;
	}

	let unsubscribeObjectStore;
	let unsubscribeSelectionStore;
	onMount(()=>{
		unsubscribeSelectionStore = SelectionState.editable.subscribe((state)=>{
			selectedEditable = state;
		});
		unsubscribeObjectStore = ObjectStore.subscribe(fillSelectableObjectList);
		
		let planet1 = new ProceduralPlanet("Planet 1");
		let planet2 = new ProceduralPlanet("Planet 2");

		ObjectStore.addPlanet(planet1);
		ObjectStore.addPlanet(planet2);
	})

	onDestroy(()=>{
		if(unsubscribeSelectionStore != null || unsubscribeSelectionStore != undefined){
			unsubscribeSelectionStore();
		}
		if(unsubscribeObjectStore != null || unsubscribeObjectStore != undefined){
			unsubscribeObjectStore();
		}
	})
</script>

<style>
	.container{
		position: relative;
		width: 70%;
		margin: 0.5em auto 0.5em auto;
		display: grid;
		grid-template-columns: 1fr 1em;
		padding: 0em 1em;
		border-radius: 1em;
		gap: 1em;
		cursor: pointer;
		background-color: var(--cs2_1);
		color: var(--cs2_6);
	}
	.options{
		position: absolute;
		top: calc(100% + 2px);
		border-radius: 0.25em;
		left: 0.5em;
		right: 0.5em;
		background-color: var(--cs2_1);
		z-index: 100;
	}
	.option{
		padding: 4px 1em;
	}
	.option:hover{
		background-color: var(--cs2_4);
		
	}
	.arrowContainer{
		line-height: 0;
		place-self: center;
	}
	.arrowOpen{
		transform: rotate(180deg);
	}

	.listElement{
		padding: 0.25em 1em;
		cursor: pointer;
		color: var(--cs2_6);
		position: relative;
	}
	.listElement:hover{
		background-color: var(--cs2_4);
	}
	.listElementOdd{
		background-color: var(--cs2_7);
	}
	.listElementEven{
		background-color: var(--cs2_8);
	}
	.listElementSelected{
		background-color: var(--cs2_1);
		font-weight: 700;
	}

	.contextMenu{
		position: absolute;
		top: 0px;
		right: calc(100% + 0.25em);
		background-color: var(--cs2_3);
	}
	.contextMenuItem{
		padding: 0.2em 1em;
	}
	.contextMenuItem:hover{
		background-color: var(--cs2_4);
	}
</style>

<svelte:window on:mousedown={()=>{openContextId = -1;}} />

<div>
	<div class="container" on:mousedown|preventDefault on:click|preventDefault={()=>{openSelector = !openSelector;}}>
		<div>{objectList[selectedList].label}</div>
		<div class:arrowContainer={true} class:arrowOpen={openSelector}>
			<Arrow fillColor={"var(--cs2_6)"}/>
		</div>
		{#if openSelector}
		<div class="options">
			{#each objectList as option, index}
				<div class="option" on:click={()=>{selectedList = index}}>
					{option.label}
				</div>
			{/each}
		</div>
		{/if}
	</div>
	<div>
		{#each storeObjectsLists[objectList[selectedList].key] as obj, index}
			<div class:listElement={true} class:listElementSelected={obj.id == selectedEditable} class:listElementOdd={index%2 == 1} class:listElementEven={index%2 == 0} on:click={()=>{
				if(openContextId == obj.id){
					openContextId = -1;
				}else{
					openContextId = obj.id;
				}
			}}>
				{obj.name}

				{#if obj.id == openContextId}
					<div class="contextMenu">
						<div class="listElementOdd contextMenuItem" on:mousedown|preventDefault|stopPropagation on:click={()=>{
							SelectionState.editable.set({
								id: obj.id,
								key: objectList[selectedList].key
							});
						}}>Edit</div>
						<div class="listElementEven contextMenuItem" >Delete</div>
						<div class="listElementOdd contextMenuItem" >View</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>