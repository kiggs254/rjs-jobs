import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@rjscoffee.co.ke'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'
  const name = process.env.SEED_ADMIN_NAME ?? 'RJS Admin'

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash },
  })
  console.log(`✔ Admin ready: ${admin.email}`)

  // Seed one sample job so the portal isn't empty on first run.
  const existing = await prisma.job.findUnique({ where: { slug: 'barista' } })
  if (!existing) {
    await prisma.job.create({
      data: {
        title: 'Barista',
        slug: 'barista',
        location: 'Nairobi',
        employmentType: 'FULL_TIME',
        status: 'OPEN',
        description:
          "RJ's Coffee is hiring a friendly, detail-oriented Barista to craft great coffee and deliver warm customer service. Experience with espresso machines is a plus.",
        questions: {
          create: [
            {
              order: 0,
              text: 'Describe your experience making espresso-based drinks (latte, cappuccino, flat white).',
              type: 'LONG_TEXT',
              weight: 30,
              gradingCriteria:
                'Strong answers show hands-on experience with an espresso machine, understanding of milk texturing, and knowledge of specific drinks. Vague or no experience scores low.',
            },
            {
              order: 1,
              text: 'A customer says their coffee is wrong and is visibly upset. What do you do?',
              type: 'LONG_TEXT',
              weight: 30,
              gradingCriteria:
                'Strong answers show empathy, apologising, remaking the drink promptly, and staying calm. Defensive or dismissive answers score low.',
            },
            {
              order: 2,
              text: 'Which shifts can you work?',
              type: 'MULTIPLE_CHOICE',
              options: ['Mornings', 'Afternoons', 'Evenings', 'Weekends', 'Any'],
              weight: 15,
              gradingCriteria:
                'Flexibility is preferred; "Any" or "Weekends" scores highest for a coffee shop.',
            },
            {
              order: 3,
              text: 'How many years of customer-facing work do you have?',
              type: 'NUMBER',
              weight: 25,
              gradingCriteria: 'More years is better; 2+ years scores well.',
            },
          ],
        },
      },
    })
    console.log('✔ Sample "Barista" job created')
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
