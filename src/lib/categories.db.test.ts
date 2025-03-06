import { PrismaClient } from "@prisma/client";

import { createCategory, 
    getCategories, 
    getCategory, 
    validateCategory,
    validateSlug,
    deleteCategory,
    updateCategory,
    getCategoryById } from './categories.db.js'

vi.mock("@prisma/client", ()=>{
    const prismaMock = {
        categories : {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    };
    return {
        PrismaClient: vi.fn(() => prismaMock)
    };
});

describe("categories.db", () => {
    let prisma: PrismaClient;

    beforeEach(() => {
        vi.clearAllMocks();
        prisma = new PrismaClient();
    });

    describe("getCategories", () => {
        it("should return all categories in the database", async ()=> {
            const mockCats = [
                {id: 1, title: 'mock1', slug: 'mock1'},
                {id: 2, title: 'mock2', slug: 'mock2'},
                {id: 3, title: 'mock3 with space', slug: 'mock3-with-space'}
            ];

            (prisma.categories.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockCats);

            const res = await getCategories();

            expect(res).toEqual(mockCats);
            expect(prisma.categories.findMany).toHaveBeenCalledOnce();
        })
    })
})