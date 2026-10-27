import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { TrashIcon } from '../../components/icons';
import { AdminIcon, AdminSearch, CATEGORIES, Errors, money, useAdmin } from './Admin';

const blankDish = () => ({
  id: null,
  name: '',
  category: 'Mains',
  price: '',
  description: '',
  image: '',
  available: true,
});

function Photo({ dish }) {
  return (
    <span className={`admin-thumbnail category-${dish.category.toLowerCase()}`}>
      {dish.image && <img src={dish.image} alt="" />}
    </span>
  );
}

function DishEditor({ dish, onClose, onSaved }) {
  const { reload, setNotice, handleError, loadDishes, updateDish } = useAdmin();
  const [values, setValues] = useState(dish);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const field = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }));
  useEffect(() => {
    if (!photo) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const submit = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setErrors({});
    const form = new FormData();
    for (const key of ['name', 'category', 'price', 'description', 'available'])
      form.append(key, values[key]);
    if (photo) form.append('photo', photo);
    let saved;
    try {
      saved = await api.adminSaveDish(values.id, form);
    } catch (err) {
      handleError(err);
      setErrors(err.errors ?? { form: err.message });
    }
    if (saved) {
      updateDish(saved);
      setNotice(values.id ? 'Dish updated.' : 'Dish added.');
      const refreshed = await reload();
      await loadDishes();
      onSaved(saved, refreshed?.menu);
    }
    lock.current = false;
    setSaving(false);
  };
  return (
    <aside className="admin-card admin-editor" aria-label={values.id ? 'Edit dish' : 'Add dish'}>
      <div className="admin-panel-heading">
        <h2>{values.id ? 'Edit dish' : 'Add dish'}</h2>
        <button type="button" aria-label="Close editor" disabled={saving} onClick={onClose}>
          ×
        </button>
      </div>
      <Errors errors={errors} />
      <form onSubmit={submit}>
        <fieldset className="admin-editor-fields" disabled={saving}>
          <label className="admin-photo">
            <Photo dish={{ ...values, image: preview || values.image }} />
            <span>
              <strong>{values.image || preview ? 'Replace photo' : 'Upload photo'}</strong>
              <small>JPG or PNG, up to 2 MB</small>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Upload dish photo"
              onChange={(event) => {
                const file = event.target.files[0];
                if (
                  file &&
                  (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type))
                ) {
                  setErrors({ photo: 'Choose a JPG or PNG photo up to 2 MB.' });
                  event.target.value = '';
                  return;
                }
                setErrors({});
                setPhoto(file ?? null);
              }}
            />
          </label>
          <label className="admin-field">
            Name
            <input
              name="name"
              value={values.name}
              onChange={field('name')}
              maxLength={100}
              required
              aria-invalid={!!errors.name}
            />
          </label>
          <div className="admin-field-pair">
            <label className="admin-field">
              Category
              <select name="category" value={values.category} onChange={field('category')}>
                {CATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              Price ($)
              <input
                name="price"
                type="number"
                min="0.01"
                max="9999.99"
                step="0.01"
                value={values.price}
                onChange={field('price')}
                required
                aria-invalid={!!errors.price}
              />
            </label>
          </div>
          <label className="admin-field">
            Description
            <textarea
              name="description"
              rows={4}
              maxLength={5000}
              value={values.description}
              onChange={field('description')}
              aria-invalid={!!errors.description}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={values.available}
              onChange={(event) => setValues({ ...values, available: event.target.checked })}
            />
            <span className="admin-switch" />
            Show on customer menu
          </label>
          <div className="admin-form-actions">
            <button className="btn" type="submit">
              {saving ? 'Saving…' : values.id ? 'Save changes' : 'Add dish'}
            </button>
            <button className="btn light" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </fieldset>
      </form>
    </aside>
  );
}

