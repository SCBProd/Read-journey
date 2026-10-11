"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);
const api = axios.create({ baseURL: "https://readjourney.b.goit.study/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rj-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const AuthContext = createContext(null);
const AppContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const useApp = () => useContext(AppContext);
const pick = (res) => res?.data?.data ?? res?.data;
const errorText = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Something went wrong. Please try again.";
const emailRule = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <use href={`#icon-${name}`} />
    </svg>
  );
}
function IconSprite() {
  return (
    <svg
      className="icon-sprite"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <symbol id="icon-book" viewBox="0 0 24 24">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
        <path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8" />
      </symbol>
      <symbol id="icon-arrow" viewBox="0 0 24 24">
        <path d="M7 17 17 7M7 7h10v10" />
      </symbol>
      <symbol id="icon-close" viewBox="0 0 24 24">
        <path d="m18 6-12 12M6 6l12 12" />
      </symbol>
      <symbol id="icon-menu" viewBox="0 0 24 24">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </symbol>
      <symbol id="icon-search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </symbol>
      <symbol id="icon-trash" viewBox="0 0 24 24">
        <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
      </symbol>
      <symbol id="icon-plus" viewBox="0 0 24 24">
        <path d="M12 5v14m-7-7h14" />
      </symbol>
      <symbol id="icon-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </symbol>
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState(null),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState(null),
    [authReady, setAuthReady] = useState(false);
  const pathname = usePathname(),
    router = useRouter();
  const skipPrivateRedirect = useRef(false);
  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__rjToast);
    window.__rjToast = window.setTimeout(() => setToast(""), 3800);
  };
  useEffect(() => {
    const message = sessionStorage.getItem("rj-pending-toast");
    if (message) {
      sessionStorage.removeItem("rj-pending-toast");
      notify(message);
    }
  }, []);
  useEffect(() => {
    if (!localStorage.getItem("rj-token")) {
      setAuthReady(true);
      return;
    }
    api
      .get("/users/current")
      .then((r) => setUser(pick(r)?.user || pick(r)))
      .catch(() => {
        localStorage.removeItem("rj-token");
        localStorage.removeItem("rj-user");
      })
      .finally(() => setAuthReady(true));
  }, []);
  const authValue = useMemo(
    () => ({
      user,
      setUser,
      async logout() {
        skipPrivateRedirect.current = true;
        try {
          await api.post("/users/signout");
        } catch (e) {
          sessionStorage.setItem("rj-pending-toast", errorText(e));
        } finally {
          localStorage.removeItem("rj-token");
          localStorage.removeItem("rj-user");
          setUser(null);
          router.replace("/");
        }
      },
    }),
    [user],
  );
  const isPrivate = ["/recommended", "/library", "/reading"].includes(pathname);
  useEffect(() => {
    if (skipPrivateRedirect.current) {
      if (pathname === "/") skipPrivateRedirect.current = false;
      else {
        router.replace("/");
        return;
      }
    }
    if (user && ["/", "/login", "/register"].includes(pathname))
      router.replace("/recommended");
    else if (authReady && isPrivate && !localStorage.getItem("rj-token"))
      router.replace("/login");
    else if (
      ![
        "/",
        "/login",
        "/register",
        "/recommended",
        "/library",
        "/reading",
      ].includes(pathname)
    )
      router.replace("/");
  }, [user, pathname, isPrivate, authReady, router]);
  let page;
  if (pathname === "/register")
    page = user ? null : <AuthPage mode="register" />;
  else if (pathname === "/login")
    page = user ? null : <AuthPage mode="login" />;
  else if (pathname === "/recommended")
    page =
      !authReady || !user ? null : (
        <ProtectedLayout>
          <Recommended />
        </ProtectedLayout>
      );
  else if (pathname === "/library")
    page =
      !authReady || !user ? null : (
        <ProtectedLayout>
          <Library />
        </ProtectedLayout>
      );
  else if (pathname === "/reading")
    page =
      !authReady || !user ? null : (
        <ProtectedLayout>
          <Reading />
        </ProtectedLayout>
      );
  else page = user ? null : <AuthPage mode="register" />;
  return (
    <AuthContext.Provider value={authValue}>
      <AppContext.Provider value={{ notify, setModal }}>
        <IconSprite />
        {page}
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
        {modal && <Modal modal={modal} close={() => setModal(null)} />}
      </AppContext.Provider>
    </AuthContext.Provider>
  );
}

