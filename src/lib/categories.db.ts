import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const CategorySchema = z.object({
  id: z.number(),
  title: z
    .string()
    .min(3, 'title must be at least three letters')
    .max(1024, 'title must be at most 1024 letters'),
  slug: z.string(),
});

const CategoryToCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'title must be at least three letters')
    .max(1024, 'title must be at most 1024 letters'),
});

const SlugToVerifySchema = z.string()
    .min(3, 'category name is not shorter than 3 letters')
    .max(1024, 'category name is not longer than 1024 letters')

type Category = z.infer<typeof CategorySchema>;
type CategoryToCreate = z.infer<typeof CategoryToCreateSchema>;
type Slug = z.infer<typeof SlugToVerifySchema>;


const prisma = new PrismaClient();

export async function getCategories(
  limit: number = 10,
  offset: number = 0,
): Promise<Array<Category>> {
  const categories = await prisma.categories.findMany();
  return categories;
}

export async function getCategory(slug: Slug): Promise<Category | null> {
  const cat = await prisma.categories.findUnique(
    { where: {slug}}
  );

  return cat ?? null;
}

export function validateCategory(categoryToValidate: unknown) {
  const result = CategoryToCreateSchema.safeParse(categoryToValidate);

  return result;
}

export function validateSlug(slug: string){
    const result = SlugToVerifySchema.safeParse(slug);
    return result;
}

export async function createCategory(categoryToCreate: CategoryToCreate): Promise<Category> {
  const createdCategory = await prisma.categories.create({
    data: {
      title: categoryToCreate.title,
      slug: categoryToCreate.title.toLowerCase().replaceAll(' ', '-'),
    },
  });

  return createdCategory;
}

export async function updateCategory(categoryToUpdate: CategoryToCreate, prevSlug: Slug): Promise<Category>{
  const updatedCategory = await prisma.categories.update({
    where: { slug: prevSlug },
    data: {
      title: categoryToUpdate.title,
      slug: categoryToUpdate.title.toLowerCase().replaceAll(' ', '-'),
    },
  });

  return updatedCategory;
}

export async function deleteCategory(categoryToDelete: Category){
  const deletedCat = await prisma.categories.delete(
    {
      where: {slug: categoryToDelete.slug}
    })

  return deletedCat;
}