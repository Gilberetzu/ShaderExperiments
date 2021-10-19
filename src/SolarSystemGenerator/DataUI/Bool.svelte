<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";

	export let tooltip = "";
	export let boolStore: Writable<boolean>;
	export let label;

	let unsubscribeStore;
	onMount(()=>{
		unsubscribeStore = boolStore.subscribe((val)=>{
			value = val;
		});
	})
	onDestroy(()=>{
		unsubscribeStore();
	})

	let value:boolean;
	let toggle = ()=>{
		value = !value;
		boolStore.set(value);
	}
</script>

<style>
	.checkBox{
		width: 1.5em;
		height: 1.5em;
		border-radius: 1em;
	}
	.checkBox:hover{
		transform: scale(1.5);
	}
	.checkTrue{
		background-color: var(--cs2_6);
	}
	.checkFalse{
		background-color: var(--cs2_3);
	}
	.container{
		display: grid;
		grid-template-columns: 1fr 1.5em;
	}
</style>

<div class="container">
	<div>
		{label}
	</div>
	<div class:checkBox={true} class:checkTrue={value} 
	class:checkFalse={!value} on:click={toggle}/>
</div>