export const up = async (db) => {
  const collections = await db.listCollections({ name: 'apps' }).toArray();
  if (collections.length === 0) {
    await db.createCollection('apps');
  }

  await db.collection('apps').createIndex({ createdAt: -1 });
};

export const down = async (db) => {
  const collections = await db.listCollections({ name: 'apps' }).toArray();
  if (collections.length === 0) {
    return;
  }

  await db.dropCollection('apps');
};
