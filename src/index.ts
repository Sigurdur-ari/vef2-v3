import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { createCategory, 
  getCategories, 
  getCategory, 
  validateCategory,
  validateSlug,
  deleteCategory,
  updateCategory,
  getCategoryById } from './lib/categories.db.js'
import { getQuestions,
  getQuestionsByCat,
  validateQuestion,
  createQuestion } from './lib/questions.db.js'

const app = new Hono()

//INDEX ROUTE
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

//CATEGORY ROUTES
app.get('/categories', async (c) => {
  try {
    const categories = await getCategories();
    return c.json(categories)
  } catch (e) {
    return c.json({error: "Internal server error"}, 500)
  }
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
  try {
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
  } catch (e) {
    return c.json({error: "Internal server error"}, 500)
  }
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
    return c.json({error: "Internal server error"}, 500);
  }
})


//QUESTION ROUTES
app.get('/questions', async (c) =>{
  try {
    const questions = await getQuestions();
    return c.json(questions)
  } catch (e) {
    return c.json({error: "Internal server error"}, 500)
  }
})

 
app.post('/questions', async (c) => {
  let questionToCreate;
  try {
    questionToCreate = await c.req.json();
  } catch (e) {
    return c.json({ error: 'invalid json' }, 400)
  }

  const validQuestion = validateQuestion(questionToCreate)

  if (!validQuestion.success) {
    return c.json({ error: 'invalid data', errors: validQuestion.error.flatten() }, 400)
  }

  if(! await getCategoryById(validQuestion.data.cat_id)){
    return c.json({message: "Category not found in database"}, 400)
  }

  try{
    const createdCategory = await createQuestion(validQuestion.data)
    return c.json(createdCategory, 201)
  } catch(e){
    console.log(e);
    return c.json({error: "Internal server error"}, 500)
  }
})

app.get('/questions/:cat_id', async (c) => {
  const cat_id = Number(c.req.param('cat_id'));

  if(isNaN(cat_id)){
    return c.json({error: "Invalid category ID, must be a number"}, 400);
  }

  if(! await getCategoryById(cat_id)){
    return c.json({message: "Category not found in database"}, 404)
  }

  try{
    const questionsByCat = await getQuestionsByCat(cat_id);
    return c.json(questionsByCat)
  }catch (e){
    return c.json({error: "Internal server error"}, 500);
  }
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})