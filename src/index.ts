import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createCategory, 
  getCategories, 
  getCategory, 
  validateCategory,
  validateSlug,
  deleteCategory,
  updateCategory } from './lib/categories.db.js'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

const app = new Hono()

app.get('/', (c) => {

  const data =  [
    {
      href: '/categories',
      methods: ['GET', 'POST'],
    },
    {
      href: '/categories/:slug',
      methods: ['GET', 'PATCH', 'DELETE'],
    },
    {
      href: '/questions',
      methods: ['GET', 'POST'],
    },
    {
      href: '/questions/:cat',
      methods: ['GET', 'PATCH', 'DELETE'],
    },
  ]

  return c.json(data)
})

app.get('/categories', async (c) => {
  const categories = await getCategories();
  return c.json(categories)
})


app.post('/categories', async (c) => {
  let categoryToCreate: unknown;
  try {
    categoryToCreate = await c.req.json();
  } catch (e) {
    return c.json({ error: 'invalid json' }, 400)
  }

  const validCategory = validateCategory(categoryToCreate)

  if (!validCategory.success) {
    return c.json({ error: 'invalid data', errors: validCategory.error.flatten() }, 400)
  }

  try{
    const createdCategory = await createCategory(validCategory.data)
    return c.json(createdCategory, 201)
  } catch(e){
    if(e instanceof PrismaClientKnownRequestError && e.code === 'P2002'){
      return c.json({error: `Category with name "${validCategory.data.title}" already exists`}, 400)
    }
    return c.json({error: "Internal server error"}, 500)
  }
})


app.get('/categories/:slug', async (c) => {
  const slug = c.req.param('slug')

  // Validate á hámarkslengd á slug
  const validSlug = validateSlug(slug);

  if(!validSlug.success){
    return c.json({ error: 'invalid search', errors: validSlug.error.flatten() }, 400)
  } 

  const category = await getCategory(slug)

  if (!category) {
    return c.json({ message: 'not found' }, 404)
  }

  return c.json(category);
})

app.patch('/categories/:slug', async (c) => {
  const prevSlug = c.req.param('slug')

  let categoryToUpdate: unknown;
  try{
    categoryToUpdate = await c.req.json()
  }catch(e){
    return c.json({ error: 'invalid json' }, 400)
  }

  const validUpdate = validateCategory(categoryToUpdate)
  if (!validUpdate.success) {
    return c.json({ error: 'invalid data', errors: validUpdate.error.flatten() }, 400)
  }

  const category = await getCategory(prevSlug);

  if(!category){
    return c.json({message: "Category not found"}, 404)
  }

  try{
    const update = await updateCategory(validUpdate.data, prevSlug);
    return c.json(update, 200)
  } catch(e){
    return c.json({error: "Internal server error"}, 500);
  }


})

app.delete('/categories/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  const category = await getCategory(slug);

  if(!category){
    return c.json({message: "Category not found"}, 404)
  }

  //TODO
  //FINNA ÚT MEÐ STATUS KÓÐA 204
  try{
    await deleteCategory(category);
    console.log("deleted -> ", category);
    c.status(204);
    return;
  } catch (e){
    console.error(e);
    return c.json({error: "Internal server error"});
  }
})


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})