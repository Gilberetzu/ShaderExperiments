<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";
	import Dropdown from "./Dropdown.svelte";

	export let enumObject;

	export let tooltip = "";
	export let enumStore: Writable<any>;
	export let label;

	let unsubscribeStore;
	let possibleOptions = [];
	onMount(()=>{
		if(enumObject != null && enumObject != undefined){
			let keys = Object.keys(enumObject);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				
				if(isNaN(parseInt(key))){
					break;
				}else{
					possibleOptions.push(enumObject[key]);
				}
			}
			possibleOptions = [...possibleOptions];
		}

		unsubscribeStore = enumStore.subscribe((val)=>{
			value = val;
		});
	})
	onDestroy(()=>{
		unsubscribeStore();
	})

	let value;
	let selectEnumVal = (selected)=>{
		value = selected;
		enumStore.set(value);
	}
</script>

<style>
</style>

<div>
	<div>
		{label}
	</div>
	<Dropdown possibleOptions={possibleOptions} bind:value on:click={(event)=>{selectEnumVal(event.detail)}}/>
</div>