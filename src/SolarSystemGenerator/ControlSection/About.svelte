<script>
	import WebIcon from "../../CommonComponents/Icons/WebIcon.svelte";
	import SocialLinks from "../../CommonComponents/SocialLinks.svelte";
</script>

<style>
	.icon{
		display: grid;
		grid-template-columns: 3em 1fr;
		gap: 1em;
		padding: 0.5em 1em;

		color: var(--cs2_6);
		font-size: 1.5em;
	}
	.contactIcons{
		width: 80%;
		margin: 0 auto;
	}
	.about{
		color: var(--cs2_6);
		font-size: 1.2em;
		padding: 0em 0.5em;
		text-align: justify;
	}
	a{
		color: var(--cs2_6);
		font-weight: bold;
	}
	h2{
		padding: 0em 1em;
		color: var(--cs2_6);
	}
	.linkContainer{
		line-height: 0;
		position: relative;
	}
	.portfolioLink{
		position: absolute;
		top: 0px;
		left: 0px;
		right: 0px;
		bottom: 0px;
	}
</style>
<h2>Planetary System Generator</h2>
<div class="icon">
	<div class="linkContainer">
		<WebIcon />
		<a class="portfolioLink" href="https://www.euriherasme.com/"><div style="display: none;">sad</div></a>
	</div>
	<div>By Euri Herasme</div>
</div>
<div class="about">
	Hello! this is an updated version of the <a href="/PlanetGenerator">planet generation system</a>. This started as my submission for <a href="https://twitter.com/HarryAlisavakis">Harry Alisavakis</a> "technically speaking" challenge, the theme was "make the default sphere hella sick". The best way to make anything look awesome is by using raymarching. I did my entry using Unity, and I ported it to the web because of a fantastic suggestion by <a href="https://twitter.com/Herr_Sami">Sami</a>, he said it as a joke, but the more I thought about the idea, the more awesome it became, one thing let to the other and here we are. After I did the first version, I was thinking about what to add, and after watching a video about Outer Wilds, I got my answer.
<br/>
<br/>
	Special thanks to <a href="https://twitter.com/iquilezles">Iñigo Quilez</a>
	and <a href="https://twitter.com/SebastianLague">Sebastian Lague</a>
	for their awesome articles and videos on Raymarching.
</div>
<div class="contactIcons">
	<SocialLinks/>
</div>