function Welcome() {
  return (
    <main className="welcome">
      <div className="welcome-top">
        <Logo />
      </div>
      <div className="welcome-grid">
        <section className="welcome-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE
          </div>
          <h1>
            Books make
            <br />
            your world <em>larger.</em>
          </h1>
          <p className="welcome-lead">Expand your mind, reading a book.</p>
          <div className="welcome-actions">
            <Link className="button button-lime" href="/register">
              Start reading <Icon name="arrow" size={18} />
            </Link>
            <Link className="button button-ghost" href="/login">
              Log In <span>↗</span>
            </Link>
          </div>
          <div className="welcome-foot">
            <div className="avatar-stack">
              <span>М</span>
              <span>О</span>
              <span>А</span>
              <span>+</span>
            </div>
            <p>
              Read at your own pace.
              <br />
              <b>Stay in your story.</b>
            </p>
          </div>
        </section>
        <div className="hero-art" aria-label="A selection of books">
          <div className="floating-note note-top">
            read a little
            <br />
            every day <span>✳</span>
          </div>
          <div className="book-hero book-hero-one">
            <small>
              THE ART OF
              <br />
              SLOW LIVING
            </small>
            <span>01</span>
          </div>
          <div className="book-hero book-hero-two">
            <small>
              NOTES FROM
              <br />
              THE GARDEN
            </small>
            <span>02</span>
          </div>
          <div className="book-hero book-hero-three">
            <small>
              THE QUIET
              <br />
              HOURS
            </small>
            <span>03</span>
          </div>
          <div className="hero-orbit" />
          <div className="floating-note note-bottom">
            <span>✳</span> one more
            <br />
            page tonight
          </div>
          <div className="art-sticker">
            BOOKS
            <br />
            OPEN
            <br />
            WORLDS
          </div>
        </div>
      </div>
    </main>
  );
}
function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Read Journey home">
      <img src="/Logo.svg" width="182" height="17" alt="Read Journey" />
    </Link>
  );
}

const authSchema = (mode) =>
  yup.object({
    ...(mode === "register"
      ? { name: yup.string().trim().required("Enter your name") }
      : {}),
    email: yup
      .string()
      .trim()
      .required("Enter your email")
      .email("Enter a valid email address"),
    password: yup
      .string()
      .required("Enter your password")
      .min(7, "Password must contain at least 7 characters"),
  });
function AuthPage({ mode }) {
  const isReg = mode === "register",
    { setUser } = useAuth(),
    { notify } = useApp(),
    router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(authSchema(mode)) });
  const submit = async (values) => {
    try {
      const r = await api.post(
        isReg ? "/users/signup" : "/users/signin",
        values,
      );
      const data = pick(r);
      const token = data?.token || data?.accessToken || data?.user?.token;
      const me = data?.user || data;
      if (token) localStorage.setItem("rj-token", token);
      else if (data?.token) localStorage.setItem("rj-token", data.token);
      localStorage.setItem("rj-user", JSON.stringify(me));
      setUser(me);
      notify(
        isReg
          ? "Account created. Welcome to Read Journey!"
          : "You are signed in. Happy reading!",
      );
      router.push("/recommended");
    } catch (e) {
      notify(errorText(e));
    }
  };
  return (
    <main className="auth-shell">
      <section className="auth-left">
        <Logo />
        <div className="auth-message">
          <h1>
            Expand your
            <br />
            mind, reading
            <br />
            <span>a book</span>
          </h1>
        </div>
        <div className="auth-card">
          <form
            onSubmit={handleSubmit(submit)}
            className="form-stack"
            noValidate
          >
            {isReg && (
              <Field
                label="Name"
                placeholder="Ilona Ratushniak"
                error={errors.name?.message}
                {...register("name")}
              />
            )}
            <Field
              label="Mail"
              placeholder="Your@email.com"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Field
              label="Password"
              placeholder="Yourpasswordhere"
              type="password"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="auth-submit-row">
              <button
                className="button button-dark submit-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Loading…" : isReg ? "Registration" : "Log In"}
              </button>
              <Link
                className="auth-switch"
                href={isReg ? "/login" : "/register"}
              >
                {isReg
                  ? "Already have an account? Log In"
                  : "Don’t have an account? Registration"}
              </Link>
            </div>
          </form>
        </div>
      </section>
      <section className="auth-preview" aria-label="Read Journey app preview">
        <img
          className="auth-phone-image"
          src="/iphone-15-black.png"
          alt="Read Journey mobile app displayed on an iPhone"
        />
      </section>
    </main>
  );
}
const Field = React.forwardRef(({ label, error, ...props }, ref) => (
  <label className={`field ${error ? "field-error" : ""}`}>
    <span>{label}</span>
    <input ref={ref} {...props} />
    {error && <small>{error}</small>}
  </label>
));

