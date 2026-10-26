import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Shell from '../components/Shell';
import { useShop } from '../context/ShopContext';
import { btn, errorText, hint, input, label, textarea } from '../lib/ui';
import {
  passwordStrength, validateAddress, validateConfirm, validateEmail, validateLoginPassword,
  validateName, validatePassword, validatePhone,
} from '../lib/validation';

const benefit = (title, text, icon) => (
  <div className="my-[18px] grid grid-cols-[42px_1fr] gap-[14px]">
    <span className="grid size-[42px] place-items-center rounded-[10px] bg-brand text-white [&>svg]:block [&>svg]:size-5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg></span>
    <span><h3 className="mb-1 text-base">{title}</h3><p className="m-0 leading-[1.45] text-[#eee9e4]">{text}</p></span>
  </div>
);

const invalid = (errors, key) => (errors[key] ? 'true' : undefined);
const hasErrors = (errors) => Object.values(errors).some(Boolean);

function LoginForm() {
  const { login } = useShop();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = { email: validateEmail(values.email), password: validateLoginPassword(values.password) };
    if (hasErrors(next)) {
      setErrors(next);
      formRef.current.elements[next.email ? 'email' : 'password'].focus();
      return;
    }
    setSubmitting(true);
    const res = await login(values.email, values.password);
    setSubmitting(false);
    if (res.ok) {
      toast.success('Welcome back! You are logged in.');
      return navigate('/');
    }
    setErrors(res.errors ?? { form: res.error }); // same message whether the email or the password was wrong
    toast.error(res.error ?? 'Could not log in. Check the form and try again.');
  };

  return (
    <form className="[&_label]:text-white [&_p]:text-[#ff9a8f]" id="login" ref={formRef} onSubmit={submit} noValidate>
      <div className="mb-[14px]">
        <label className={label} htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" required className={input} aria-invalid={invalid(errors, 'email')} value={values.email} onChange={set('email')} onBlur={() => setErrors({ ...errors, email: validateEmail(values.email) })} />
        <p className={errorText} role="alert">{errors.email}</p>
      </div>
      <div className="mb-[14px]">
        <label className={label} htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" required className={input} aria-invalid={invalid(errors, 'password')} value={values.password} onChange={set('password')} />
        <p className={errorText} role="alert">{errors.password}</p>
      </div>
      {errors.form && <p className={errorText}>{errors.form}</p>}
      <button className={`${btn} w-full`} type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button>
    </form>
  );
}

