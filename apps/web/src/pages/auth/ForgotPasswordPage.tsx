import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setEmailSent(true);
      toast.success('Email enviado!');
    } catch {
      // Don't reveal if email exists
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
          <svg
            className="h-6 w-6 text-success-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Verifique seu email</h2>
        <p className="mt-2 text-sm text-gray-600">
          Se existir uma conta com esse email, voce recebera um link para redefinir sua senha.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Esqueceu sua senha?</h2>
      <p className="mt-2 text-sm text-gray-600">
        Digite seu email e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="seu@email.com"
            {...register('email', {
              required: 'Email e obrigatorio',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email invalido',
              },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger-500">{errors.email.message}</p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar email de recuperacao'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Voltar para o login
          </Link>
        </p>
      </form>
    </div>
  );
}
