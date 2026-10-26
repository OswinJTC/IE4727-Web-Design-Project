import { Link } from 'react-router-dom';
import Shell from '../components/Shell';
import { btn } from '../lib/ui';

export default function RegisterSuccess() {
  return (
    <Shell title="Register Success" simple footer={false}>
      <main>
        <section className="mx-auto mt-20 mb-[120px] max-w-[520px] rounded-[22px] border border-line bg-white px-10 py-12 text-center">
          <h1 className="mb-[10px] text-[32px] leading-[1.05] font-black">Register success</h1>
          <p className="mb-7 text-muted">Your account has been created.</p>
          <Link className={`${btn} px-7!`} to="/login">Back to log in</Link>
        </section>
      </main>
    </Shell>
  );
}
