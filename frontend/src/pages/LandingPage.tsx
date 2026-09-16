import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
  CalendarCheck,
  Clipboard,
  Clock,
  Flame,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Reveal from "../components/Reveal";
import api from "../lib/api";

interface MenuItemImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: MenuItemImage[];
}

interface Category {
  id: number;
  categoryName: string;
  displayOrder: number;
  menuItems: MenuItem[];
}

export default function LandingPage() {
  const [dishes, setDishes] = useState<MenuItem[]>([]);

  useEffect(() => {
    api
      .get<Category[]>("/menu")
      .then(({ data }) => {
        const items = data.flatMap((category) => category.menuItems);
        setDishes(items.slice(0, 6));
      })
      .catch(() => setDishes([]));
  }, []);

  return (
    <div className="min-h-screen bg-grill-brown-dark">
      <Navbar />

      {/* Hero */}
      <section
        className="relative flex min-h-screen items-center justify-center bg-cover bg-center px-6 text-center text-white"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(20,12,8,0.55) 0%, rgba(20,12,8,0.75) 100%), url('/images/banner.webp')",
        }}
      >
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-grill-orange-light">
            BOTAHTAUNG WATERFRONT · YANGON
          </p>
          <h1 className="font-display text-6xl leading-tight">
            Fire. River.
            <br />
            <span className="italic text-grill-orange">Feast.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-white/80">
            Fresh local seafood and premium meats, grilled over open charcoal
            flame — served riverside with panoramic views of the Yangon River.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/book"
              className="rounded-md bg-grill-orange px-6 py-3 font-medium hover:bg-grill-orange-dark"
            >
              Book a Table
            </Link>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="bg-grill-brown-dark px-6 py-24 text-center text-white">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.2em] text-grill-orange">
            OUR STORY
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-5xl leading-tight">
            Where the River Meets the Grill
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-white/60">
            Perched on Yangon's Botahtaung waterfront, Ayeyarwady Grill is a
            30-table open-air BBQ restaurant where the city's Gen Z foodies,
            young professionals, and curious travellers come together over
            sizzling platters of locally-sourced seafood and premium meats —
            all grilled to order over roaring charcoal flames, with the Yangon
            River as your backdrop.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-3">
          <Reveal delayMs={0}>
            <StoryCard icon={<Flame className="h-6 w-6" />} title="Open Flame BBQ" subtitle="Charcoal-grilled perfection" />
          </Reveal>
          <Reveal delayMs={100}>
            <StoryCard icon={<Anchor className="h-6 w-6" />} title="Riverfront Views" subtitle="30 tables on the water" />
          </Reveal>
          <Reveal delayMs={200}>
            <StoryCard icon={<Users className="h-6 w-6" />} title="Social Dining" subtitle="Built for sharing" />
          </Reveal>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="bg-grill-brown px-6 py-24 text-center text-white">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.2em] text-grill-orange">
            THE MENU
          </p>
          <h2 className="mt-4 font-display text-5xl leading-tight">
            Flame-Kissed Favourites
          </h2>
          <p className="mt-4 text-white/60">
            Every dish is grilled fresh to order over natural charcoal
          </p>
        </Reveal>

        {dishes.length > 0 && (
          <div className="mx-auto mt-14 grid max-w-6xl gap-8 text-left sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish, i) => {
              const image = dish.images.find((img) => img.isPrimary) ?? dish.images[0];
              return (
                <Reveal key={dish.id} delayMs={(i % 3) * 100}>
                  <div className="overflow-hidden rounded-xl">
                    <div className="relative">
                      {image ? (
                        <img
                          src={image.imageUrl}
                          alt={dish.name}
                          className="h-56 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center bg-grill-brown-light text-white/40">
                          No image yet
                        </div>
                      )}
                      <span className="absolute bottom-3 right-3 rounded-full bg-grill-orange px-3 py-1 text-sm font-semibold text-white">
                        {Number(dish.price).toLocaleString()} MMK
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl">{dish.name}</h3>
                    {dish.description && (
                      <p className="mt-2 text-sm text-white/60">{dish.description}</p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section id="book" className="bg-grill-brown-dark px-6 py-24 text-center text-white">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.2em] text-grill-orange">
            HOW IT WORKS
          </p>
          <h2 className="mt-4 font-display text-5xl leading-tight">
            Three Simple Steps
          </h2>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-5xl gap-12 md:grid-cols-3">
          <Reveal delayMs={0}>
            <StepCard
              icon={<CalendarCheck className="h-6 w-6" />}
              title="Book Online with Deposit"
              description="Reserve your riverside table in advance with a small deposit — guaranteed seating, no waiting."
            />
          </Reveal>
          <Reveal delayMs={100}>
            <StepCard
              icon={<QrCode className="h-6 w-6" />}
              title="Or Walk In & Scan QR"
              description="No reservation? No problem. Grab a table and scan the QR code to access the full digital menu."
            />
          </Reveal>
          <Reveal delayMs={200}>
            <StepCard
              icon={<Clipboard className="h-6 w-6" />}
              title="Order & Track in Real Time"
              description="Place your order from your phone and track every dish from grill to table — live."
            />
          </Reveal>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="bg-grill-brown-dark px-6 pb-24 text-center text-white">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.2em] text-grill-orange">
            THE VIBE
          </p>
          <h2 className="mt-4 font-display text-5xl leading-tight">
            Scenes from the Grill
          </h2>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-2">
          <Reveal className="sm:col-span-2 sm:row-span-2">
            <img
              src="https://picsum.photos/seed/riverside-dining/900/900"
              alt="Riverside dining at Ayeyarwady Grill"
              className="h-full max-h-[560px] w-full rounded-xl object-cover"
            />
          </Reveal>
          <Reveal delayMs={100}>
            <img
              src="https://picsum.photos/seed/charcoal-flame/600/400"
              alt="Charcoal grill flame"
              className="h-64 w-full rounded-xl object-cover sm:h-full"
            />
          </Reveal>
          <Reveal delayMs={200}>
            <img
              src="https://picsum.photos/seed/yangon-river-sunset/600/400"
              alt="Sunset over the Yangon River"
              className="h-64 w-full rounded-xl object-cover sm:h-full"
            />
          </Reveal>
        </div>
      </section>

      {/* Find Your Table */}
      <section id="contact" className="bg-grill-brown px-6 py-24 text-center text-white">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.2em] text-grill-orange">
            VISIT US
          </p>
          <h2 className="mt-4 font-display text-5xl leading-tight">
            Find Your Table
          </h2>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl gap-10 text-left md:grid-cols-2">
          <Reveal>
            <iframe
              title="Ayeyarwady Grill location"
              className="h-80 w-full rounded-xl border-0 md:h-full"
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=96.1620%2C16.7680%2C96.1780%2C16.7800&layer=mapnik&marker=16.7740%2C96.1700"
            />
          </Reveal>

          <Reveal delayMs={100} className="space-y-8">
            <ContactRow icon={<MapPin className="h-5 w-5" />} title="Address">
              Lot 12, Botahtaung Jetty Road
              <br />
              Botahtaung Township, Yangon, Myanmar
            </ContactRow>
            <ContactRow icon={<Clock className="h-5 w-5" />} title="Opening Hours">
              Monday – Thursday: 4:00 PM – 11:00 PM
              <br />
              Friday – Sunday: 3:00 PM – 12:00 AM
              <br />
              <span className="text-grill-orange">★ Happy Hour: 4 PM – 6 PM daily</span>
            </ContactRow>
            <ContactRow icon={<Phone className="h-5 w-5" />} title="Phone">
              +95 9 765 432 100
            </ContactRow>
            <ContactRow icon={<Mail className="h-5 w-5" />} title="Email">
              hello@ayeyarwadygrill.com
            </ContactRow>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-grill-brown-dark px-6 pt-16 pb-8 text-white">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-display">
                AG
              </span>
              <span className="font-display text-lg">Ayeyarwady Grill</span>
            </div>
            <p className="mt-4 text-sm text-white/50">
              Fire-grilled seafood &amp; meats on Yangon's Botahtaung
              waterfront. Where every meal is a celebration by the river.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li><a href="#menu" className="hover:text-grill-orange-light">Menu</a></li>
              <li><a href="#gallery" className="hover:text-grill-orange-light">Gallery</a></li>
              <li><a href="#story" className="hover:text-grill-orange-light">Our Story</a></li>
              <li><a href="#book" className="hover:text-grill-orange-light">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg">Visit</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li><a href="#contact" className="hover:text-grill-orange-light">Location &amp; Hours</a></li>
              <li><Link to="/book" className="hover:text-grill-orange-light">Book a Table</Link></li>
              <li><Link to="/order" className="hover:text-grill-orange-light">Walk-In Info</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Ayeyarwady Grill. All rights reserved.</p>
          <p>Made with 🔥 in Yangon</p>
        </div>
      </footer>
    </div>
  );
}

function StoryCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-grill-orange/15 text-grill-orange">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-1 text-sm text-white/50">{subtitle}</p>
    </div>
  );
}

function StepCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-grill-orange/15 text-grill-orange">
        {icon}
      </div>
      <h3 className="mt-5 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-white/60">{description}</p>
    </div>
  );
}

function ContactRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-grill-orange/15 text-grill-orange">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-lg">{title}</h3>
        <p className="mt-1 text-sm text-white/60">{children}</p>
      </div>
    </div>
  );
}
