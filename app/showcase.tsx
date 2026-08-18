"use client";

import Link from "next/link";

const formats = [
  ["Social stories", "9:16", "Launch, announce and inspire in full-screen motion."],
  ["Square campaigns", "1:1", "Scroll-stopping posts shaped for every feed."],
  ["Lyric & brand films", "16:9", "Build cinematic sequences with sound, type and footage."],
  ["HTML5 display", "Responsive", "Export lightweight creative for websites and ad placements."],
];
const categories = ["Music & lyrics", "Business", "Faith", "Events", "Wellness", "Community", "Motivation", "Your own idea"];
function Arrow() { return <span aria-hidden="true">↗</span>; }

export function Showcase() {
  return <main className="showcase">
    <header className="showcase-nav">
      <Link className="showcase-brand" href="/" aria-label="MotionMint home">Motion<span>Mint</span><i /></Link>
      <nav aria-label="Main navigation"><a href="#possibilities">Possibilities</a><a href="#how">How it works</a><a href="#work">Showcase</a></nav>
      <Link className="showcase-nav-cta" href="/create">Open studio <Arrow /></Link>
    </header>

    <section className="showcase-hero">
      <div className="showcase-hero-copy">
        <p className="showcase-kicker"><i /> Motion design, made touchable</p>
        <h1>Make your<br />message <em>move.</em></h1>
        <p className="showcase-lede">A mobile-first creative studio for animated banners, lyric videos, social campaigns and digital experiences—without a timeline full of headaches.</p>
        <div className="showcase-actions"><Link className="showcase-primary" href="/create">Start creating <Arrow /></Link><a className="showcase-secondary" href="#work">See what moves <span>↓</span></a></div>
        <div className="showcase-trust"><span>One idea</span><i /><span>Every ratio</span><i /><span>Your media</span><i /><span>Your motion</span></div>
      </div>
      <Link href="/create" className="showcase-stage" aria-label="Open the MotionMint banner studio">
        <div className="stage-orbit orbit-one" /><div className="stage-orbit orbit-two" />
        <div className="stage-card stage-story"><small>NEW COLLECTION · 01</small><strong>Move<br />different.</strong><span>Designed for the moment ↗</span><i className="stage-sphere" /></div>
        <div className="stage-card stage-square"><small>WEEKLY NOTE</small><strong>Make space<br />for good things.</strong><span>02 / 04</span></div>
        <div className="stage-card stage-wide"><small>LIVE THIS FRIDAY</small><strong>FEEL<br />THE SOUND</strong><span>PLAY THE STORY →</span></div>
        <div className="stage-cursor"><span>Open studio</span><b>↗</b></div>
      </Link>
    </section>

    <div className="showcase-marquee" aria-label="Supported creative formats"><div>{["SOCIAL STORIES", "LYRIC VIDEOS", "HTML5 BANNERS", "EVENT SCREENS", "BUSINESS PROMOS", "DIGITAL INVITES", "SOCIAL STORIES", "LYRIC VIDEOS"].map((item, index) => <span key={`${item}-${index}`}>{item}<i>✦</i></span>)}</div></div>

    <section className="showcase-intro" id="possibilities">
      <p className="showcase-section-number">01 / POSSIBILITIES</p>
      <div><h2>One studio.<br /><em>More than video.</em></h2><p>MotionMint separates your words, media, visual style and animation. That means one project can become a social post, a website banner, an event screen or a downloadable video—without rebuilding the idea every time.</p></div>
    </section>

    <section className="format-grid">
      {formats.map(([name, ratio, copy], index) => <article key={name} className={`format-card format-${index + 1}`}><div className="format-visual"><span>{ratio}</span><b>{index === 0 ? <>STORY /<br />IN MOTION</> : index === 1 ? <>A GOOD<br />IDEA GROWS</> : index === 2 ? <>TURN UP<br />THE FEELING</> : <>MAKE THE<br />WEB MOVE</>}</b><i /></div><small>0{index + 1}</small><h3>{name}</h3><p>{copy}</p></article>)}
    </section>

    <section className="showcase-work" id="work">
      <div className="work-heading"><p className="showcase-section-number">02 / MADE TO MOVE</p><h2>A campaign<br />in every shape.</h2><Link href="/create">Explore templates <Arrow /></Link></div>
      <div className="work-wall">
        <div className="work-banner work-a"><span>MORNING / 06:42</span><strong>Begin<br />gently.</strong><i /></div>
        <div className="work-banner work-b"><span>LIMITED RELEASE</span><strong>BRIGHT<br />IDEAS</strong><b>Built to stand out.</b></div>
        <div className="work-banner work-c"><span>LIVE SESSION 04</span><strong>ONE<br />MORE<br />SONG</strong><i /></div>
        <div className="work-banner work-d"><span>COMMUNITY DAY</span><strong>Good grows<br />when shared.</strong><b>Saturday · 11 AM</b></div>
      </div>
    </section>

    <section className="showcase-how" id="how">
      <div className="how-copy"><p className="showcase-section-number">03 / HOW IT WORKS</p><h2>From blank screen<br />to <em>brilliant scene.</em></h2><p>Start with a template or your own direction. MotionMint keeps the powerful parts close, without making creativity feel technical.</p><Link className="showcase-primary light" href="/create">Make your first project <Arrow /></Link></div>
      <ol className="how-list">
        <li><span>01</span><div><h3>Choose your canvas</h3><p>Social, display, widescreen or a custom use case.</p></div><i>↗</i></li>
        <li><span>02</span><div><h3>Make it yours</h3><p>Add scenes, words, languages, media, sound and branding.</p></div><i>↗</i></li>
        <li><span>03</span><div><h3>Give it motion</h3><p>Mix cinematic transitions, particles, masks, Lottie and 3D atmosphere.</p></div><i>↗</i></li>
        <li><span>04</span><div><h3>Publish your way</h3><p>Prepare video, HTML, OBS and campaign-ready outputs.</p></div><i>↗</i></li>
      </ol>
    </section>

    <section className="showcase-everyone"><p className="showcase-section-number">04 / FOR EVERY STORY</p><h2>No fixed niche.<br /><em>Your message leads.</em></h2><div className="category-cloud">{categories.map((category, index) => <Link href="/create" key={category}><span>0{index + 1}</span>{category}<Arrow /></Link>)}</div></section>
    <section className="showcase-final"><div className="final-sun"><i /><i /><i /></div><p>YOUR NEXT IDEA DESERVES MOTION</p><h2>Make something<br /><em>worth watching.</em></h2><Link href="/create">Enter the studio <Arrow /></Link></section>
    <footer className="showcase-footer"><Link className="showcase-brand inverse" href="/">Motion<span>Mint</span><i /></Link><p>Animated content for every message, screen and moment.</p><div><Link href="/create">Creator</Link><a href="#possibilities">Formats</a></div><small>© {new Date().getFullYear()} MotionMint · Built to move</small></footer>
  </main>;
}
