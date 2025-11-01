<script setup lang="ts">
import type { Post, DirectusUser } from '@turborepo-saas-starter/shared-types/schema';

const route = useRoute();
const { enabled, state } = useLivePreview();
const { isVisualEditingEnabled, apply, setAttr } = useVisualEditing();
const postUrl = useRequestURL();

const slug = route.params.slug as string;

const wrapperRef = ref<HTMLElement | null>(null);

const {
	public: { directusUrl },
} = useRuntimeConfig();

const { data, error, refresh } = await useFetch<{
	post: Post;
	relatedPosts: Post[];
}>(() => `/api/posts/${slug}`, {
	key: `posts-${slug}`,
	query: {
		preview: enabled.value ? true : undefined,
		token: enabled.value ? state.token : undefined,
	},
});

if (!data.value || error.value) {
	throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true });
}

const post = computed(() => data.value?.post);
const relatedPosts = computed(() => data.value?.relatedPosts);
const author = computed(() => post.value?.author as Partial<DirectusUser>);

onMounted(() => {
	if (!isVisualEditingEnabled.value) return;
	apply({
		directusUrl,
		onSaved: () => refresh(),
	});
});

useSeoMeta({
	title: post.value?.seo?.title || post.value?.title,
	description: post.value?.seo?.meta_description || post.value?.description,
	ogTitle: post.value?.seo?.title || post.value?.title,
	ogDescription: post.value?.seo?.meta_description || post.value?.description,
	ogUrl: postUrl.toString(),
});
</script>
<template>
	<UContainer v-if="post" ref="wrapperRef">
		<UPageHeader :title="post.title" :description="post.description">
			<template #headline>
				<UBadge v-if="post.tags?.length" variant="subtle">{{ post.tags[0]?.name }}</UBadge>
				<span class="text-muted" v-if="post.published_at">&middot;</span>
				<time class="text-muted" v-if="post.published_at">
					{{ new Date(post.published_at).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }) }}
				</time>
			</template>
         <div class="flex flex-wrap items-center gap-3 mt-4">

        <UButton


          color="neutral"
          variant="subtle"
          target="_blank"
          size="sm"
        >
          <!-- <UAvatar
            v-bind="post.author.avatar"
            alt="Author avatar"
            size="2xs"
          /> -->

          {{ post.author.first_name }}{{  post.author.last_name }}
        </UButton>
      </div>
		</UPageHeader>

		<!-- <div v-if="post.image" class="mb-8 w-full">
			<div
				class="relative w-full h-[400px] overflow-hidden rounded-lg"
				:data-directus="setAttr({ collection: 'posts', item: post.id, fields: ['image'], mode: 'modal' })"
			>
				<DirectusImage
					:uuid="post.image as string"
					:alt="post.title || 'post header image'"
					class="object-cover w-full h-full"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
					fill
				/>
			</div>
		</div> -->

		<UPage>
			<UPageBody>

         <!-- <ContentRenderer
          v-if="post"
          :value="post.content"
        /> -->
 <!-- <UContentSurround :surround="surround" /> -->
				<Text
					:content="post.content || ''"
					:data-directus="setAttr({ collection: 'posts', item: post.id, fields: ['content'], mode: 'drawer' })"
				/>

				<USeparator class="my-8" />

				<div v-if="relatedPosts?.length">
					<h3 class="font-bold mb-4">Related Posts</h3>
					<div class="space-y-4">
						<NuxtLink
							v-for="relatedPost in relatedPosts"
							:key="relatedPost.id"
							:to="`/blog/${relatedPost.slug}`"
							class="flex items-center space-x-4 hover:text-accent group"
						>
							<div v-if="relatedPost.image" class="relative shrink-0 w-[150px] h-[100px] overflow-hidden rounded-lg">
								<DirectusImage
									:uuid="relatedPost.image as string"
									:alt="relatedPost.title || 'related post image'"
									class="object-cover transition-transform duration-300 group-hover:scale-110"
									fill
									sizes="(max-width: 768px) 100px, (max-width: 1024px) 150px, 150px"
								/>
							</div>
							<span class="font-heading">{{ relatedPost.title }}</span>
						</NuxtLink>
					</div>
				</div>
			</UPageBody>
		</UPage>
	</UContainer>
	<div v-else class="text-center text-xl mt-[20%]">404 - Post Not Found</div>
</template>
