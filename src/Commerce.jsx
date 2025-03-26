import { useState, useEffect } from "react";
import { addToCart, getCartItems } from "./indexedDB";
import { requestBackgroundSync } from "./serviceWorkerRegistration";

const Ecommerce = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notification, setNotification] = useState(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load products
  useEffect(() => {
    fetchProducts();
    loadCartItems();
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          setNotification('Cart synchronized with server!');
          setTimeout(() => setNotification(null), 3000);
          loadCartItems();
        }
      });
    }
  }, []);

  // Request background sync when online
  useEffect(() => {
    if (isOnline) {
      requestBackgroundSync();
    }
  }, [isOnline]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}parts.json`);      
      const data = await response.json();
      setProducts(data);
      cacheProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      loadCachedProducts();
    }
  };

  const cacheProducts = async (data) => {
    if ('caches' in window) {
      const cache = await caches.open("ecommerce-cache");
      await cache.put("/products", new Response(JSON.stringify(data)));
    }
  };

  const loadCachedProducts = async () => {
    if ('caches' in window) {
      const cache = await caches.open("ecommerce-cache");
      const cachedResponse = await cache.match("/products");
      if (cachedResponse) {
        const data = await cachedResponse.json();
        setProducts(data);
      }
    }
  };

  const loadCartItems = async () => {
    try {
      const items = await getCartItems();
      setCartItems(items || []);
    } catch (error) {
      console.error("Error loading cart items:", error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
      setNotification(`${product.name} added to cart!`);
      setTimeout(() => setNotification(null), 3000);
      loadCartItems();
      
      // Request background sync if online
      if (isOnline) {
        requestBackgroundSync();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Network status indicator */}
      <div className={`fixed top-0 right-0 m-4 p-2 rounded-md ${isOnline ? 'bg-green-500' : 'bg-red-500'} text-white`}>
        {isOnline ? 'Online' : 'Offline'}
      </div>
      
      {/* Notification */}
      {notification && (
        <div className="fixed top-12 right-0 m-4 p-2 bg-blue-500 text-white rounded-md">
          {notification}
        </div>
      )}
      
      {/* Cart summary */}
      <div className="mb-4 p-4 border rounded-lg shadow-md">
        <h2 className="text-xl font-bold">Cart ({cartItems.length} items)</h2>
        {cartItems.length > 0 ? (
          <ul className="mt-2">
            {cartItems.map(item => (
              <li key={item.id} className="flex justify-between">
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Your cart is empty</p>
        )}
      </div>
      
      <h1 className="text-2xl font-bold text-center mb-4">E-Commerce Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.product_id} className="border p-4 rounded-lg shadow-lg">
            <img
              src={product.photo_url}
              alt={product.name}
              className="w-full h-48 object-contain mb-3"
            />
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-600">{product.category}</p>
            <p className="text-red-500 font-bold">${product.price}</p>
            <p className="text-sm line-through text-gray-500">${product.original_price}</p>
            <p className="text-green-600 font-semibold">{product.discount} OFF</p>
            <p className="text-sm mt-2">{product.description}</p>
            <button 
              onClick={() => handleAddToCart(product)}
              className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ecommerce;
