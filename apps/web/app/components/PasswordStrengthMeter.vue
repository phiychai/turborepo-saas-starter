<template>
  <div class="password-strength-meter">
    <div class="strength-bar">
      <div
        :class="['strength-fill', strengthColor]"
        :style="{ width: `${strengthPercentage}%` }"
      ></div>
    </div>

    <div class="strength-info">
      <span class="strength-label" :class="strengthColor">
        {{ strengthLabel }}
      </span>
      <span v-if="score < 2" class="strength-warning">
        {{ feedback.warning }}
      </span>
    </div>

    <ul v-if="feedback.suggestions.length > 0" class="suggestions">
      <li v-for="(suggestion, index) in feedback.suggestions" :key="index">
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface Props {
  password: string;
  score: number; // 0-4 from zxcvbn
  feedback?: {
    suggestions: string[];
    warning: string | null;
  };
}

const props = withDefaults(defineProps<Props>(), {
  feedback: () => ({ suggestions: [], warning: null }),
});

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['red', 'orange', 'yellow', 'blue', 'green'];

const strengthLabel = computed(() => {
  return strengthLabels[props.score] || 'Unknown';
});

const strengthColor = computed(() => {
  return strengthColors[props.score] || 'gray';
});

const strengthPercentage = computed(() => {
  // Convert score (0-4) to percentage (0-100)
  return ((props.score + 1) / 5) * 100;
});
</script>

<style scoped>
.password-strength-meter {
  margin-top: 0.5rem;
}

.strength-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-fill.red {
  background: #ef4444;
}

.strength-fill.orange {
  background: #f97316;
}

.strength-fill.yellow {
  background: #eab308;
}

.strength-fill.blue {
  background: #3b82f6;
}

.strength-fill.green {
  background: #22c55e;
}

.strength-info {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.strength-label {
  font-weight: 500;
}

.suggestions {
  margin-top: 0.5rem;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.suggestions li {
  margin-top: 0.25rem;
}
</style>
