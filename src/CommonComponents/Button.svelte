<script>
	export let label;
</script>

<style>
	.addButton{
		place-self: center;
		border-radius: 1em;
		padding: 0em 1em;
		background-color: var(--cs2_1);
		color: var(--cs2_6);
		cursor: pointer;
		user-select: none;
	}
	.addButton:hover{
		background-color: var(--cs2_4);
	}
</style>

<div class="addButton" on:click>{label}</div>