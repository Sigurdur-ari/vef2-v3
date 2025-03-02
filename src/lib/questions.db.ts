import xss from 'xss';
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
        .min(2, "A question must have at least 2 answers")
        .max(6, "A question can have a maximum of 6 answers")
})

type Question = z.infer<typeof questionSchema>
type answer = z.infer<typeof answerSchema>
type QuestionToCreate = z.infer<typeof questionToCreateSchema>

const prisma = new PrismaClient();


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

export function validateQuestion(questionToValidate: unknown){
    const result = questionToCreateSchema.safeParse(questionToValidate);

    return result;
}

export async function createQuestion(questionToCreate: QuestionToCreate): Promise<Question>{
    const sanitizedText = xss(questionToCreate.text);

    const createdQuestion = await prisma.questions.create({
        data: {
          text: sanitizedText,
          cat_id: questionToCreate.cat_id,
        }
    });

    const answerArray = await Promise.all(
        questionToCreate.answers.map(async (a) => {
            const sanitizedAnswerText = xss(a.text);
            const answer = await prisma.answers.create({
            data: {
                text: sanitizedAnswerText,
                correct: a.correct,
                q_id: createdQuestion.id
            }
        });
        return answer;
    }));

    const returnQuestion: Question = {
        text: createdQuestion.text,
        id: createdQuestion.id,
        cat_id: createdQuestion.cat_id,
        answers: answerArray
    };
    
    return returnQuestion;
}

export async function getQuestion(q_id: number): Promise<Question | null>{
    const question = await prisma.questions.findUnique({
        where: {id: q_id}
    });

    if(!question){
        return null
    };

    const answers = await getAnswers(q_id);

    const returnQuestion: Question = {
        text: question.text,
        id: question.id,
        cat_id: question.cat_id,
        answers: answers
    };


    return returnQuestion;
}

export async function updateQuestion(questionToUpdate: QuestionToCreate, qu_id: number): Promise<Question>{
    const sanitizedText = xss(questionToUpdate.text);

    const updatedQuestion = await prisma.questions.update({
        where: {id: qu_id},
        data: {
            text: sanitizedText,
            cat_id: questionToUpdate.cat_id
        }
    });

    //Virkni sem sér til þess að ef notandi breytir fjölda svara
    //þá virkar þetta samt vel. 

    //Eyða gömlum svörum
    await prisma.answers.deleteMany({
        where: {q_id: qu_id}
    });

    //Búa til ný svör
    await prisma.answers.createMany({
        data: questionToUpdate.answers.map((a) => ({
          text: xss(a.text),
          correct: a.correct,
          q_id: qu_id
        }))
    });

    //Sækja öll ný svör
    const updatedAnswers = await prisma.answers.findMany({
        where: { q_id: qu_id }
    });

    const returnQuestion: Question = {
        text: updatedQuestion.text,
        id: qu_id,
        cat_id: updatedQuestion.cat_id,
        answers: updatedAnswers
    };

    return returnQuestion;
}

export async function deleteQuestion(questionToDelete: Question){
    await prisma.questions.delete({
        where: {id: questionToDelete.id}
    });
}

