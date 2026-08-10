import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const API = {
  product: "http://localhost:8000",
  cart: "http://localhost:8001",
  auth: "http://localhost:8002",
  payment: "http://localhost:8003",
};

const USER_ID = 1;

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const [activeCollection, setActiveCollection] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  // =========================
  // LOAD PRODUCTS
  // =========================

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API.product}/products`);

      if (!response.ok) {
        throw new Error("Products unavailable");
      }

      const data = await response.json();

      const productList = Array.isArray(data)
        ? data
        : data.products || [];

      setProducts(productList);
    } catch (error) {
      console.error(error);
      setMessage("Product service unavailable");
    }
  };

  // =========================
  // LOAD CART
  // =========================

  const loadCart = async () => {
    try {
      const response = await fetch(`${API.cart}/cart/${USER_ID}`);

      if (!response.ok) {
        throw new Error("Cart unavailable");
      }

      const data = await response.json();

      setCart(data.items || []);
    } catch (error) {
      console.error(error);
      setMessage("Cart service unavailable");
    }
  };

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  // =========================
  // REGISTER
  // =========================

  const register = async () => {
    if (!username || !password) {
      setMessage("Username and password required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API.auth}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Registration failed");
        return;
      }

      setMessage("Registration successful. Now login.");
    } catch (error) {
      console.error(error);
      setMessage("Auth service unavailable");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================

  const login = async () => {
    if (!username || !password) {
      setMessage("Username and password required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API.auth}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Login failed");
        return;
      }

      setLoggedIn(true);
      setMessage(`Login successful. Welcome ${data.username}!`);

      await loadCart();
    } catch (error) {
      console.error(error);
      setMessage("Auth service unavailable");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    setLoggedIn(false);
    setMessage("Logged out successfully");
  };

  // =========================
  // PRODUCT CATEGORY
  // =========================

  const getCategory = (product) => {
    const text = `${product.name || ""} ${
      product.description || ""
    }`.toLowerCase();

    if (
      text.includes("shoe") ||
      text.includes("sneaker")
    ) {
      return "Men";
    }

    if (
      text.includes("women") ||
      text.includes("bag") ||
      text.includes("dress")
    ) {
      return "Women";
    }

    return "Collection";
  };

  // =========================
  // FILTER PRODUCTS
  // =========================

  const filteredProducts = useMemo(() => {
    if (activeCollection === "All") {
      return products;
    }

    return products.filter(
      (product) =>
        getCategory(product) === activeCollection
    );
  }, [products, activeCollection]);

  // =========================
  // ADD TO CART
  // =========================

  const addToCart = async (
    productId,
    quantity = 1
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        user_id: String(USER_ID),
        product_id: String(productId),
        quantity: String(quantity),
      });

      const response = await fetch(
        `${API.cart}/cart?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Unable to add product"
        );
        return;
      }

      setMessage("Product added to cart 🛒");

      await loadCart();

      setSelectedProduct(null);
      setSelectedQuantity(1);
    } catch (error) {
      console.error(error);
      setMessage("Cart service unavailable");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // REMOVE CART ITEM
  // =========================

  const removeFromCart = async (productId) => {
    try {
      const response = await fetch(
        `${API.cart}/cart/${USER_ID}/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Unable to remove item"
        );
        return;
      }

      setMessage("Product removed from cart");

      await loadCart();
    } catch (error) {
      console.error(error);
      setMessage("Cart service unavailable");
    }
  };

  // =========================
  // CART COUNT
  // =========================

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  // =========================
  // CART TOTAL
  // =========================

  const cartTotal = cart.reduce(
    (total, item) => {
      const product = products.find(
        (p) => p.id === item.product_id
      );

      return (
        total +
        (Number(product?.price) || 0) *
          Number(item.quantity || 0)
      );
    },
    0
  );

  // =========================
  // PAYMENT
  // =========================

  const makePayment = async () => {
    if (cart.length === 0) {
      setMessage("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API.payment}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: USER_ID,
            amount: cartTotal,
            currency: "INR",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Payment failed"
        );
        return;
      }

      setMessage(
        `Payment successful! Payment ID: ${data.payment_id}`
      );
    } catch (error) {
      console.error(error);
      setMessage("Payment service unavailable");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OPEN PRODUCT
  // =========================

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
  };

  // =========================
  // NAVIGATION
  // =========================

  const goTo = (id) => {
    setMenuOpen(false);

    setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 50);
  };

  const collectionClick = (collection) => {
    setActiveCollection(collection);
    setMenuOpen(false);

    setTimeout(() => {
      document
        .getElementById("collections")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 50);
  };

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="navbar">

        <div
          className="brand"
          onClick={() => goTo("home")}
        >
          QuantumShop
        </div>

        <button
          className="menu-button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
        >
          ☰
        </button>

        <nav
          className={`nav-links ${
            menuOpen ? "show" : ""
          }`}
        >
          <button
            onClick={() => goTo("home")}
          >
            Home
          </button>

          <button
            onClick={() =>
              collectionClick("All")
            }
          >
            Collections
          </button>

          <button
            onClick={() =>
              collectionClick("Men")
            }
          >
            Men
          </button>

          <button
            onClick={() =>
              collectionClick("Women")
            }
          >
            Women
          </button>

          <button
            onClick={() => goTo("about")}
          >
            About
          </button>

          <button
            onClick={() => goTo("contact")}
          >
            Contact
          </button>
        </nav>

        <div className="nav-actions">

          <button
            className="cart-nav"
            onClick={() => goTo("cart")}
          >
            🛒
            <span>{cartCount}</span>
          </button>

          <div className="profile">
            {loggedIn
              ? username.charAt(0).toUpperCase()
              : "G"}
          </div>

        </div>
      </header>

      {/* =========================
          MESSAGE
      ========================= */}

      {message && (
        <div className="message">
          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {/* =========================
          HERO
      ========================= */}

      <main>

        <section
          id="home"
          className="hero"
        >

          <div className="hero-content">

            <span className="eyebrow">
              QUANTUMSHOP COLLECTION
            </span>

            <h1>
              Shop the latest.
              <br />
              <strong>Wear your style.</strong>
            </h1>

            <p>
              Discover premium products,
              modern essentials and everyday
              styles made for you.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-button"
                onClick={() =>
                  collectionClick("All")
                }
              >
                Explore Collection
              </button>

              <button
                className="secondary-button"
                onClick={() => goTo("cart")}
              >
                View Cart
              </button>

            </div>

          </div>

          <div className="hero-card">

            <div className="hero-emoji">
              👟
            </div>

            <div>
              <span>FEATURED</span>

              <h3>
                New Season
              </h3>

              <p>
                Fresh styles are here.
              </p>
            </div>

          </div>

        </section>

        {/* =========================
            ACCOUNT
        ========================= */}

        <section className="account-section">

          <div className="section-title">
            <span>YOUR ACCOUNT</span>
            <h2>Account</h2>
          </div>

          {!loggedIn ? (

            <div className="auth-box">

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                onClick={login}
                disabled={loading}
              >
                Login
              </button>

              <button
                className="outline-button"
                onClick={register}
                disabled={loading}
              >
                Register
              </button>

            </div>

          ) : (

            <div className="logged-user">

              <div>
                <span className="check">
                  ✓
                </span>

                Logged in as{" "}
                <strong>{username}</strong>
              </div>

              <button
                className="logout-button"
                onClick={logout}
              >
                Logout
              </button>

            </div>

          )}

        </section>

        {/* =========================
            COLLECTIONS
        ========================= */}

        <section
          id="collections"
          className="products-section"
        >

          <div className="section-heading">

            <div>
              <span className="eyebrow">
                OUR COLLECTION
              </span>

              <h2>
                Featured Products
              </h2>
            </div>

            <div className="collection-filters">

              {[
                "All",
                "Men",
                "Women",
              ].map((collection) => (
                <button
                  key={collection}
                  className={
                    activeCollection ===
                    collection
                      ? "active-filter"
                      : ""
                  }
                  onClick={() =>
                    setActiveCollection(
                      collection
                    )
                  }
                >
                  {collection}
                </button>
              ))}

            </div>

          </div>

          {filteredProducts.length === 0 ? (

            <div className="empty-products">
              No products found.
            </div>

          ) : (

            <div className="products">

              {filteredProducts.map(
                (product) => (

                  <article
                    className="product-card"
                    key={product.id}
                    onClick={() =>
                      openProduct(product)
                    }
                  >

                    <div className="product-image">

                      <span>
                        {product.emoji ||
                          "🛍️"}
                      </span>

                      <div className="quick-view">
                        View Product
                      </div>

                    </div>

                    <div className="product-info">

                      <span className="category">
                        {getCategory(product)}
                      </span>

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.description}
                      </p>

                      <div className="product-bottom">

                        <strong>
                          ₹
                          {Number(
                            product.price || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            addToCart(
                              product.id
                            );
                          }}
                        >
                          + Cart
                        </button>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

        {/* =========================
            ABOUT
        ========================= */}

        <section
          id="about"
          className="info-section"
        >

          <div>
            <span className="eyebrow">
              ABOUT QUANTUMSHOP
            </span>

            <h2>
              Simple shopping.
              <br />
              Better experience.
            </h2>
          </div>

          <p>
            QuantumShop is a cloud-native
            e-commerce application designed
            with separate product, cart,
            authentication and payment
            services.
          </p>

        </section>

        {/* =========================
            CART
        ========================= */}

        <section
          id="cart"
          className="cart-section"
        >

          <div className="section-heading">

            <div>
              <span className="eyebrow">
                YOUR SHOPPING BAG
              </span>

              <h2>
                Shopping Cart
              </h2>
            </div>

            <strong>
              {cartCount} items
            </strong>

          </div>

          {cart.length === 0 ? (

            <div className="empty-cart">
              <div>🛒</div>

              <h3>
                Your cart is empty
              </h3>

              <p>
                Add some products to get started.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  goTo("collections")
                }
              >
                Start Shopping
              </button>
            </div>

          ) : (

            <>

              <div className="cart-list">

                {cart.map((item, index) => {

                  const product =
                    products.find(
                      (p) =>
                        p.id ===
                        item.product_id
                    );

                  return (
                    <div
                      className="cart-item"
                      key={`${item.product_id}-${index}`}
                    >

                      <div className="cart-product">

                        <div className="cart-image">
                          {product?.emoji ||
                            "🛍️"}
                        </div>

                        <div>
                          <h3>
                            {product?.name ||
                              `Product ${item.product_id}`}
                          </h3>

                          <p>
                            Quantity:{" "}
                            {item.quantity}
                          </p>
                        </div>

                      </div>

                      <strong>
                        ₹
                        {(
                          (Number(
                            product?.price
                          ) || 0) *
                          Number(
                            item.quantity
                          )
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <button
                        className="remove-button"
                        onClick={() =>
                          removeFromCart(
                            item.product_id
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>
                  );
                })}

              </div>

              <div className="cart-summary">

                <span>
                  Total
                </span>

                <strong>
                  ₹
                  {cartTotal.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <button
                className="payment-button"
                onClick={makePayment}
                disabled={loading}
              >
                💳 Pay ₹
                {cartTotal.toLocaleString(
                  "en-IN"
                )}
              </button>

            </>

          )}

        </section>

        {/* =========================
            CONTACT
        ========================= */}

        <section
          id="contact"
          className="contact-section"
        >

          <div>
            <span className="eyebrow">
              GET IN TOUCH
            </span>

            <h2>
              Contact QuantumShop
            </h2>

            <p>
              Need help with your order?
              We're here to help.
            </p>
          </div>

          <div className="contact-cards">

            <div>
              <span>📧</span>
              <strong>Email</strong>
              <p>
                support@quantumshop.local
              </p>
            </div>

            <div>
              <span>📞</span>
              <strong>Support</strong>
              <p>
                Available 24/7
              </p>
            </div>

          </div>

        </section>

      </main>

      {/* =========================
          PRODUCT DETAILS MODAL
      ========================= */}

      {selectedProduct && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedProduct(null)
          }
        >

          <div
            className="product-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close-modal"
              onClick={() =>
                setSelectedProduct(null)
              }
            >
              ×
            </button>

            <div className="modal-image">

              {selectedProduct.emoji ||
                "🛍️"}

            </div>

            <div className="modal-content">

              <span className="category">
                {getCategory(
                  selectedProduct
                )}
              </span>

              <h2>
                {selectedProduct.name}
              </h2>

              <p className="modal-description">
                {selectedProduct.description}
              </p>

              <div className="modal-price">
                ₹
                {Number(
                  selectedProduct.price || 0
                ).toLocaleString("en-IN")}
              </div>

              <div className="quantity-row">

                <span>
                  Quantity
                </span>

                <div className="quantity-control">

                  <button
                    onClick={() =>
                      setSelectedQuantity(
                        Math.max(
                          1,
                          selectedQuantity - 1
                        )
                      )
                    }
                  >
                    −
                  </button>

                  <strong>
                    {selectedQuantity}
                  </strong>

                  <button
                    onClick={() =>
                      setSelectedQuantity(
                        selectedQuantity + 1
                      )
                    }
                  >
                    +
                  </button>

                </div>

              </div>

              <button
                className="modal-cart-button"
                onClick={() =>
                  addToCart(
                    selectedProduct.id,
                    selectedQuantity
                  )
                }
                disabled={loading}
              >
                🛒 Add to Cart
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="footer">

        <div>
          <strong>
            QuantumShop
          </strong>

          <p>
            Smart Shopping Experience
          </p>
        </div>

        <span>
          © 2026 QuantumShop
        </span>

      </footer>

    </div>
  );
}

export default App;
