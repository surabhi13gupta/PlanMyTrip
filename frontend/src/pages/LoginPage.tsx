import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { Field, FormAlert } from '../components/Field'
import { Spinner } from '../components/Icons'
import { AuthLayout } from '../components/Layouts'
import { buttonClass, inputClass, linkClass } from '../components/ui'
import { useLogin } from '../hooks/useAuth'
import { errorMessage } from '../lib/errors'
import { loginSchema, type LoginValues } from '../lib/schemas'

/** US2. After login, PublicOnlyRoute sends the user to ?redirect= or /trips. */
export default function LoginPage() {
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onTouched',
  })

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.code === 'INVALID_CREDENTIALS'
          ? 'Invalid username or password.'
          : errorMessage(error),
      )
    }
  })

  return (
    <AuthLayout title="Log in">
      <form noValidate onSubmit={submit} className="grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Username" error={formState.errors.username?.message}>
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
        <Field label="Password" error={formState.errors.password?.message}>
          {(a11y) => (
            <input
              {...a11y}
              type="password"
              autoComplete="current-password"
              className={inputClass}
              {...register('password')}
            />
          )}
        </Field>
        <button type="submit" className={buttonClass.primary} disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          Log in
        </button>
      </form>
      <p className="text-[0.9375rem]">
        New here?{' '}
        <Link to="/signup" className={linkClass}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