function ProtectedLayout({ children }) {
  return (
    <>
      <Header />
      <main className="app-main">{children}</main>
    </>
  );
}

function Header() {
  const { user, logout } = useAuth(),
    [open, setOpen] = useState(false),
    pathname = usePathname();
  const name = user?.name || user?.username || "Reader";
  return (
    <header
      className={`header ${pathname === "/library" ? "header-library" : ""}`}
    >
      <div className="header-inner">
        <Logo />
        <button
          className="menu-toggle"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "close" : "menu"} size={23} />
        </button>
        <nav className={`main-nav ${open ? "nav-open" : ""}`}>
          <Link
            onClick={() => setOpen(false)}
            className={pathname === "/recommended" ? "active" : ""}
            href="/recommended"
          >
            Home
          </Link>
          <Link
            onClick={() => setOpen(false)}
            className={pathname === "/library" ? "active" : ""}
            href="/library"
          >
            My library
          </Link>
        </nav>
        <div className="user-controls">
          <div className="user-profile">
            <span className="user-avatar">
              {String(name)[0]?.toUpperCase()}
            </span>
            <span>{name}</span>
          </div>
          <button className="logout-button" onClick={logout}>
            Log out <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ children, variant = "", promo }) {
  return (
    <aside className={`dashboard ${variant}`}>
      <div className="dash-section">{children}</div>
      {promo || (
        <section className="dash-promo">
          <h2>Start your workout</h2>
          <ol className="workout-steps">
            <li>
              <b>1</b>
              <p>
                Create a personal library:{" "}
                <span>add the books you intend to read to it.</span>
              </p>
            </li>
            <li>
              <b>2</b>
              <p>
                Create your first workout:{" "}
                <span>define a goal, choose a period, start training.</span>
              </p>
            </li>
          </ol>
          <Link href="/library">
            My library <Icon name="arrow" size={17} />
          </Link>
        </section>
      )}
      {!["library-dashboard", "reading-dashboard"].includes(variant) && (
        <blockquote className="quote">
          <span className="quote-icon" aria-hidden="true">
            📚
          </span>
          <p>
            “Books are windows to the world, and reading is a journey into the
            unknown.”
          </p>
        </blockquote>
      )}
    </aside>
  );
}
const bookSchema = yup.object({
  title: yup.string().trim().required("Enter the book title"),
  author: yup.string().trim().required("Enter the author"),
  totalPages: yup
    .number()
    .typeError("Enter the number of pages")
    .integer("Enter a whole number")
    .positive("Enter a number greater than zero")
    .required("Enter the number of pages"),
});
function AddBookForm({ onAdded }) {
  const { notify, setModal } = useApp(),
    {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
    } = useForm({ resolver: yupResolver(bookSchema) });
  const submit = async (values) => {
    try {
      await api.post("/books/add", {
        ...values,
        totalPages: Number(values.totalPages),
      });
      reset();
      onAdded?.();
      setModal({
        type: "success",
        title: "Good job",
        text: `Your book is now in the library! The joy knows no bounds and now you can start reading.`,
        action: "Good job",
      });
    } catch (e) {
      notify(errorText(e));
    }
  };
  return (
    <form noValidate className="add-book-form" onSubmit={handleSubmit(submit)}>
      <div className="section-eyebrow">NEW BOOK</div>
      <h3>Create your library</h3>
      <Field
        label="Book title"
        placeholder="Enter text"
        error={errors.title?.message}
        {...register("title")}
      />
      <Field
        label="The author"
        placeholder="Enter text"
        error={errors.author?.message}
        {...register("author")}
      />
      <Field
        label="Number of pages"
        placeholder="0"
        type="number"
        min="1"
        error={errors.totalPages?.message}
        {...register("totalPages")}
      />
      <button
        className="button button-dark full-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Adding…" : "Add book"} <Icon name="arrow" size={16} />
      </button>
    </form>
  );
}
function Recommended() {
  const router = useRouter(),
    [search, setSearch] = useState(""),
    params = useMemo(() => new URLSearchParams(search), [search]),
    { notify, setModal } = useApp(),
    [books, setBooks] = useState([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ title: "", author: "" });
  const limit = 10;
  useEffect(() => {
    setSearch(window.location.search);
  }, []);
  useEffect(() => {
    setPage(Number(params.get("page")) || 1);
    setFilters({
      title: params.get("title") || "",
      author: params.get("author") || "",
    });
  }, [params]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get("/books/recommend", {
        params: {
          title: params.get("title") || "",
          author: params.get("author") || "",
          page,
          limit,
        },
      })
      .then((r) => {
        if (!alive) return;
        const d = pick(r) || {};
        setBooks(d.results || d.books || []);
        setTotal(
          d.totalPages ||
            Math.ceil((d.total || (d.results || []).length) / limit),
        );
      })
      .catch((e) => notify(errorText(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, params]);
  const updateSearch = (next) => {
    const query = new URLSearchParams(next);
    setSearch(`?${query.toString()}`);
    router.replace(`/recommended?${query.toString()}`, { scroll: false });
  };
  const submit = (e) => {
    e.preventDefault();
    setPage(1);
    updateSearch({
      title: filters.title.trim(),
      author: filters.author.trim(),
      page: "1",
    });
  };
  const canGoBack = page > 1,
    canGoForward = books.length >= limit && (!total || page < total);
  const changePage = (nextPage) => {
    setPage(nextPage);
    updateSearch({ ...Object.fromEntries(params), page: String(nextPage) });
  };
  return (
    <div className="page-layout">
      <Dashboard>
        <form onSubmit={submit} className="filter-form">
          <div className="section-eyebrow">Filters:</div>
          <h3>Filters</h3>
          <label className="field">
            <span>Book title:</span>
            <input
              placeholder="Enter text"
              value={filters.title}
              onChange={(e) =>
                setFilters({ ...filters, title: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>The author:</span>
            <input
              placeholder="Enter text"
              value={filters.author}
              onChange={(e) =>
                setFilters({ ...filters, author: e.target.value })
              }
            />
          </label>
          <button className="button button-dark full-button">To apply</button>
        </form>
      </Dashboard>
      <section className="content-panel">
        <div className="content-heading">
          <div>
            <div className="section-eyebrow">RECOMMENDED FOR YOU</div>
            <h1>Recommended</h1>
          </div>
          <div className="heading-controls">
            <button
              type="button"
              aria-label="Previous recommendations"
              disabled={!canGoBack}
              onClick={() => changePage(page - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next recommendations"
              disabled={!canGoForward}
              onClick={() => changePage(page + 1)}
            >
              ›
            </button>
          </div>
        </div>
        <div className="book-grid">
          {loading ? (
            <Loading />
          ) : books.length ? (
            books.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onClick={() =>
                  setModal({ type: "book", book, action: "Add to library" })
                }
              />
            ))
          ) : (
            <Empty text="No books match these filters. Try another search." />
          )}
        </div>
        <Pagination
          page={page}
          total={total}
          setPage={changePage}
          limit={limit}
          count={books.length}
        />
      </section>
    </div>
  );
}
function optimizedCover(url) {
  if (!url || !url.includes("res.cloudinary.com"))
    return { src: url, srcSet: undefined };
  const src = url.replace(
    "/image/upload/",
    "/image/upload/f_auto,q_auto,w_360/",
  );
  const retina = url.replace(
    "/image/upload/",
    "/image/upload/f_auto,q_auto,w_720/",
  );
  return { src, srcSet: `${src} 1x, ${retina} 2x` };
}
function BookCard({ book, onClick, onRemove, status }) {
  const cover = optimizedCover(book.imageUrl);
  return (
    <article className="book-card">
      <button
        className="cover-button"
        onClick={onClick}
        aria-label={`Book details ${book.title}`}
      >
        <div className="book-cover">
          {book.imageUrl ? (
            <img
              src={cover.src}
              srcSet={cover.srcSet}
              sizes="(max-width: 767px) 45vw, (max-width: 1023px) 28vw, 18vw"
              alt={`Book cover ${book.title}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="cover-placeholder">
              <img
                className="cover-placeholder-books"
                src="/books-placeholder.svg"
                alt=""
              />
              <span>
                READ
                <br />
                JOURNEY
              </span>
              <b>{book.title}</b>
              <small>{book.author}</small>
            </div>
          )}
          <span className="cover-arrow">
            <Icon name="arrow" size={14} />
          </span>
        </div>
      </button>
      <div className="book-info">
        <h3>{book.title}</h3>
        <p>{book.author}</p>
      </div>
      {status && (
        <div className="book-status">
          <i />{" "}
          {status === "done"
            ? "Done"
            : status === "in-progress"
              ? "In progress"
              : "Unread"}
        </div>
      )}
      {onRemove && (
        <button
          className="remove-book"
          onClick={onRemove}
          aria-label={`Delete ${book.title}`}
        >
          <Icon name="trash" size={17} />
        </button>
      )}
    </article>
  );
}
function Pagination({ page, total, setPage, limit, count }) {
  const max = total || (count < limit ? page : page + 1);
  return (
    <div className="pagination">
      <span>
        Page <b>{page}</b>
        {max > 1 ? ` of ${max}` : ""}
      </span>
      <div>
        <button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          ←
        </button>
        <button
          aria-label="Next page"
          disabled={count < limit || (total && page >= total)}
          onClick={() => setPage(page + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <span />
      Loading books…
    </div>
  );
}
function Empty({ text, icon = "spark" }) {
  return (
    <div className={`empty-state ${icon === "books" ? "empty-books" : ""}`}>
      <span>
        {icon === "books" ? <img src="/books-placeholder.svg" alt="" /> : "✳"}
      </span>
      <p>{text}</p>
    </div>
  );
}

function LibraryRecommendations({ books, loading, onSelect }) {
  return (
    <section className="library-recommendations">
      <h2>Recommended books</h2>
      <div className="book-grid">
        {loading ? (
          <Loading />
        ) : books.length ? (
          books
            .slice(0, 3)
            .map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onClick={() => onSelect(book)}
              />
            ))
        ) : (
          <Empty icon="books" text="No additional recommendations right now." />
        )}
      </div>
      <Link className="library-home-link" href="/recommended">
        Home <Icon name="arrow" size={18} />
      </Link>
    </section>
  );
}
function Library() {
  const [status, setStatus] = useState(""),
    [books, setBooks] = useState([]),
    [loading, setLoading] = useState(true),
    [recommended, setRecommended] = useState([]),
    [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const { notify, setModal } = useApp();
  const load = () => {
    setLoading(true);
    api
      .get("/books/own", { params: status ? { status } : {} })
      .then((r) => {
        const d = pick(r);
        setBooks(Array.isArray(d) ? d : d?.results || []);
      })
      .catch((e) => notify(errorText(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [status]);
  useEffect(() => {
    let alive = true;
    api
      .get("/books/recommend", { params: { page: 1, limit: 5 } })
      .then((r) => {
        if (!alive) return;
        const d = pick(r) || {};
        setRecommended(d.results || d.books || (Array.isArray(d) ? d : []));
      })
      .catch((e) => {
        if (alive) notify(errorText(e));
      })
      .finally(() => alive && setRecommendationsLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  const remove = async (id) => {
    try {
      await api.delete(`/books/remove/${id}`);
      notify("Book removed from your library.");
      load();
    } catch (e) {
      notify(errorText(e));
    }
  };
  const ownedIds = new Set(books.map((book) => book._id));
  const recommendedToShow = recommended
    .filter((book) => !ownedIds.has(book._id))
    .slice(0, 5);
  const recommendationsPanel = (
    <LibraryRecommendations
      books={recommendedToShow}
      loading={recommendationsLoading}
      onSelect={(book) =>
        setModal({ type: "book", book, action: "Add to library" })
      }
    />
  );
  return (
    <div className="page-layout">
      <Dashboard variant="library-dashboard" promo={recommendationsPanel}>
        <AddBookForm onAdded={load} />
      </Dashboard>
      <section className="content-panel library-main-panel">
        <div className="content-heading">
          <div>
            <div className="section-eyebrow">YOUR PERSONAL COLLECTION</div>
            <h1>
              My <em>library</em>
            </h1>
          </div>
          <label className="select-wrap">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All books</option>
              <option value="unread">Unread</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>
        <div className="book-grid">
          {loading ? (
            <Loading />
          ) : books.length ? (
            books.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                status={book.status}
                onRemove={() => remove(book._id)}
                onClick={() =>
                  setModal({
                    type: "book",
                    book,
                    action: "Start reading",
                    library: true,
                  })
                }
              />
            ))
          ) : (
            <div className="library-empty-state">
              <span aria-hidden="true">
                <img src="/books-placeholder.svg" alt="" />
              </span>
              <p>
                To start training, add some of your books or
                <br className="desktop-break" /> from the recommended ones
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Reading() {
  const [book, setBook] = useState(null),
    [progress, setProgress] = useState([]),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState(""),
    [busy, setBusy] = useState(false),
    [id, setId] = useState(""),
    [tab, setTab] = useState("diary");
  const { notify, setModal } = useApp();
  useEffect(() => {
    setId(
      new URLSearchParams(window.location.search).get("id") ||
        localStorage.getItem("rj-reading-book") ||
        "",
    );
  }, []);
  const applyBookList = (response) => {
    const d = pick(response),
      all = Array.isArray(d) ? d : d?.results || [];
    const selected =
      (id ? all.find((b) => b._id === id) : null) ||
      (!id ? all.find((b) => b.status === "in-progress") || all[0] : null) ||
      null;
    setBook(selected);
    setProgress(Array.isArray(selected?.progress) ? selected.progress : []);
    return selected;
  };
  const load = () => {
    setLoading(true);
    api
      .get("/books/own")
      .then(applyBookList)
      .then(() => setPage(""))
      .catch((e) => notify(errorText(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [id]);
  const active =
    progress.find((p) => p.status === "active") ||
    (book?.status === "in-progress"
      ? [...progress].reverse().find((p) => !p.finishReading && !p.finishPage)
      : null);
  const hasReadPages = progress.some(
    (p) => p.finishPage && p.finishPage >= (p.startPage || 1),
  );
  const currentPage = Math.max(
    0,
    ...progress.map((p) => Number(p.finishPage) || 0),
  );
  const progressPercent = book?.totalPages
    ? Math.min(100, Math.round((currentPage / book.totalPages) * 100))
    : 0;
  const submit = async (e) => {
    e.preventDefault();
    if (!book) return;
    const pageNum = Number(page),
      totalPages = Number(book.totalPages);
    if (
      !Number.isInteger(pageNum) ||
      pageNum < 1 ||
      !Number.isInteger(totalPages) ||
      totalPages < 1 ||
      pageNum > totalPages
    ) {
      notify(`Enter a page number from 1 to ${totalPages || "the last page"}.`);
      return;
    }
    if (active && active.startPage && pageNum < active.startPage) {
      notify(`Stop page must be at least ${active.startPage}.`);
      return;
    }
    setBusy(true);
    try {
      await api.post(
        active ? "/books/reading/finish" : "/books/reading/start",
        { id: book._id, page: pageNum },
      );
      setPage("");
      try {
        applyBookList(await api.get("/books/own"));
      } catch {
        notify(
          "Reading was saved, but the latest details could not be refreshed.",
        );
      }
      if (active && pageNum === totalPages)
        setModal({
          type: "success",
          title: "The book is read",
          text: `Congratulations! “${book.title}” is another finished story.`,
          action: "Good job",
        });
    } catch (e) {
      notify(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const deleteEvent = async (event) => {
    try {
      await api.delete("/books/reading", {
        params: { bookId: book._id, readingId: event._id },
      });
      notify("Reading entry deleted.");
    } catch (e) {
      notify(errorText(e));
      return;
    }
    try {
      applyBookList(await api.get("/books/own"));
    } catch (e) {
      notify(
        `Entry deleted, but the latest details could not be refreshed. ${errorText(e)}`,
      );
    }
  };
  if (loading)
    return (
      <div className="reading-empty">
        <Loading />
      </div>
    );
  if (!book)
    return (
      <div className="reading-empty">
        <Empty
          icon="books"
          text="Add a book to your library before you start reading."
        />
        <Link className="button button-dark" href="/library">
          My library <Icon name="arrow" size={16} />
        </Link>
      </div>
    );
  const progressPanel = hasReadPages ? (
    <section className="reading-details-panel">
      <div className="reading-detail-heading">
        <h2>{tab === "diary" ? "Diary" : "Statistics"}</h2>
        <div className="reading-detail-tabs">
          <button
            type="button"
            aria-label="Diary"
            aria-pressed={tab === "diary"}
            className={tab === "diary" ? "selected" : ""}
            onClick={() => setTab("diary")}
          >
            <img src="/hourglass.svg" alt="" />
          </button>
          <button
            type="button"
            aria-label="Statistics"
            aria-pressed={tab === "statistics"}
            className={tab === "statistics" ? "selected" : ""}
            onClick={() => setTab("statistics")}
          >
            <img src="/tort.svg" alt="" />
          </button>
        </div>
      </div>
      {tab === "diary" ? (
        <Diary
          progress={progress}
          totalPages={book.totalPages}
          onDelete={deleteEvent}
        />
      ) : (
        <Statistics progress={progress} book={book} />
      )}
    </section>
  ) : (
    <section className="reading-progress-panel">
      <h2>Progress</h2>
      <p>
        Here you will see when and how much you read.
        <br />
        To record, click on the red button above.
      </p>
      <div className="reading-star" aria-hidden="true">
        🌟
      </div>
    </section>
  );
  const remainingPages = Math.max(0, (book.totalPages || 0) - currentPage),
    speeds = progress
      .map(
        (item) =>
          Number(item.pagesPerHour ?? item.readingSpeed ?? item.speed) || 0,
      )
      .filter((value) => value > 0),
    averageSpeed = speeds.length
      ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length
      : 0,
    minutesLeft = averageSpeed
      ? Math.round((remainingPages / averageSpeed) * 60)
      : null;
  return (
    <div className="page-layout reading-layout">
      <Dashboard variant="reading-dashboard" promo={progressPanel}>
        <div className="reading-form">
          <div className="section-eyebrow">
            {active ? "Stop page:" : "Start page:"}
          </div>
          <form id="reading-form" noValidate onSubmit={submit}>
            <label className="field reading-page-field">
              <span>Page number:</span>
              <input
                aria-label="Page number"
                type="number"
                min="1"
                max={book.totalPages}
                placeholder="0"
                value={page}
                onChange={(e) => setPage(e.target.value)}
              />
            </label>
            <button className="button button-dark full-button" disabled={busy}>
              {busy ? "Saving…" : active ? "To stop" : "To start"}
            </button>
          </form>
        </div>
      </Dashboard>
      <section className="content-panel reading-panel">
        <div className="reading-panel-head">
          <h1 className="reading-page-title">My reading</h1>
          {hasReadPages && tab === "statistics" && minutesLeft !== null && (
            <span>
              {Math.floor(minutesLeft / 60)} hours and {minutesLeft % 60}{" "}
              minutes left
            </span>
          )}
        </div>
        <div className="reading-hero">
          <div className="reading-cover">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={`Cover of ${book.title}`} />
            ) : (
              <div className="cover-placeholder">
                <img
                  className="cover-placeholder-books"
                  src="/books-placeholder.svg"
                  alt=""
                />
                <b>{book.title}</b>
                <small>{book.author}</small>
              </div>
            )}
          </div>
          <h2>{book.title}</h2>
          <p>{book.author}</p>
          {(active || book.status === "in-progress") && (
            <div className="reading-status">
              <i />
              In progress
            </div>
          )}
          <button
            className={`reading-record-button ${active ? "is-active" : ""}`}
            type="submit"
            form="reading-form"
            aria-label={
              active ? "Finish reading session" : "Start reading session"
            }
            title={active ? "Finish reading session" : "Start reading session"}
            disabled={busy}
          >
            <span />
          </button>
        </div>
      </section>
    </div>
  );
}
function Diary({ progress, totalPages, onDelete }) {
  const finished = progress.filter((p) => p.finishReading || p.finishPage);
  if (!finished.length)
    return (
      <Empty text="Your reading history will appear here once you start." />
    );
  const events = finished
    .slice()
    .sort(
      (a, b) => new Date(b.finishReading || 0) - new Date(a.finishReading || 0),
    );
  const dayKey = (event) => {
    const date = new Date(event.finishReading || Date.now());
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };
  const groups = events.reduce((all, event) => {
    const key = dayKey(event),
      group = all.find((item) => item.key === key);
    if (group) group.events.push(event);
    else
      all.push({
        key,
        date: new Date(event.finishReading || Date.now()),
        events: [event],
      });
    return all;
  }, []);
  const getSpeed = (event) => {
    const reported =
      Number(event.pagesPerHour ?? event.readingSpeed ?? event.speed) || 0;
    if (reported) return reported;
    const pages = Number(
      event.pagesRead ??
        event.pages ??
        (event.finishPage || 0) - (event.startPage || 0) + 1,
    );
    const minutes = event.readingTime
      ? event.readingTime / 60000
      : event.startReading && event.finishReading
        ? (new Date(event.finishReading) - new Date(event.startReading)) / 60000
        : 0;
    return minutes > 0 ? Math.round((pages * 60) / minutes) : 0;
  };
  return (
    <div className="reading-events">
      {groups.map((group, i) => {
        const dailyPages = group.events.reduce(
          (sum, event) =>
            sum +
            Number(
              event.pagesRead ??
                event.pages ??
                (event.finishPage || 0) - (event.startPage || 0) + 1,
            ),
          0,
        );
        return (
          <article
            className={`reading-event ${i === 0 ? "is-latest" : ""}`}
            key={group.key}
          >
            <div className="reading-event-heading">
              <span className="reading-event-check" aria-hidden="true" />
              <b>
                {group.date.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </b>
              <span>{dailyPages} pages</span>
            </div>
            <div className="reading-event-sessions">
              {group.events.map((event, j) => {
                const pages = Number(
                  event.pagesRead ??
                    event.pages ??
                    (event.finishPage || 0) - (event.startPage || 0) + 1,
                );
                const elapsed = event.readingTime
                  ? Math.max(1, Math.round(event.readingTime / 60000))
                  : event.startReading && event.finishReading
                    ? Math.max(
                        1,
                        Math.round(
                          (new Date(event.finishReading) -
                            new Date(event.startReading)) /
                            60000,
                        ),
                      )
                    : 0;
                const speed = getSpeed(event),
                  percent = Math.min(
                    100,
                    ((event.finishPage || 0) / (totalPages || 1)) * 100,
                  ),
                  percentLabel = percent.toLocaleString("en-US", {
                    maximumFractionDigits: 1,
                  });
                return (
                  <div className="reading-event-data" key={event._id || j}>
                    <div>
                      <strong>{percentLabel}%</strong>
                      <small>
                        {elapsed ? `${elapsed} minutes` : "Time unavailable"}
                      </small>
                    </div>
                    <div className="reading-event-speed">
                      <svg
                        viewBox="0 0 46 18"
                        role="img"
                        aria-label={`Reading speed: ${speed || 0} pages per hour`}
                      >
                        <path d="M2 15L16 12L28 8L44 4" />
                      </svg>
                      <button
                        type="button"
                        aria-label="Delete reading entry"
                        onClick={() => onDelete(event)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                      <small>
                        {speed
                          ? `${speed} pages per hour`
                          : "Speed unavailable"}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
function Statistics({ progress, book }) {
  const currentPage = Math.max(
      0,
      ...progress.map((p) => Number(p.finishPage) || 0),
    ),
    total = Number(book?.totalPages) || 0,
    percent = total ? Math.min(100, (currentPage / total) * 100) : 0,
    displayPercent = percent.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    });
  if (!progress.some((p) => Number(p.finishPage) > 0))
    return (
      <Empty text="Reading statistics will appear after your first session." />
    );
  return (
    <div className="reading-statistics">
      <p>
        Each page, each chapter is a new round of knowledge, a new step towards
        understanding. By rewriting statistics, we create our own reading
        history.
      </p>
      <div
        className="statistics-ring"
        style={{ "--read-progress": `${percent}%` }}
      >
        <div>{displayPercent}%</div>
      </div>
      <div className="statistics-total">
        <i />
        <div>
          <b>{displayPercent}%</b>
          <span>{currentPage} pages read</span>
        </div>
      </div>
    </div>
  );
}

function Modal({ modal, close }) {
  const { notify } = useApp(),
    router = useRouter();
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [close]);
  const book = modal.book;
  const isLibraryBook = Boolean(modal.library);
  const actionLabel = isLibraryBook ? "Start reading" : "Add to library";
  const act = async () => {
    if (modal.type === "success") {
      close();
      return;
    }
    if (!isLibraryBook) {
      try {
        await api.post(`/books/add/${book._id}`);
        notify("Book added to your library.");
        close();
      } catch (e) {
        notify(errorText(e));
      }
    } else {
      localStorage.setItem("rj-reading-book", book._id);
      close();
      router.push(`/reading?id=${book._id}`);
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        className={`modal ${modal.type === "success" ? "success-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button className="modal-close" aria-label="Close" onClick={close}>
          <Icon name="close" />
        </button>
        {modal.type === "success" ? (
          <>
            <div className="success-icon" aria-hidden="true">
              👍
            </div>
            <div className="section-eyebrow">READ JOURNEY</div>
            <h2 id="modal-title">{modal.title}</h2>
            <p>{modal.text}</p>
            <button className="button button-dark full-button" onClick={act}>
              {modal.action} <Icon name="arrow" size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="modal-book-cover">
              {book.imageUrl ? (
                <img src={book.imageUrl} alt={`Cover of ${book.title}`} />
              ) : (
                <div className="cover-placeholder">
                  <img
                    className="cover-placeholder-books"
                    src="/books-placeholder.svg"
                    alt=""
                  />
                  <b>{book.title}</b>
                  <small>{book.author}</small>
                </div>
              )}
            </div>
            <div className="modal-copy">
              <div className="section-eyebrow">BOOK DETAILS</div>
              <h2 id="modal-title" title={book.title}>
                {book.title}
              </h2>
              <p className="modal-author">{book.author}</p>
              <div className="modal-meta">
                <span>{book.totalPages || "—"} pages</span>
              </div>
              {book.description && (
                <p className="book-description">{book.description}</p>
              )}
              <button className="button button-dark full-button" onClick={act}>
                {actionLabel}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
