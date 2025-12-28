import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signup(data.email, data.password, data.name);
      toast.success('Conta criada com sucesso!');
      navigate('/onboarding');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Criar sua conta</h2>
      <p className="mt-2 text-sm text-gray-600">
        Ja tem uma conta?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Faca login
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="label">
            Nome
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="Seu nome"
            {...register('name', {
              required: 'Nome e obrigatorio',
              minLength: { value: 2, message: 'Nome muito curto' },
            })}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-danger-500">{errors.name.message}</p>
          )}
        </div>

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

        <div>
          <label htmlFor="password" className="label">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={`input ${errors.password ? 'input-error' : ''}`}
            placeholder="Minimo 8 caracteres"
            {...register('password', {
              required: 'Senha e obrigatoria',
              minLength: { value: 8, message: 'Minimo 8 caracteres' },
            })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-danger-500">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            placeholder="Digite a senha novamente"
            {...register('confirmPassword', {
              required: 'Confirme sua senha',
              validate: (value) => value === password || 'Senhas nao conferem',
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-danger-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Criando conta...
            </span>
          ) : (
            'Criar conta gratis'
          )}
        </button>

        <p className="text-center text-xs text-gray-500">
          Ao criar uma conta, voce concorda com nossos{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Termos de Servico
          </a>{' '}
          e{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Politica de Privacidade
          </a>
        </p>
      </form>
    </div>
  );
}