function RegisterForm() {
  const { register } = useShop();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [values, setValues] = useState({ full_name: '', phone: '', email: '', address: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const checks = {
    full_name: (v) => validateName(v.full_name),
    phone: (v) => validatePhone(v.phone),
    email: (v) => validateEmail(v.email),
    address: (v) => validateAddress(v.address, { required: false }),
    password: (v) => validatePassword(v.password),
    confirm: (v) => validateConfirm(v.confirm, v.password),
  };
  const setError = (key, message) => setErrors((prev) => ({ ...prev, [key]: message }));
  const change = (key) => (e) => setValues({ ...values, [key]: e.target.value });
  const onBlur = (key) => () => setError(key, checks[key](values));

  // Typing a password updates its own error (not while still empty) and re-checks the confirmation
  const onPassword = (e) => {
    const next = { ...values, password: e.target.value };
    setValues(next);
    setErrors((prev) => ({
      ...prev,
      password: next.password === '' ? '' : checks.password(next),
      ...(next.confirm ? { confirm: checks.confirm(next) } : {}),
    }));
  };
  const onConfirm = (e) => {
    const next = { ...values, confirm: e.target.value };
    setValues(next);
    setError('confirm', next.confirm === '' ? '' : checks.confirm(next));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = Object.fromEntries(Object.entries(checks).map(([key, check]) => [key, check(values)]));
    if (hasErrors(next)) {
      setErrors(next);
      const first = Object.keys(next).find((key) => next[key]);
      formRef.current.elements[first].focus();
      return;
    }
    setSubmitting(true);
    const res = await register(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success('Account created. You can log in now.');
      return navigate('/register-success');
    }
    setErrors({ ...next, ...res.errors }); // e.g. the email is already registered
    toast.error(res.errors?.form ?? 'Could not create your account. Check the form and try again.');
  };

  const score = passwordStrength(values.password);
  return (
    <form className="grid grid-cols-2 gap-x-4 gap-y-[14px] max-mobile:grid-cols-1" id="register" ref={formRef} onSubmit={submit} noValidate>
      <div className="mb-[14px]"><label className={label} htmlFor="name">Full name</label><input id="name" name="full_name" type="text" required className={input} aria-invalid={invalid(errors, 'full_name')} value={values.full_name} onChange={change('full_name')} onBlur={onBlur('full_name')} /><p className={errorText} role="alert">{errors.full_name}</p></div>
      <div className="mb-[14px]"><label className={label} htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" inputMode="numeric" maxLength={8} required className={input} aria-invalid={invalid(errors, 'phone')} value={values.phone} onChange={change('phone')} onBlur={onBlur('phone')} /><p className={errorText} role="alert">{errors.phone}</p><p className={hint}>8-digit Singapore number</p></div>
      <div className="col-span-full mb-[14px]"><label className={label} htmlFor="email">Email</label><input id="email" name="email" type="email" required className={input} aria-invalid={invalid(errors, 'email')} value={values.email} onChange={change('email')} onBlur={onBlur('email')} /><p className={errorText} role="alert">{errors.email}</p></div>
      <div className="col-span-full mb-[14px]"><label className={label} htmlFor="address">Delivery address <span className={hint}>(optional)</span></label><textarea id="address" name="address" placeholder="Block, street, unit, postal code" className={textarea} aria-invalid={invalid(errors, 'address')} value={values.address} onChange={change('address')} /><p className={errorText} role="alert">{errors.address}</p></div>
      <div className="mb-[14px]"><label className={label} htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={8} required className={input} aria-invalid={invalid(errors, 'password')} value={values.password} onChange={onPassword} /><div className="mt-2 grid grid-cols-4 gap-[5px]" data-testid="strength">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 rounded-full ${i < score ? 'bg-brand' : 'bg-[#ddd8d2]'}`} />)}</div><p className={errorText} role="alert">{errors.password}</p><p className={hint}>Use 8+ characters with a letter and a digit.</p></div>
      <div className="mb-[14px]"><label className={label} htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" required className={input} aria-invalid={invalid(errors, 'confirm')} value={values.confirm} onChange={onConfirm} /><p className={errorText} role="alert">{errors.confirm}</p></div>
      <div className="col-span-full">
        {errors.form && <p className={errorText}>{errors.form}</p>}
        <button className={`${btn} w-full`} type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
        <p className="mt-4 mb-[13px] text-center font-body text-[13px] text-muted">By creating an account you can order, track deliveries and view past orders.</p>
      </div>
    </form>
  );
}

export default function LoginRegister() {
  return (
    <Shell title="Log in or Sign up" simple>
      <main>
        <section className="mx-auto mt-10 mb-24 grid max-w-[1240px] grid-cols-2 overflow-hidden rounded-[22px] border border-line bg-white max-tablet:grid-cols-1 max-mobile:mx-3 max-mobile:mt-5 max-mobile:mb-[60px]">
          <aside className="bg-night px-[50px] pt-[50px] pb-[46px] text-white max-mobile:px-6 max-mobile:py-[34px]">
            <span className="inline-flex rounded-full bg-brand px-3 py-[7px] text-xs font-black tracking-[.02em] text-white uppercase">Existing customer</span>
            <h1 className="mt-[22px] mb-[6px] text-[32px] leading-[1.12] font-black">Log in</h1>
            <p className="mb-7 text-[#eee9e4]">Welcome back. Pick up where you left off.</p>
            <LoginForm />
            <div className="mt-[30px] border-t border-[#38332f] pt-[6px]">
              <h2 className="mt-[22px] mb-0 text-[17px]">Why have an account?</h2>
              {benefit('Saved address', 'Checkout fills in your delivery details.', <><path d="M12 21s6-5.1 6-10a6 6 0 0 0-12 0c0 4.9 6 10 6 10Z" /><circle cx="12" cy="11" r="2" /></>)}
              {benefit('Live order status', 'Follow every order from kitchen to door.', <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>)}
              {benefit('Email updates', 'Confirmation and status changes in your inbox.', <><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></>)}
            </div>
          </aside>
          <div className="px-[50px] pt-[50px] pb-[46px] max-mobile:px-6 max-mobile:py-[34px]">
            <span className="inline-flex rounded-full bg-brand-soft px-3 py-[7px] text-xs font-black tracking-[.02em] text-brand-dark uppercase">New to FoodHub</span>
            <h1 className="mt-[22px] mb-[6px] text-[32px] leading-[1.05] font-black">Create your account</h1>
            <p className="mb-6 text-muted">All fields are required unless marked optional.</p>
            <RegisterForm />
          </div>
        </section>
      </main>
    </Shell>
  );
}
