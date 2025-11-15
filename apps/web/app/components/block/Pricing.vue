<script setup lang="ts">
/**
 * Pricing - Block component for pricing tables (no migration needed)
 * Uses PricingCard component
 */
interface PricingProps {
  data: {
    id?: string;
    tagline?: string;
    headline?: string;
    pricing_cards: Array<{
      id: string;
      title: string;
      description?: string;
      price?: string;
      badge?: string;
      features?: string[];
      button?: {
        id: string;
        label: string | null;
        variant: string | null;
        url: string | null;
      };
      is_highlighted?: boolean;
    }>;
  };
}
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
          item: data.id,
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
          item: data.id,
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
          item: data.id,
          fields: ['pricing_cards'],
          mode: 'modal',
        })
      "
    >
      <UPricingPlans scale>
        <UPricingPlan
          v-for="card in data.pricing_cards"
          :key="card.id"
          v-bind="card"
          :price="card.price"
          :billing-cycle="card.billing_cycle"
        />
      </UPricingPlans>
      <!-- <PricingCard v-for="card in data.pricing_cards" :key="card.id" :card="card" /> -->
    </div>
  </section>
</template>
