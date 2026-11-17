require('dotenv').config();

const mongoose = require('mongoose');
const Book = require('./models/Book');
const Genre = require('./models/Genre');
const Space = require('./models/Space');
const WaitlistEntry = require('./models/WaitlistEntry');

const genres = [
  { name: 'Kenyan Classics', slug: 'kenyan-classics' },
  { name: 'Contemporary Fiction', slug: 'contemporary-fiction' },
  { name: 'Historical Fiction', slug: 'historical-fiction' },
  { name: 'Memoir', slug: 'memoir' },
  { name: 'Crime & Mystery', slug: 'crime-mystery' },
];

const books = [
  { title: 'The River and the Source', author: 'Margaret A. Ogola', isbn: '9789966466461', description: 'A multigenerational story follows Kenyan women as their family and country change across the twentieth century.', coverImage: '/covers/river-source.svg', totalCopies: 8, availableCopies: 0, genre: 'kenyan-classics' },
  { title: 'A Grain of Wheat', author: 'Ngũgĩ wa Thiong’o', isbn: '9780143039095', description: 'On the eve of independence, a village reckons with sacrifice, loyalty, and the cost of liberation.', coverImage: '/covers/grain-wheat.svg', totalCopies: 7, availableCopies: 4, genre: 'kenyan-classics' },
  { title: 'Petals of Blood', author: 'Ngũgĩ wa Thiong’o', isbn: '9780452264017', description: 'Four lives intersect as a growing town confronts inequality and the promises made after independence.', coverImage: '/covers/petals-blood.svg', totalCopies: 6, availableCopies: 3, genre: 'kenyan-classics' },
  { title: 'Wizard of the Crow', author: 'Ngũgĩ wa Thiong’o', isbn: '9780099509826', description: 'A satirical tale of power and resistance unfolds in the fictional African state of Aburĩria.', coverImage: '/covers/wizard-crow.svg', totalCopies: 5, availableCopies: 2, genre: 'kenyan-classics' },
  { title: 'Blossoms of the Savannah', author: 'Henry R. Ole Kulet', isbn: '9789966251525', description: 'Two sisters and their family navigate change, tradition, and opportunity in a Maasai community.', coverImage: '/covers/savannah-blossoms.svg', totalCopies: 8, availableCopies: 0, genre: 'contemporary-fiction' },
  { title: 'The Last Villains of Molo', author: 'Kinyanjui Kombani', isbn: '9789966251082', description: 'A young man searches for belonging and a future amid the pressures of city life.', coverImage: '/covers/last-villains-molo.svg', totalCopies: 5, availableCopies: 2, genre: 'contemporary-fiction' },
  { title: 'Going Down River Road', author: 'Meja Mwangi', isbn: '9789966466508', description: 'Workers in Nairobi struggle to find dignity and security during a season of uncertainty.', coverImage: '/covers/river-road.svg', totalCopies: 6, availableCopies: 3, genre: 'historical-fiction' },
  { title: 'Dust', author: 'Yvonne Adhiambo Owuor', isbn: '9780241976725', description: 'A family story opens onto Kenya’s memory, landscapes, and the long shadows of political violence.', coverImage: '/covers/dust.svg', totalCopies: 5, availableCopies: 1, genre: 'contemporary-fiction' },
  { title: 'Nairobi Heat', author: 'Mukoma wa Ngũgĩ', isbn: '9781616950552', description: 'A detective investigation links a murder in Madison to people and histories in Nairobi.', coverImage: '/covers/nairobi-heat.svg', totalCopies: 4, availableCopies: 0, genre: 'crime-mystery' },
  { title: 'Unbowed', author: 'Wangari Maathai', isbn: '9780307275202', description: 'The Nobel Peace Prize laureate reflects on her life, environmental work, and civic leadership in Kenya.', coverImage: '/covers/unbowed.svg', totalCopies: 7, availableCopies: 5, genre: 'memoir' },
  { title: 'The Dragonfly Sea', author: 'Yvonne Adhiambo Owuor', isbn: '9781529110872', description: 'A young woman from a Kenyan island community journeys through questions of home, identity, and belonging.', coverImage: '/covers/dragonfly-sea.svg', totalCopies: 5, availableCopies: 2, genre: 'contemporary-fiction' },
  { title: 'The Perfect Nine', author: 'Ngũgĩ wa Thiong’o', isbn: '9781786692785', description: 'An epic retelling follows the daughters of Gĩkũyũ and Mũmbi as they shape their own destinies.', coverImage: '/covers/perfect-nine.svg', totalCopies: 4, availableCopies: 3, genre: 'kenyan-classics' },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Set MONGODB_URI in your .env file before running the seed script.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await Book.deleteMany({});
  await Genre.deleteMany({});
  await WaitlistEntry.deleteMany({});

  const insertedGenres = await Genre.insertMany(genres);
  const genreIdsBySlug = new Map(insertedGenres.map((genre) => [genre.slug, genre._id]));
  const booksWithGenreIds = books.map(({ genre, ...book }) => ({
    ...book,
    genre: genreIdsBySlug.get(genre),
  }));

  await Book.insertMany(booksWithGenreIds);
  await Space.updateOne(
    { name: 'Reading Room A' },
    {
      $setOnInsert: {
        name: 'Reading Room A',
        description: 'Quiet study room for individual or small-group use.',
        active: true,
      },
    },
    { upsert: true },
  );
  console.log(`Seeded ${insertedGenres.length} genres, ${booksWithGenreIds.length} books, and a demo booking space.`);
}

seed()
  .catch((error) => {
    console.error('Catalog seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });