<script>
    export let HeaderLabel;
</script>

<div class="header">
  <div class="headerLine" />
  <div>{HeaderLabel}</div>
  <div class="headerLine" />
</div>

<style>
  .header {
    font-size: 1.5em;
    font-weight: 300;
    margin-top: 1em;
    display: grid;
    place-items: center;
    gap: 1em;
    grid-template-columns: 1fr auto 1fr;
  }
  .headerLine {
    height: 2px;
    width: 100%;
    background-color: var(--c1);
  }
</style>
