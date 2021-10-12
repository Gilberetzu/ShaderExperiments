<script>
    import * as THREE from 'three';

    export let label = "Cloud Mid Height";
    export let uniformName = "_CloudMidDistance";
    export let updateShaderUniform = (uniformName, newValue) => {};

    export let defaultValue;

    let xValue;
    let yValue;
    let zValue;

    let updateControlValue = ()=>{
        xValue = defaultValue.x;
        yValue = defaultValue.y;
        zValue = defaultValue.z;
    }

    updateControlValue();

    $:{
        xValue;
        yValue;
        zValue;
        updateShaderUniform(uniformName, new THREE.Vector3(xValue ? xValue : 1, yValue ? yValue : 1, zValue? zValue : 1));
    }
</script>


<style>
    .container{
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr 1fr 1fr;
        gap: 0.5em;
        margin-top: 1em;
    }
    .inputContainer{
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr;
    }
    .label{
        min-width: 80px;
    }
    .inputeLable{
        padding: 0em 0.5em;
        background-color: var(--c2);
        font-weight: bold;
        font-size: 1.25em;
        font-weight: 300;
        color: white;
        border-radius: 0.2em 0px 0em 0.2em;
    }
    input{
        min-width: 0px;
        border: none;
        background-color: rgb(240, 230, 230);
        padding: 0em 0.5em;
        border-radius: 0px 0.2em 0.2em 0em;
    }
</style>

<div class="container">
    <div class="label">{label}</div>
    <div class="inputContainer">
        <div class="inputeLable">x</div>
        <input type="number" bind:value={xValue}/>
    </div>
    <div class="inputContainer">
        <div class="inputeLable">y</div>
        <input type="number" bind:value={yValue}/>
    </div>
    <div class="inputContainer">
        <div class="inputeLable">z</div>
        <input type="number" bind:value={zValue}/>
    </div>
</div>