export default function ManageMenu() {
  const { menu, reload, setNotice, handleError, loadDishes, updateDish, removeDish } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [editor, setEditor] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState({});
  const [deleting, setDeleting] = useState(null);
  const dialog = useRef(null);
  const deleteTrigger = useRef(null);
  const mutationLock = useRef(false);
  const q = params.get('q') ?? '';
  const category = CATEGORIES.includes(params.get('category')) ? params.get('category') : '';
  const visibility = ['shown', 'hidden'].includes(params.get('visibility'))
    ? params.get('visibility')
    : '';
  const filtered = menu.filter(
    (dish) =>
      (!q || `${dish.name} ${dish.description}`.toLowerCase().includes(q.toLowerCase())) &&
      (!category || dish.category === category) &&
      (!visibility || dish.available === (visibility === 'shown')),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const rawPage = Number(params.get('page'));
  const page = Math.min(Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1, pages);
  const visible = filtered.slice((page - 1) * 5, page * 5);
  const editing = editor === undefined ? (visible[0] ?? null) : editor;
  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: 1, ...changes }))
      value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if (deleting) dialog.current?.showModal();
  }, [deleting]);
  const closeDelete = () => {
    dialog.current?.close();
    setDeleting(null);
    deleteTrigger.current?.focus();
  };
  const afterSave = (dish, refreshedMenu = menu) => {
    const sorted = [...refreshedMenu.filter((item) => item.id !== dish.id), dish].sort(
      (a, b) => a.id - b.id,
    );
    const savedPage = Math.floor(sorted.findIndex((item) => item.id === dish.id) / 5) + 1;
    setEditor(dish);
    updateParams({ q: '', category: '', visibility: '', page: savedPage });
  };

  const mutate = async (action, success, applyResult) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setError({});
    try {
      const result = await action();
      applyResult(result);
      setNotice(result.message ?? success);
      setEditor(undefined);
      await reload();
      await loadDishes();
      closeDelete();
    } catch (err) {
      handleError(err);
      setError(err.errors ?? { form: err.message });
    } finally {
      setBusy(false);
      mutationLock.current = false;
    }
  };

  const toggleVisibility = (dish) =>
    mutate(
      () => api.adminVisibility(dish.id, !dish.available),
      'Menu visibility updated.',
      updateDish,
    );
  const deleteDish = () =>
    mutate(
      () => api.adminDeleteDish(deleting.id),
      'Dish deleted.',
      (result) =>
        result.hidden ? updateDish({ ...deleting, available: false }) : removeDish(deleting.id),
    );

  return (
    <>
      <header className="admin-heading">
        <div>
          <h1>Manage menu</h1>
          <p>
            {menu.length} dishes · {menu.filter((dish) => dish.available).length} on the menu,{' '}
            {menu.filter((dish) => !dish.available).length} hidden
          </p>
        </div>
        <button
          className="btn"
          type="button"
          disabled={busy}
          onClick={() => setEditor(blankDish())}
        >
          ＋ Add dish
        </button>
      </header>
      <Errors errors={error} />
      <div className={`admin-columns${editing ? '' : ' no-panel'}`}>
        <section className="admin-card admin-list" aria-label="Dishes">
          <div className="admin-filters">
            <AdminSearch
              label="Search dishes"
              value={q}
              onChange={(value) => updateParams({ q: value })}
            />
            <select
              aria-label="Filter category"
              value={category}
              onChange={(event) => updateParams({ category: event.target.value })}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select
              aria-label="Filter visibility"
              value={visibility}
              onChange={(event) => updateParams({ visibility: event.target.value })}
            >
              <option value="">Any status</option>
              <option value="shown">Shown</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table menu-admin-table">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>On menu</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((dish) => (
                  <tr key={dish.id} className={editing?.id === dish.id ? 'selected' : ''}>
                    <td>
                      <button type="button" className="admin-dish" onClick={() => setEditor(dish)}>
                        <Photo dish={dish} />
                        <span>
                          <strong>{dish.name}</strong>
                          <small>{dish.description}</small>
                        </span>
                      </button>
                    </td>
                    <td>{dish.category}</td>
                    <td className="admin-money">{money(dish.price)}</td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={dish.available}
                        className="admin-toggle-button"
                        aria-label={`${dish.available ? 'Hide' : 'Show'} ${dish.name}`}
                        disabled={busy}
                        onClick={() => toggleVisibility(dish)}
                      >
                        <span className={`admin-switch${dish.available ? ' on' : ''}`} />
                        {dish.available ? 'Shown' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-icon-button"
                          aria-label={`Edit ${dish.name}`}
                          onClick={() => setEditor(dish)}
                        >
                          <AdminIcon name="edit" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-button danger"
                          aria-label={`Delete ${dish.name}`}
                          disabled={busy}
                          onClick={(event) => {
                            deleteTrigger.current = event.currentTarget;
                            setDeleting(dish);
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      No dishes found. Try another search or add a dish.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="admin-table-footer">
            <span>
              Showing {filtered.length ? (page - 1) * 5 + 1 : 0}–
              {Math.min(page * 5, filtered.length)} of {filtered.length}
            </span>
            <nav className="admin-pagination" aria-label="Menu pages">
              {page > 1 && (
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() => updateParams({ page: page - 1 })}
                >
                  ‹
                </button>
              )}
              {Array.from({ length: pages }, (_, i) => (
                <button
                  type="button"
                  key={i}
                  className={page === i + 1 ? 'active' : ''}
                  aria-current={page === i + 1 ? 'page' : undefined}
                  onClick={() => updateParams({ page: i + 1 })}
                >
                  {i + 1}
                </button>
              ))}
              {page < pages && (
                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() => updateParams({ page: page + 1 })}
                >
                  ›
                </button>
              )}
            </nav>
          </footer>
        </section>
        {editing && (
          <DishEditor
            key={`${editing.id ?? 'new'}-${editing.available}-${editing.image}`}
            dish={editing}
            onClose={() => setEditor(null)}
            onSaved={afterSave}
          />
        )}
      </div>
      <dialog
        ref={dialog}
        className="admin-confirm"
        aria-labelledby="delete-dish-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else closeDelete();
        }}
      >
        <h2 id="delete-dish-title">Delete {deleting?.name}?</h2>
        <p>Dishes used in past orders will be hidden instead, so order history stays available.</p>
        <div className="admin-form-actions">
          <button type="button" className="btn light" disabled={busy} onClick={closeDelete}>
            Cancel
          </button>
          <button type="button" className="btn" disabled={busy} onClick={deleteDish}>
            {busy ? 'Deleting…' : 'Delete dish'}
          </button>
        </div>
      </dialog>
    </>
  );
}
