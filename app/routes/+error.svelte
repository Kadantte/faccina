<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
</script>

<div class="absolute inset-x-0 top-52 m-auto flex h-fit w-fit flex-col">
	{#if $page.error?.status}
		<p class="text-5xl font-extralight">{$page.error.status}</p>
	{/if}
	<p class="text-4xl font-medium">
		{$page.error?.message}
	</p>

	<Separator class="my-4" />

	<Button
		class="mb-4 h-12 w-full text-lg"
		data-sveltekit-preload-data="off"
		href="/"
		variant="outline">Go home</Button
	>
</div>
