import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';
import { downloadBlob, formatDateTime } from '../utils/helpers';

export default function EventRegistrations() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get(`/registrations/event/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const toggleAttendance = async (reg) => {
    try {
      await api.patch(`/registrations/${reg._id}/attendance`, { attended: reg.status !== 'attended' });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get(`/admin/events/${id}/export`, { responseType: 'blob' });
      downloadBlob(res.data, `${data.event.title.replace(/[^a-z0-9]+/gi, '_')}_attendees.csv`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (error) return <div className="container section"><p className="alert alert-error" role="alert">{error}</p></div>;
  if (!data) return <Loader fullPage />;

  const active = data.registrations.filter((r) => r.status !== 'cancelled');
  const attended = data.registrations.filter((r) => r.status === 'attended').length;

  return (
    <div className="container section">
      <Link to="/admin/events" className="back-link">&larr; Back to events</Link>
      <div className="section-head">
        <h1>{data.event.title}: attendees</h1>
        <button type="button" className="btn btn-primary" onClick={exportCsv}>Download CSV</button>
      </div>
      <p className="muted">{active.length} registered · {attended} attended · {data.event.capacity} capacity</p>

      {data.registrations.length ? (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Registrations for {data.event.title}</caption>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Roll no.</th><th scope="col">Department</th><th scope="col">Registered</th><th scope="col">Status</th><th scope="col">Attendance</th></tr>
            </thead>
            <tbody>
              {data.registrations.map((r) => (
                <tr key={r._id}>
                  <td>{r.user?.name}</td>
                  <td>{r.user?.email}</td>
                  <td>{r.user?.rollNumber || '-'}</td>
                  <td>{r.user?.department || '-'}</td>
                  <td>{formatDateTime(r.registeredAt)}</td>
                  <td><span className={`badge badge-inline badge-reg-${r.status}`}>{r.status}</span></td>
                  <td>
                    {r.status !== 'cancelled' && (
                      <button type="button" className={`btn btn-sm ${r.status === 'attended' ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggleAttendance(r)}>
                        {r.status === 'attended' ? 'Undo' : 'Mark attended'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">No one has registered yet.</p>
      )}
    </div>
  );
}
