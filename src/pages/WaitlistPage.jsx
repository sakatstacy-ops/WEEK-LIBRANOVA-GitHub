import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function WaitlistPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingBook, setPendingBook] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadWaitlist() {
    setError('');
    const result = await api('/waitlist');
    setEntries(result.waitlist);
  }

  useEffect(() => {
    loadWaitlist()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function leaveWaitlist(entry) {
    setPendingBook(entry.book._id);
    setError('');
    setNotice('');
    try {
      await api(`/waitlist/${entry.book._id}`, { method: 'DELETE' });
      await loadWaitlist();
      setNotice(`You left the waitlist for “${entry.book.title}”.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBook('');
    }
  }

  async function requestCopy(entry) {
    setPendingBook(entry.book._id);
    setError('');
    setNotice('');
    try {
      await api('/borrow-requests', {
        method: 'POST',
        body: JSON.stringify({ bookId: entry.book._id }),
      });
      await loadWaitlist();
      setNotice(`Your borrow request for “${entry.book.title}” has been submitted.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBook('');
    }
  }

  async function saveBook(entry) {
    setPendingBook(entry.book._id);
    setError('');
    setNotice('');
    try {
      await api(`/reading-list/${entry.book._id}`, { method: 'POST' });
      await loadWaitlist();
      setNotice(`“${entry.book.title}” is now on your reading list.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBook('');
    }
  }

  if (loading) {
    return <p className="state-message" role="status">Loading your waitlist…</p>;
  }

  return (
    <section className="waitlist-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your place in line</p>
          <h1>My waitlist</h1>
          <p className="muted">We keep your place in order and show when a copy is ready.</p>
        </div>
        <Link className="secondary-button" to="/discover">Discover books</Link>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {notice && <p className="notice success" role="status">{notice}</p>}
      {!error && entries.length === 0 ? (
        <div className="empty-state">
          <strong>Your waitlist is clear.</strong>
          <p>When a title is checked out, join its waitlist from the catalog to save your place.</p>
          <Link className="primary-button empty-action" to="/discover">Browse the catalog</Link>
        </div>
      ) : !error && (
        <div className="waitlist-grid">
          {entries.map((entry) => {
            const ready = entry.isNext && entry.book.availableCopies > 0;
            const availability = entry.book.availableCopies;
            return (
              <article className="waitlist-card" key={entry._id}>
                <div>
                  <p className="book-genre">{entry.book.genre?.name || 'Library collection'}</p>
                  <h2>{entry.book.title}</h2>
                  <p className="muted">by {entry.book.author}</p>
                </div>
                <p className={`waitlist-position${ready ? ' is-ready' : ''}`}>
                  {ready
                    ? 'A copy is available — you’re next.'
                    : `Position ${entry.position} in line${availability > 0 ? ` · ${availability} ${availability === 1 ? 'copy' : 'copies'} available` : ''}`}
                </p>
                {!entry.isSaved && ready && (
                  <p className="muted">Save this title from the catalog before requesting a copy.</p>
                )}
                <div className="button-row">
                  {ready && entry.isSaved && (
                    <button
                      className="primary-button"
                      disabled={pendingBook === entry.book._id}
                      onClick={() => requestCopy(entry)}
                      type="button"
                    >
                      {pendingBook === entry.book._id ? 'Requesting…' : 'Request your copy'}
                    </button>
                  )}
                  {!entry.isSaved && ready && (
                    <button
                      className="primary-button"
                      disabled={pendingBook === entry.book._id}
                      onClick={() => saveBook(entry)}
                      type="button"
                    >
                      {pendingBook === entry.book._id ? 'Saving…' : 'Save book'}
                    </button>
                  )}
                  <button
                    className="secondary-button"
                    disabled={pendingBook === entry.book._id}
                    onClick={() => leaveWaitlist(entry)}
                    type="button"
                  >
                    Leave waitlist
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
