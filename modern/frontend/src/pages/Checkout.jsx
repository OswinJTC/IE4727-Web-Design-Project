import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Shell from '../components/Shell';
import Stepper from '../components/Stepper';
import DishImage from '../components/DishImage';
import { useShop } from '../context/ShopContext';
import { money } from '../lib/format';
import { backLink, btn, container, errorText, hint, input, label, textarea, tone } from '../lib/ui';
import { validateAddress, validateCheckoutPhone, validateNotes } from '../lib/validation';

const PAYMENTS = [
  { value: 'cash', title: 'Cash on delivery', text: 'Pay the rider in cash' },
  { value: 'card', title: 'Card on delivery', text: 'Rider brings a card reader' },
  { value: 'paynow', title: 'PayNow', text: 'Scan the QR on delivery' },
];

const formCard = 'rounded-2xl border border-line bg-white px-8 py-[30px] max-mobile:px-5 max-mobile:py-[22px]';
const formTitle = 'mb-6 flex items-center gap-[14px] text-2xl';
const miniIcon = 'grid size-[42px] shrink-0 place-items-center rounded-[10px] [&>svg]:block [&>svg]:size-5';

const icon = (paths) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{paths}</svg>;

function CheckoutForm() {
  const { user, summary, placeOrder } = useShop();
  const navigate = useNavigate();
  // Delivery details start from the account and stay editable for this order only
  const [address, setAddress] = useState(user?.address ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [payment, setPayment] = useState('cash');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false); // set at once, so a second click in the same moment is ignored too

  if (!user) return <Navigate to="/login" replace />; // checking out needs an account

  const submit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    const next = {};
    const addressError = validateAddress(address, { required: true });
    const phoneError = validateCheckoutPhone(phone);
    const notesError = validateNotes(notes);
    if (addressError) next.address = addressError;
    if (phoneError) next.phone = phoneError;
    if (!PAYMENTS.some((p) => p.value === payment)) next.payment = 'Choose a payment method.';
    if (notesError) next.notes = notesError;
    if (summary.lines.length === 0) next.form = 'Your cart is empty.';

    if (Object.keys(next).length === 0) {
      // The server checks everything again and is the one that counts
      busy.current = true;
      setSubmitting(true);
      const res = await placeOrder({ address, phone, payment, notes });
      busy.current = false;
      setSubmitting(false);
      if (res.ok) {
        toast.success(`Order #${res.orderId} placed. Thank you!`);
        return navigate(`/orders?id=${res.orderId}`);
      }
      setErrors(res.errors);
      toast.error(res.errors.form ?? 'Could not place your order. Check the form and try again.');
      return;
    }
    setErrors(next);
    toast.error(next.form ?? 'Please fix the highlighted fields.');
  };

  return (
    <Shell title="Checkout">
      <main className={container}>
        <div className="mb-[30px] flex items-center justify-between gap-5 max-tablet:flex-col max-tablet:items-start"><h1 className="text-5xl leading-[1.05] font-black max-mobile:text-[34px]">Checkout</h1><Stepper step={2} /></div>
        <form className="grid grid-cols-[minmax(0,1fr)_390px] items-start gap-8 max-tablet:grid-cols-1" onSubmit={submit} noValidate>
          <div className="grid gap-[26px]">
            <section className={formCard}>
              <h2 className={formTitle}><span className={`${miniIcon} ${tone.peach}`}>{icon(<><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>)}</span>Delivery details</h2>
              <div className="mb-[14px]">
                <label className={label} htmlFor="address">Delivery address</label>
                <textarea id="address" name="address" required className={`${textarea} min-h-[126px]!`} aria-invalid={errors.address ? 'true' : undefined} value={address} onChange={(e) => setAddress(e.target.value)} />
                <p className={errorText} id="address-error" role="alert">{errors.address}</p>
                <p className={hint}>Pre-filled from your account. Edit for this order only.</p>
              </div>
              <div className="mb-[14px]">
                <label className={label} htmlFor="phone">Contact phone</label>
                <input id="phone" name="phone" type="tel" inputMode="numeric" maxLength={8} required aria-describedby="phone-error" className={`${input} min-h-14! max-w-[420px]`} aria-invalid={errors.phone ? 'true' : undefined} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <p className={errorText} id="phone-error" role="alert">{errors.phone}</p>
              </div>
            </section>
            <section className={formCard}>
              <h2 className={formTitle}><span className={`${miniIcon} ${tone.blue}`}>{icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>)}</span>Payment method</h2>
              <div className="grid grid-cols-3 gap-4 max-tablet:grid-cols-1">
                {PAYMENTS.map((p) => (
                  <label key={p.value} className="relative m-0 flex cursor-pointer text-sm font-bold items-center gap-[14px] rounded-[14px] border border-line bg-white px-5 py-[22px] has-[:checked]:border-2 has-[:checked]:border-brand has-[:checked]:bg-[#fff7f2] has-[:checked]:px-[19px] has-[:checked]:py-[21px] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-soft">
                    <input className="m-0 size-[22px] min-h-0 shrink-0 p-0 accent-brand" type="radio" name="payment" value={p.value} checked={payment === p.value} onChange={() => setPayment(p.value)} />
                    <span><strong className="mb-1 block text-lg">{p.title}</strong><small className="font-body text-[15px] font-normal text-muted">{p.text}</small></span>
                  </label>
                ))}
              </div>
              <p className={errorText} role="alert">{errors.payment}</p>
            </section>
            <section className={formCard}>
              <h2 className={formTitle}><span className={`${miniIcon} ${tone.peach}`}>{icon(<path d="M4 20h4L19 9l-4-4L4 16v4Z" />)}</span>Notes for the kitchen <small className="font-body text-base font-normal text-muted">(optional)</small></h2>
              <textarea id="notes" name="notes" maxLength={255} placeholder="e.g. Less spicy, no bean sprouts" aria-label="Notes for the kitchen" className={`${textarea} min-h-[126px]!`} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <p className={errorText} role="alert">{errors.notes}</p>
              <p className="mt-2 text-right font-body text-[15px] text-muted">{notes.length} / 255</p>
            </section>
          </div>
          <aside className="sticky top-[90px] self-start rounded-[20px] border border-line bg-white px-8 py-[30px] max-tablet:static max-mobile:px-5 max-mobile:py-[22px]">
            <h2 className="mb-[18px] text-[26px]">Order summary</h2>
            {summary.lines.map((l) => (
              <div key={l.id} className="mb-4 grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-[14px]"><DishImage dish={l} /><span><h3 className="mb-[3px] text-[17px]">{l.name}</h3><p className="m-0 text-sm text-muted">Qty {l.count}</p></span><strong className="font-body text-lg font-bold">{money(l.subtotal)}</strong></div>
            ))}
            {summary.lines.length === 0 && <p className="m-0 text-center text-sm leading-[1.45] text-muted">Your cart is empty. <Link className={backLink} to="/menu">Browse the menu</Link></p>}
            <div className="mt-[22px] flex items-center justify-between border-t border-line pt-[22px] pb-[18px] font-body text-lg text-muted"><span>Items ({summary.items})</span><span>{money(summary.total)}</span></div>
            <div className="flex items-center justify-between border-t border-line pt-[18px] text-[17px] font-black"><span>Total</span><strong className="text-[26px]">{money(summary.total)}</strong></div>
            <p className={`${errorText} justify-center`} role="alert">{errors.form}</p>
            {summary.lines.length > 0 && <button className={`${btn} mt-6 mb-[18px] min-h-14! w-full text-[17px]`} type="submit" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'}</button>}
            <Link className="mb-[14px] block text-center font-black text-brand" to="/cart">Back to cart</Link>
            <p className="m-0 text-center text-sm leading-[1.45] text-muted">You'll get a confirmation email once the order is placed.</p>
          </aside>
        </form>
      </main>
    </Shell>
  );
}

export default function Checkout() {
  const { ready } = useShop();
  if (!ready) return <Shell title="Checkout"><main className={container} /></Shell>;
  return <CheckoutForm />;
}
