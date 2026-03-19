import Link from 'next/link';
import Particles from '@/components/Particles';

export default function Home() {
  return (
    <div className="start-screen">
      <Particles />
      <div className="start-content">
        <div className="ard-logo-badge">ARD</div>
        <h1 className="start-title">ARD Life</h1>
        <p className="start-tagline">Das Wissensduell</p>
        <p className="start-sub">2–4 Spieler · Stehle Punkte · Werde Champion</p>
        <Link href="/game" className="btn-explore">Neues Spiel ›</Link>
      </div>
    </div>
  );
}
