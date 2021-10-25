<script lang="ts">
	import Arrow from "../../CommonComponents/Icons/Arrow.svelte";
	export let label:string;
	let open:boolean = true;
</script>

<style>
	.check{
		width: 1em;
		height: 1em;
		line-height: 0px;
		place-self: center;
	}
	.checkTrue{
		transform-origin: center;
		transform: rotateX(180deg);
	}
	.checkFalse{
		transform-origin: center;
		transform: rotate(90deg);
	}
	.container{
		background-color: var(--cs2_3);
		padding: 0em 0em 0em 0.2em;
		color: var(--cs2_6);
	}
	.containerTop{
		background-color: var(--cs2_3);
		color: var(--cs2_6);
		display: grid;
		gap: 1em;
		grid-template-columns: auto 1fr;
		cursor: pointer;
	}
	.containerTop:hover{
		background-color: var(--cs2_4);
	}
	.propContainer{
		padding: 1em;
		background-color: var(--cs2_5);
		display: grid;
		gap: 1em;
	}
</style>

<div class="container">
	<div class="containerTop" on:mousedown|preventDefault={()=>{open = !open}}>
		<div class:check={true} class:checkTrue={open} class:checkFalse={!open}>
			<Arrow fillColor={"var(--cs2_1)"}/>
		</div>
		<div>{label}</div>
	</div>
	{#if open}
	<div class="propContainer">
		<slot/>
	</div>
	{/if}
</div>