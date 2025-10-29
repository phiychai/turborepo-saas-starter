<script setup lang="ts">
/**
 * Posts - Migrated to Nuxt UI
 * Uses UPagination for pagination controls
 */
import type { Post } from '@turborepo-saas-starter/shared-types/schema';

interface PostsProps {
	data: {
		id?: string;
		tagline?: string;
		headline?: string;
		posts: Post[];
		limit: number;
	};
}

const props = defineProps<PostsProps>();

const route = useRoute();
const router = useRouter();

const perPage = props.data.limit || 6;
const currentPage = ref(Number(route.query.page) || 1);

const { data: postsData, error } = await useFetch<{
	posts: Post[];
	count: number;
}>('/api/posts', {
	key: `block-posts-${props.data?.id}-${currentPage.value}`,
	query: { page: currentPage, limit: perPage },
	watch: [currentPage],
});

const posts = computed(() => postsData.value?.posts || []);
const totalPages = computed(() => Math.ceil((postsData.value?.count || 0) / perPage));

function handlePageChange(page: number) {
	if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
		currentPage.value = page;
		router.push({ query: { page } });
	}
}

const { setAttr } = useVisualEditing();
</script>

<template>
	<div>
		<Tagline
			v-if="data.tagline"
			:tagline="data.tagline"
			:data-directus="
				setAttr({
					collection: 'block_posts',
					item: data.id,
					fields: 'tagline',
					mode: 'popover',
				})
			"
		/>
		<Headline
			v-if="data.headline"
			:headline="data.headline"
			:data-directus="setAttr({ collection: 'block_posts', item: data.id, fields: 'headline', mode: 'popover' })"
		/>

		<div
			class="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
			:data-directus="
				setAttr({
					collection: 'block_posts',
					item: data.id,
					fields: ['collection', 'limit'],
					mode: 'popover',
				})
			"
		>
			<template v-if="posts?.length">
				<NuxtLink
					v-for="post in posts"
					:key="post.id"
					:to="`/blog/${post.slug}`"
					class="group block overflow-hidden rounded-lg"
				>
					<div class="relative w-full h-[256px] overflow-hidden rounded-lg">
						<DirectusImage
							v-if="post.image"
							:uuid="typeof post.image === 'string' ? post.image : post.image?.id"
							:alt="post.title"
							class="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
							sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
						/>
					</div>
					<div class="p-4">
						<h3 class="text-xl group-hover:text-accent font-heading transition-colors duration-300">
							{{ post.title }}
						</h3>
						<p v-if="post.description" class="text-sm text-foreground mt-2">
							{{ post.description }}
						</p>
					</div>
				</NuxtLink>
			</template>
			<p v-else class="text-center text-gray-500">No posts available.</p>
		</div>
		<ClientOnly>
			<div v-if="totalPages > 1 && posts?.length" class="flex justify-center mt-8">
				<UPagination
					v-model="currentPage"
					:total="postsData?.count || 0"
					:page-count="perPage"
					:max="5"
					:ui="{
						wrapper: 'flex items-center gap-1',
						rounded: 'rounded-full',
						default: {
							activeButton: {
								variant: 'solid'
							}
						}
					}"
					@update:model-value="handlePageChange"
				/>
			</div>
		</ClientOnly>
	</div>
</template>
