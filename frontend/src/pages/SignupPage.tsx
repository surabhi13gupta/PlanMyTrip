import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Field, FormAlert } from '../components/Field'
import { Spinner } from '../components/Icons'
import { AuthLayout } from '../components/Layouts'
import { buttonClass, inputClass, linkClass } from '../components/ui'
import { useSignup } from '../hooks/useAuth'
import { applyFieldErrors, errorMessage } from '../lib/errors'
import { signupSchema, type SignupValues } from '../lib/schemas'

/** US1. After signup the user is logged in; PublicOnlyRoute then sends them to /trips. */
export default function SignupPage() {
  const signup = useSignup()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, setError, formState } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  })

  const submit = handleSubmit(async ({ username, password }) => {
    setFormError(null)
    try {
      // "Confirm password" is checked here only; it isn't sent (api-contract-spec.md §6.1).
      await signup.mutateAsync({ username, password })
    } catch (error) {
      // 409 USERNAME_TAKEN appears under the username field; anything else above the form.
      if (!applyFieldErrors(error, setError, ['username', 'password'])) {
        setFormError(errorMessage(error))
      }
    }
  })

  return (
    <AuthLayout title="Create an account">
      <form noValidate onSubmit={submit} className="grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field
          label="Username"
          hint="3–30 letters, numbers, or underscores"
          error={formState.errors.username?.message}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              className={inputClass}
              {...register('username')}
            />
          )}
        </Field>
        <Field label="Password" hint="At least 8 characters" error={formState.errors.password?.message}>
          {(a11y) => (
            <input
              {...a11y}
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...register('password')}
            />
          )}
        </Field>
        <Field label="Confirm password" error={formState.errors.confirmPassword?.message}>
          {(a11y) => (
            <input
              {...a11y}
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...register('confirmPassword')}
            />
          )}
        </Field>
        <button type="submit" className={buttonClass.primary} disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          Create account
        </button>
      </form>
      <p className="text-[0.9375rem]">
        Already have an account?{' '}
        <Link to="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
