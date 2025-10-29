<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Sign up',
  description: 'Create an account to get started'
})

const toast = useToast()
const router = useRouter()
const { register, login, isAuthenticated } = useAuth()

// Redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/dashboard')
  }
})

const fields = [{
  name: 'name',
  type: 'text' as const,
  label: 'Name',
  placeholder: 'Enter your name'
}, {
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email'
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password'
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Sign up with Google - Coming soon' })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    toast.add({ title: 'GitHub', description: 'Sign up with GitHub - Coming soon' })
  }
}]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const result = await register({
    email: payload.data.email,
    password: payload.data.password,
    fullName: payload.data.name
  })

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'Account created successfully! Logging you in...',
      color: 'green'
    })

    // Auto-login after successful registration
    const loginResult = await login(payload.data.email, payload.data.password)
    if (loginResult.success) {
      router.push('/dashboard')
    }
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'Registration failed',
      color: 'red'
    })
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :providers="providers"
    title="Create an account"
    :submit="{ label: 'Create account' }"
    @submit="onSubmit"
  >
    <template #description>
      Already have an account? <ULink
        to="/login"
        class="text-primary font-medium"
      >Login</ULink>.
    </template>

    <template #footer>
      By signing up, you agree to our <ULink
        to="/"
        class="text-primary font-medium"
      >Terms of Service</ULink>.
    </template>
  </UAuthForm>
</template>
