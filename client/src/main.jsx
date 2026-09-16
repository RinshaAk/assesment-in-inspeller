import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function App() {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem("catalog-session");
    return raw ? JSON.parse(raw) : null;
  });
  const [view, setView] = useState(session ? "products" : "login");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], itemCount: 0, total: 0 });
  const [filters, setFilters] = useState({ search: "", minPrice: "", maxPrice: "", sort: "" });
  const [status, setStatus] = useState({ loading: false, error: "", notice: "" });
  const [cartFeedback, setCartFeedback] = useState({});

  const isAdmin = session?.user.role === "admin";

  const api = async (path, options = {}) => {
    const { auth = true, ...fetchOptions } = options;
    let response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...(auth && session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
          ...fetchOptions.headers
        }
      });
    } catch {
      throw new Error("API server is not reachable. Start the backend with npm run dev and check MONGO_URL in .env.");
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "Request failed");
    return data;
  };

  const saveSession = (nextSession) => {
    setSession(nextSession);
    if (nextSession) localStorage.setItem("catalog-session", JSON.stringify(nextSession));
    else localStorage.removeItem("catalog-session");
  };

  const loadProducts = async () => {
    setStatus((current) => ({ ...current, loading: true, error: "" }));
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ""));
      const query = params.toString();
      const data = await api(`/products${query ? `?${query}` : ""}`, { auth: false });
      setProducts(data.products);
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  };

  const loadCart = async () => {
    if (!session) return;
    try {
      setCart(await api("/cart"));
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters.search, filters.minPrice, filters.maxPrice, filters.sort]);

  useEffect(() => {
    loadCart();
  }, [session?.token]);

  const flash = (notice) => {
    setStatus((current) => ({ ...current, notice, error: "" }));
    window.setTimeout(() => setStatus((current) => ({ ...current, notice: "" })), 2200);
  };

  const loginOrRegister = async (mode, values) => {
    setStatus({ loading: true, error: "", notice: "" });
    try {
      const data = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify(values) });
      saveSession(data);
      setView("products");
      flash(mode === "login" ? "Welcome back." : "Account created.");
    } catch (error) {
      setStatus({ loading: false, error: error.message, notice: "" });
    }
  };

  const logout = () => {
    saveSession(null);
    setCart({ items: [], itemCount: 0, total: 0 });
    setView("login");
  };

  const addToCart = async (product) => {
    if (!session) {
      setView("login");
      setStatus((current) => ({ ...current, error: "Please log in before adding items to your cart." }));
      return;
    }
    setCartFeedback((current) => ({ ...current, [product.id]: "adding" }));
    try {
      setCart(await api("/cart", { method: "POST", body: JSON.stringify({ productId: product.id, quantity: 1 }) }));
      setCartFeedback((current) => ({ ...current, [product.id]: "added" }));
      flash(`${product.name} added to cart.`);
      window.setTimeout(() => {
        setCartFeedback((current) => ({ ...current, [product.id]: undefined }));
      }, 1200);
    } catch (error) {
      setCartFeedback((current) => ({ ...current, [product.id]: undefined }));
      setStatus((current) => ({ ...current, error: error.message, notice: "" }));
    }
  };

  const updateCartItem = async (item, quantity) => {
    try {
      setCart(await api(`/cart/${item.id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }));
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  };

  const removeCartItem = async (item) => {
    try {
      await api(`/cart/${item.id}`, { method: "DELETE" });
      await loadCart();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  };

  const createProduct = async (payload) => {
    try {
      await api("/products", { method: "POST", body: JSON.stringify(payload) });
      await loadProducts();
      flash("Product saved.");
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  };

  const updateProduct = async (product, changes) => {
    try {
      await api(`/products/${product.id}`, { method: "PATCH", body: JSON.stringify(changes) });
      await loadProducts();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  };

  const deleteProduct = async (product) => {
    try {
      await api(`/products/${product.id}`, { method: "DELETE" });
      await loadProducts();
      await loadCart();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("products")}>Catalog Cart</button>
        <nav>
          <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}>Products</button>
          {session && <button className={view === "cart" ? "active" : ""} onClick={() => setView("cart")}>Cart ({cart.itemCount})</button>}
          {isAdmin && <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>Admin</button>}
          {session ? <button onClick={logout}>Logout</button> : <button onClick={() => setView("login")}>Login</button>}
        </nav>
      </header>

      <main>
        <section className="summary-band">
          <div>
            <p className="eyebrow">Full stack assessment</p>
            <h1>Product catalog and account-owned cart</h1>
          </div>
          <div className="account-pill">
            {session ? `${session.user.name} - ${session.user.role}` : "Guest browsing"}
          </div>
        </section>

        {status.error && <div className="alert error">{status.error}</div>}
        {status.notice && <div className="alert success">{status.notice}</div>}

        {view === "login" && <AuthPanel loading={status.loading} onSubmit={loginOrRegister} />}
        {view === "products" && (
          <ProductsView
            filters={filters}
            setFilters={setFilters}
            products={products}
            loading={status.loading}
            onAdd={addToCart}
            cartFeedback={cartFeedback}
          />
        )}
        {view === "cart" && session && <CartView cart={cart} onUpdate={updateCartItem} onRemove={removeCartItem} />}
        {view === "admin" && isAdmin && (
          <AdminView products={products} onCreate={createProduct} onUpdate={updateProduct} onDelete={deleteProduct} />
        )}
      </main>
    </div>
  );
}

function AuthPanel({ loading, onSubmit }) {
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "" });

  const submit = (event) => {
    event.preventDefault();
    const payload = mode === "register" ? values : { email: values.email, password: values.password };
    onSubmit(mode, payload);
  };

  return (
    <section className="auth-panel">
      <div className="segmented">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
      </div>
      <form onSubmit={submit}>
        {mode === "register" && (
          <label>Name<input required minLength="2" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
        )}
        <label>Email<input required type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label>
        <label>Password<input required minLength="8" type="password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} /></label>
        <button className="primary" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</button>
      </form>
      <p className="hint">Admin access is available for reviewers.</p>
    </section>
  );
}

function ProductsView({ filters, setFilters, products, loading, onAdd, cartFeedback }) {
  return (
    <>
      <section className="filters">
        <input placeholder="Search products" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <input type="number" min="0" placeholder="Min price" value={filters.minPrice} onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })} />
        <input type="number" min="0" placeholder="Max price" value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })} />
        <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
          <option value="">Sort</option>
          <option value="price-asc">Price low to high</option>
          <option value="price-desc">Price high to low</option>
          <option value="name">Name</option>
        </select>
      </section>
      {loading && <div className="empty-state">Loading products...</div>}
      {!loading && products.length === 0 && <div className="empty-state">No products match the current filters.</div>}
      <section className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <img src={product.image} alt={product.name} />
            <div className="product-body">
              <p>{product.category}</p>
              <h2>{product.name}</h2>
              <div className="product-meta">
                <strong>{currency.format(product.price)}</strong>
                <span className={product.stock === 0 ? "out" : ""}>{product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}</span>
              </div>
              <button
                className={`primary ${cartFeedback[product.id] === "added" ? "added" : ""}`}
                disabled={product.stock === 0 || cartFeedback[product.id] === "adding"}
                onClick={() => onAdd(product)}
              >
                {product.stock === 0
                  ? "Unavailable"
                  : cartFeedback[product.id] === "adding"
                    ? "Adding..."
                    : cartFeedback[product.id] === "added"
                      ? "Added"
                      : "Add to cart"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function CartView({ cart, onUpdate, onRemove }) {
  if (cart.items.length === 0) return <div className="empty-state">Your cart is empty.</div>;
  return (
    <section className="cart-layout">
      <div className="cart-items">
        {cart.items.map((item) => (
          <article className="cart-row" key={item.id}>
            <img src={item.product.image} alt={item.product.name} />
            <div>
              <h2>{item.product.name}</h2>
              <p>{currency.format(item.product.price)} each</p>
            </div>
            <div className="qty">
              <button disabled={item.quantity <= 1} onClick={() => onUpdate(item, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button disabled={item.quantity >= item.product.stock} onClick={() => onUpdate(item, item.quantity + 1)}>+</button>
            </div>
            <strong>{currency.format(item.lineTotal)}</strong>
            <button className="danger" onClick={() => onRemove(item)}>Remove</button>
          </article>
        ))}
      </div>
      <aside className="cart-total">
        <p>{cart.itemCount} items</p>
        <h2>{currency.format(cart.total)}</h2>
      </aside>
    </section>
  );
}

function AdminView({ products, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState({ name: "", category: "", price: "", stock: "", image: "" });
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products]);

  const submit = (event) => {
    event.preventDefault();
    onCreate(form);
    setForm({ name: "", category: "", price: "", stock: "", image: "" });
  };

  return (
    <section className="admin-layout">
      <form className="admin-form" onSubmit={submit}>
        <h2>Add product</h2>
        {["name", "category", "price", "stock", "image"].map((field) => (
          <label key={field}>{field}<input required value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>
        ))}
        <button className="primary">Save product</button>
        <p className="hint">Existing categories: {categories.join(", ")}</p>
      </form>
      <div className="admin-list">
        {products.map((product) => (
          <article className="admin-row" key={product.id}>
            <span>{product.name}</span>
            <input type="number" min="0" value={product.price} onChange={(event) => onUpdate(product, { price: event.target.value })} />
            <input type="number" min="0" value={product.stock} onChange={(event) => onUpdate(product, { stock: event.target.value })} />
            <button className="danger" onClick={() => onDelete(product)}>Delete</button>
          </article>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
