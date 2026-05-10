// Заповнення БД тестовими оголошеннями для перевірки API:
// пагінації, пошуку, сортування. Запуск: `npm run db:seed`.

import prisma from './client.js'

const titles = [
  'Ноутбук ASUS ROG, майже новий',
  'Iphone 14 Pro Max, ідеальний стан',
  'Ремонт компʼютерів вдома',
  'Вакансія: Junior Node.js розробник',
  'Велосипед гірський Trek',
  'Послуги репетитора з англійської',
  'Продам диван, стан хороший',
  'Шукаю няню для дитини 3 роки',
  'PlayStation 5 + 2 геймпади',
  'Дизайн логотипу за 24 години',
  'Робота курʼєром у центрі міста',
  'Пилосос Dyson V11, як новий',
  'Послуги електрика, виклик безкоштовно',
  'Вакансія: контент-менеджер віддалено',
  'Камера Canon EOS R6 + обʼєктив',
  'Продам гітару акустичну Yamaha',
  'Послуги клінінгу квартир та офісів',
  'Шукаю програміста на проєкт фріланс',
  'Скейтборд новий у коробці',
  'Уроки гри на фортепіано',
  'Робота офіціантом у ресторані',
  'Холодильник Bosch, гарантія 6 міс',
  'Майстер-клас з суші',
  'Вакансія: бухгалтер part-time',
  'Курси з веб-розробки за 3 місяці',
]

const contacts = [
  '+380501112233',
  '+380672223344',
  'sale@example.com',
  'hr@company.io',
  '+380939876543',
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const main = async () => {
  await prisma.announcement.deleteMany({})

  const items = titles.map((title, idx) => {
    let category = 'other'
    if (/продам|купив|нов/i.test(title)) category = 'sale'
    if (/ремонт|послуги|майстер|клінінг|уроки/i.test(title)) category = 'service'
    if (/вакансія|робота|шукаю/i.test(title)) category = 'job'

    const daysAgo = idx % 12
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    return {
      title,
      description:
        title +
        '. Більше деталей за запитом. ' +
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      price: Math.round((Math.random() * 50000 + 100) * 100) / 100,
      category,
      contactInfo: pick(contacts),
      createdAt,
    }
  })

  for (const item of items) {
    await prisma.announcement.create({ data: item })
  }

  const total = await prisma.announcement.count()
  console.log(`Seed complete. Created ${total} announcements.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
