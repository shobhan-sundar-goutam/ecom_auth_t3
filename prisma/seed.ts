import { faker } from "@faker-js/faker";
import { db } from "~/server/db";

const data = Array.from({ length: 100 }).map(() => ({
  categoryName: faker.commerce.department(),
}));

async function main() {
  await db.category.createMany({
    data,
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
