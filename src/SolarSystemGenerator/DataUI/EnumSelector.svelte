<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";
	import Arrow from "../../CommonComponents/Icons/Arrow.svelte";

	export let enumObject;

	export let tooltip = "";
	export let enumStore: Writable<any>;
	export let label;

	let unsubscribeStore;
	let possibleOptions = [];
	onMount(()=>{
		if(enumObject != null || enumObject != undefined){
			let keys = Object.keys(enumObject);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				
				if(isNaN(parseInt(key))){
					break;
				}else{
					possibleOptions.push({
						label: enumObject[key],
						value: key
					});
				}
			}

			possibleOptions = [...possibleOptions];
		}

		//console.log(possibleOptions);
		unsubscribeStore = enumStore.subscribe((val)=>{
			value = val;
		});
	})
	onDestroy(()=>{
		unsubscribeStore();
	})
	let openSelector = false;
	let value;
	let selectEnumVal = (selected)=>{
		value = selected;
		enumStore.set(value);
	}
</script>

<style>
	.container{
		position: relative;
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
</style>

<div>
	<div>
		{label}
	</div>
	<div class="container" on:mousedown|preventDefault on:click|preventDefault={()=>{openSelector = !openSelector;}}>
		<div>{enumObject[value]}</div>
		<div class:arrowContainer={true} class:arrowOpen={openSelector}>
			<Arrow fillColor={"var(--cs2_6)"}/>
		</div>
		{#if openSelector}
		<div class="options">
			{#each possibleOptions as option}
				<div class="option" on:click={()=>{selectEnumVal(option.value)}}>
					{option.label}
				</div>
			{/each}
		</div>
		{/if}
	</div>
</div>