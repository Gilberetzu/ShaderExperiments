<script>
    import {onMount} from 'svelte';
    import * as THREE from 'three';
    
    export let label = "Cloud Mid Height";
    export let uniformName = "_CloudMidDistance";

    export let updateShaderUniform = (uniformName, newValue) => {};
    export let defaultValue;
    let value;

    let updateControlValue = ()=>{
        value = "#" + defaultValue.getHexString(); 
    }
    updateControlValue();
    
    $:{
        value;
        updateShaderUniform(uniformName, new THREE.Color(value));
    }
</script>


<style>
    .container{
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.5em;
        margin-top: 1em;
    }
    input{
        width: 100%;
    }
</style>

<div class="container">
    <div>{label}</div>
    <input type="color" bind:value/>
    <div>{value}</div>
</div>