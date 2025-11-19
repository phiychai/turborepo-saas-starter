<script setup lang="ts">
/**
 * Pricing - Block component for pricing tables (no migration needed)
 * Uses PricingCard component
 */
import type { PricingProps } from '~/types/components';

defineProps<PricingProps>();
const { setAttr } = useVisualEditing();
</script>

<template>
  <section>
    <Tagline
      v-if="data.tagline"
      :tagline="data.tagline"
      :data-directus="
        setAttr({
          collection: 'block_pricing',
          item: data.id || null,
          fields: 'tagline',
          mode: 'popover',
        })
      "
    />
    <Headline
      v-if="data.headline"
      :headline="data.headline"
      :data-directus="
        setAttr({
          collection: 'block_pricing',
          item: data.id || null,
          fields: 'headline',
          mode: 'popover',
        })
      "
    />

    <div
      class="grid gap-6 mt-8"
      :class="{
        'grid-cols-1': data.pricing_cards.length === 1,
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': data.pricing_cards.length % 3 === 0,
        'grid-cols-1 sm:grid-cols-2':
          data.pricing_cards.length % 2 !== 0 && data.pricing_cards.length !== 1,
      }"
      :data-directus="
        setAttr({
          collection: 'block_pricing',
          item: data.id || null,
          fields: ['pricing_cards'],
          mode: 'modal',
        })
      "
    >
      <UPricingPlans scale>
        <UPricingPlan
          v-for="card in data.pricing_cards"
          :key="card.id"
          :title="card.title"
          :description="card.description"
          :price="card.price"
          :badge="card.badge"
          :features="card.features"
          :button="
            card.button && card.button.label
              ? {
                  label: card.button.label,
                  ...(card.button.variant
                    ? {
                        variant: card.button.variant as
                          | 'solid'
                          | 'outline'
                          | 'soft'
                          | 'subtle'
                          | 'ghost'
                          | 'link',
                      }
                    : {}),
                  ...(card.button.url ? { to: card.button.url } : {}),
                }
              : undefined
          "
        />
      </UPricingPlans>
      <!-- <PricingCard v-for="card in data.pricing_cards" :key="card.id" :card="card" /> -->
    </div>
  </section>
</template>
