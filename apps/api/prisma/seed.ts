import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

const defaultCategories: CategorySeed[] = [
  // Expense categories
  { name: 'Alimentacao', type: 'EXPENSE', icon: 'utensils', color: '#ef4444' },
  { name: 'Transporte', type: 'EXPENSE', icon: 'car', color: '#f97316' },
  { name: 'Moradia', type: 'EXPENSE', icon: 'home', color: '#eab308' },
  { name: 'Saude', type: 'EXPENSE', icon: 'heart', color: '#22c55e' },
  { name: 'Educacao', type: 'EXPENSE', icon: 'book', color: '#3b82f6' },
  { name: 'Lazer', type: 'EXPENSE', icon: 'gamepad', color: '#8b5cf6' },
  { name: 'Compras', type: 'EXPENSE', icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Servicos', type: 'EXPENSE', icon: 'wrench', color: '#6366f1' },
  { name: 'Assinaturas', type: 'EXPENSE', icon: 'repeat', color: '#14b8a6' },
  { name: 'Viagem', type: 'EXPENSE', icon: 'plane', color: '#06b6d4' },
  { name: 'Pets', type: 'EXPENSE', icon: 'paw', color: '#f59e0b' },
  { name: 'Presentes Dados', type: 'EXPENSE', icon: 'gift', color: '#d946ef' },
  { name: 'Investimentos Saida', type: 'EXPENSE', icon: 'trending-up', color: '#10b981' },
  { name: 'Impostos', type: 'EXPENSE', icon: 'file-text', color: '#64748b' },
  { name: 'Outros Gastos', type: 'EXPENSE', icon: 'more-horizontal', color: '#94a3b8' },

  // Income categories
  { name: 'Salario', type: 'INCOME', icon: 'briefcase', color: '#22c55e' },
  { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#3b82f6' },
  { name: 'Rendimentos', type: 'INCOME', icon: 'trending-up', color: '#10b981' },
  { name: 'Bonus', type: 'INCOME', icon: 'award', color: '#f59e0b' },
  { name: 'Presentes Recebidos', type: 'INCOME', icon: 'gift', color: '#d946ef' },
  { name: 'Reembolso', type: 'INCOME', icon: 'rotate-ccw', color: '#6366f1' },
  { name: 'Outras Receitas', type: 'INCOME', icon: 'more-horizontal', color: '#94a3b8' },

  // Transfer category
  { name: 'Transferencia', type: 'TRANSFER', icon: 'arrow-right-left', color: '#6366f1' },
];

async function main() {
  console.log('Starting seed...');

  // Delete existing global categories (userId = null) to avoid conflicts
  await prisma.category.deleteMany({
    where: { userId: null },
  });
  console.log('Cleared existing global categories');

  // Create default categories (global, userId = null)
  const result = await prisma.category.createMany({
    data: defaultCategories.map((cat) => ({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      userId: null, // Global category
    })),
    skipDuplicates: true,
  });

  console.log(`Created ${result.count} default categories`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
