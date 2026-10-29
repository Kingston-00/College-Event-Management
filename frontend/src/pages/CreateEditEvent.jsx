import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import EventForm from '../components/EventForm';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';

export default function CreateEditEvent() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data.event))
      .catch((err) => setServerError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const submit = async (payload) => {
    setSubmitting(true);
    setServerError('');
    try {
      if (editing) await api.put(`/events/${id}`, payload);
      else await api.post('/events', payload);
      toast.success(editing ? 'Event updated.' : 'Event created.');
      navigate('/admin/events');
    } catch (err) {
      setServerError(errorMessage(err));
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="container section narrow">
      <Link to="/admin/events" className="back-link">&larr; Back to events</Link>
      <h1>{editing ? 'Edit event' : 'Create event'}</h1>
      {serverError && <p className="alert alert-error" role="alert">{serverError}</p>}
      {(!editing || event) && (
        <EventForm initial={event} onSubmit={submit} submitting={submitting} submitLabel={editing ? 'Update event' : 'Create event'} />
      )}
    </div>
  );
}
