import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const answerSchema = z.object({
    id: z.number(),
    text: z.string()
        .min(1, 'Answer must be at least 1 letters')
        .max(1024, 'Answer cannot be longer than 1024 letters'),
    correct: z.boolean(),
    q_id: z.number()
})

const answerToCreateSchema = z.object({
    text: z.string()
        .min(1, 'Answer must be at least 1 letters')
        .max(1024, 'Amsswer cannot be longer than 1024 letters'),
    correct: z.boolean()
})

const questionSchema = z.object({
    id: z.number(),
    text: z.string()
        .min(4, 'Question must be at least 4 letters')
        .max(1024, 'Question cannot be longer than 1024 letters'),
    cat_id: z.number(),
    answers: z.array(answerSchema)
        .min(2, "A question have at least 2 answers")
        .max(6, "A question can have a maximum of 6 answers")
})

const questionToCreateSchema = z.object({
    text: z.string()
        .min(4, 'Question must be at least 4 letters')
        .max(1024, 'Question cannot be longer than 1024 letters'),
    cat_id: z.number(),
    answers: z.array(answerToCreateSchema)
        .min(2, "A question have at least 2 answers")
        .max(6, "A question can have a maximum of 6 answers")
})

type Question = z.infer<typeof questionSchema>
type answer = z.infer<typeof answerSchema>
type QuestionToCreate = z.infer<typeof questionToCreateSchema>

const prisma = new PrismaClient();

const questionsTest = [{
    id: 1,
    text: "hvað er matur",
    cat_id: 2,
    answers: [
        {
            id: 1,
            text: "svar 1",
            q_id: 1,
            correct: true
        },{
            id: 2,
            text: "svar 2",
            q_id: 1,
            correct: false
        },{
            id: 3,
            text: "svar 3",
            q_id: 1,
            correct: false
        },{
            id: 4,
            text: "svar 4",
            q_id: 1,
            correct: false
        },
    ]
},{
    id: 2,
    text: "hvað er html",
    cat_id: 1,
    answers: [
        {
            id: 5,
            text: "svar 1",
            q_id: 2,
            correct: true
        },{
            id: 6,
            text: "svar 2",
            q_id: 2,
            correct: false
        },{
            id: 7,
            text: "svar 3",
            q_id: 2,
            correct: false
        },{
            id: 8,
            text: "svar 4",
            q_id: 2,
            correct: false
        },
    ]
},
]

export async function getQuestions(
    limit: number = 10,
    offset: number = 0
    ): Promise<Array<Question>>{
    const questions = await prisma.questions.findMany();

    const fullQuestions = await Promise.all(
        questions.map(async (question) => {
            const answers = await getAnswers(question.id)
            return {
                id: question.id,
                text: question.text,
                cat_id: question.cat_id,
                answers: answers
            }
        })
    );
    return fullQuestions;
}

async function getAnswers(q_id: number): Promise<Array<answer>>{
    const answers = await prisma.answers.findMany({
        where: {q_id: q_id}
    })
    //const answers = questionsTest[q_id-1].answers;
    return answers;
}

export async function getQuestionsByCat(
    c_id: number, 
    limit: number = 10,
    offset: number = 0): Promise<Array<Question>>{
    const questionsByCat = await prisma.questions.findMany({
        where: {cat_id: c_id}
    });

    const fullQuestions = await Promise.all(
        questionsByCat.map(async (question) => {
            const answers = await getAnswers(question.id)
            return {
                id: question.id,
                text: question.text,
                cat_id: question.cat_id,
                answers: answers
            }
        })
    );
    return fullQuestions;
}

export function validateQuestion(questionToValidate: QuestionToCreate){
    const result = questionToCreateSchema.safeParse(questionToValidate);

    return result;
}

export async function createQuestion(questionToCreate: QuestionToCreate): Promise<Question>{
    const createdQuestion = await prisma.questions.create({
        data: {
          text: questionToCreate.text,
          cat_id: questionToCreate.cat_id,
        }
    });

    const answerArray = await Promise.all(
        questionToCreate.answers.map(async (a) => {
        const answer = await prisma.answers.create({
            data: {
                text: a.text,
                correct: a.correct,
                q_id: createdQuestion.id
            }
        });
        return answer
    }));

    const returnQuestion: Question = {
        text: createdQuestion.text,
        id: createdQuestion.id,
        cat_id: createdQuestion.cat_id,
        answers: answerArray
    }
    
    return returnQuestion

}

