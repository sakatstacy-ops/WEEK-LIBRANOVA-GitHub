import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export default function ReadingListPage() {
  const [catalog, setCatalog] = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingBook, setPendingBook] = useState('');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isReadingList = location.pathname === '/reading-list';

  async function loadPage() {
    setError('');
    const [bookResult, listResult, waitlistResult] = await Promise.all([
      api('/books'),
      user ? api('/reading-list') : Promise.resolve({ books: [] }),
      user ? api('/waitlist') : Promise.resolve({ waitlist: [] }),
    ]);
    setCatalog(bookResult.books);
    setReadingList(listResult.books);
    setWaitlist(waitlistResult.waitlist);
  }

  useEffect(() => {
    loadPage()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [user]);

  async function updateReadingList(book, method) {
    if (!user) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    setError('');
    setNotice('');
    setPendingBook(book._id);
    try {
      const result = await api(`/reading-list/${book._id}`, { method });
      setReadingList(result.books);
      setNotice(method === 'POST' ? 'Book added to your reading list.' : 'Book removed from your reading list.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBook('');
    }
  }

  async function requestBorrow(book) {
    if (!user) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    setError('');
    setNotice('');
    setPendingBook(book._id);
    try {
      await api('/borrow-requests', {
        method: 'POST',
        body: JSON.stringify({ bookId: book._id }),
      });
      await loadPage();
      setNotice(`Borrow request submitted for “${book.title}”.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBook('');
    }
  }

  async function updateWaitlist(book, method) {
    if (!user) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    setError('');
    setNotice('');
    setPendingBook(book._id);
    try {
      await api(`/waitlist/${book._id}`, { method });
      await loadPage();
      setNotice(method === 'POST'
        ? `You joined the waitlist for “${book.title}”.`
        : `You left the waitlist for “${book.title}”.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBook('');
    }
  }

  const savedIds = new Set(readingList.map((book) => book._id));
  const waitlistByBook = new Map(waitlist.map((entry) => [entry.book._id, entry]));
  const genres = [...new Map(catalog
    .filter((book) => book.genre?.name)
    .map((book) => [book.genre._id || book.genre.name, book.genre.name])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((first, second) => first.name.localeCompare(second.name));
  const visibleBooks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return catalog.filter((book) => {
      const saved = savedIds.has(book._id);
      const matchesList = !isReadingList || saved;
      const matchesGenre = genreFilter === 'all'
        || (book.genre?._id || book.genre?.name) === genreFilter;
      const searchableText = [
        book.title,
        book.author,
        book.description,
        book.isbn,
        book.genre?.name,
      ].join(' ').toLocaleLowerCase();
      return matchesList && matchesGenre && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [catalog, genreFilter, isReadingList, readingList, search]);

  if (loading) {
    return <p className="state-message" role="status">Loading the catalog…</p>;
  }

  return (
    <>
      {!isReadingList && (
        <section className="catalog-hero">
          <div className="hero-copy">
            <p className="eyebrow">Your next chapter starts here</p>
            <h1>Kenyan stories, shared <em>together.</em></h1>
            <p>Discover voices from across Kenya, save the books you love, and make your local library part of every day.</p>
            <a className="hero-link" href="#catalog">Explore the collection <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-visual">
            <img alt="Illustration of a welcoming neighborhood library reading nook" src="/maktabalink-library.svg" />
            <div className="hero-note" aria-label={`${catalog.length} books in the collection`}>
              <span className="hero-note-number">{catalog.length}</span>
              <span>books to<br />discover</span>
              <span className="hero-note-rule" />
              <span className="hero-note-caption">Stories from Kenya<br />and beyond.</span>
            </div>
          </div>
          <span className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <span className="hero-orbit hero-orbit-two" aria-hidden="true" />
        </section>
      )}
      <div className={`catalog-heading${isReadingList ? ' catalog-heading-saved' : ''}`} id="catalog">
        <div>
          <p className="eyebrow">{isReadingList ? 'Your personal collection' : 'Find something wonderful'}</p>
          <h2>{isReadingList ? 'Your reading list' : 'Explore the collection'}</h2>
          <p className="muted">
            {isReadingList
              ? 'Your saved titles are all in one place. Ready when you are.'
              : 'Browse by title, author, or genre and find your next favorite.'}
          </p>
        </div>
        <span className="catalog-count">{isReadingList ? readingList.length : catalog.length} titles</span>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {notice && <p className="notice success" role="status">{notice}</p>}
      {!error && catalog.length > 0 && (
        <div className="catalog-toolbar">
          <label className="search-field">
            <span className="sr-only">Search books</span>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              autoComplete="off"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles, authors, genres..."
              type="search"
              value={search}
            />
          </label>
          <label className="genre-field">
            <span className="sr-only">Filter by genre</span>
            <select onChange={(event) => setGenreFilter(event.target.value)} value={genreFilter}>
              <option value="all">All genres</option>
              {genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
            </select>
          </label>
        </div>
      )}
      {!error && catalog.length === 0 ? (
        <p className="empty-state">The collection is getting ready. Please check back soon.</p>
      ) : !error && visibleBooks.length === 0 ? (
        <div className="empty-state">
          <strong>{isReadingList && readingList.length === 0 ? 'Your reading list is waiting.' : 'No books found.'}</strong>
          <p>
            {isReadingList && readingList.length === 0
              ? 'Save a title from the collection and it will appear here.'
              : 'Try another title, author, or genre.'}
          </p>
          {isReadingList && readingList.length === 0 && (
            <Link className="primary-button empty-action" to="/discover">Discover books</Link>
          )}
        </div>
      ) : !error && (
        <div className="book-grid">
          {visibleBooks.map((book) => {
            const saved = savedIds.has(book._id);
            const waitlistEntry = waitlistByBook.get(book._id);
            return (
              <article className="book-card" key={book._id}>
                <BookCover book={book} />
                <div className="book-card-body">
                  <p className="book-genre">{book.genre?.name || 'Library collection'}</p>
                  <h3>{book.title}</h3>
                  <p className="book-author">by {book.author}</p>
                  <p className="book-description">{book.description}</p>
                  <p className={`availability${book.availableCopies === 0 ? ' unavailable' : ''}`}>
                    <span className="availability-dot" aria-hidden="true" />
                    {book.availableCopies > 0
                      ? `${book.availableCopies} ${book.availableCopies === 1 ? 'copy' : 'copies'} available`
                      : 'Currently checked out'}
                  </p>
                  <div className="book-actions">
                    <button
                      aria-label={saved ? `Remove ${book.title} from your reading list` : `Save ${book.title} to your reading list`}
                      className={`save-button${saved ? ' is-saved' : ''}`}
                      disabled={pendingBook === book._id}
                      onClick={() => updateReadingList(book, saved ? 'DELETE' : 'POST')}
                      type="button"
                    >
                      {saved ? 'Saved' : '♡ Save'}
                    </button>
                    {saved && user && (
                      <button
                        className="primary-button request-button"
                        disabled={
                          pendingBook === book._id
                          || book.availableCopies < 1
                          || Boolean(waitlistEntry && !waitlistEntry.isNext)
                        }
                        onClick={() => requestBorrow(book)}
                        type="button"
                      >
                        {pendingBook === book._id
                          ? 'Sending…'
                          : waitlistEntry?.isNext && book.availableCopies > 0
                            ? 'Your turn — request'
                            : 'Request a copy'}
                      </button>
                    )}
                    {waitlistEntry ? (
                      <button
                        className="text-button waitlist-action"
                        disabled={pendingBook === book._id}
                        onClick={() => updateWaitlist(book, 'DELETE')}
                        type="button"
                      >
                        Queued #{waitlistEntry.position} · Leave
                      </button>
                    ) : book.availableCopies === 0 && (
                      <button
                        className="secondary-button waitlist-action"
                        disabled={pendingBook === book._id}
                        onClick={() => updateWaitlist(book, 'POST')}
                        type="button"
                      >
                        {pendingBook === book._id ? 'Joining…' : 'Join waitlist'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function BookCover({ book }) {
  const [imageFailed, setImageFailed] = useState(false);
  const coverImage = book.coverImage && !book.coverImage.includes('images.example.com');
  const useImage = coverImage && !imageFailed;
  const genreSlug = book.genre?.slug || 'collection';

  return (
    <div className={`book-cover cover-${genreSlug}`}>
      {useImage ? (
        <img
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={book.coverImage}
        />
      ) : (
        <div className="cover-placeholder" aria-hidden="true">
          <span className="cover-brand">MAKTABALINK · LIBRARY EDITION</span>
          <span className="cover-art-shape" />
          <span className="cover-title">{book.title}</span>
          <span className="cover-author">{book.author}</span>
        </div>
      )}
    </div>
  );
}
