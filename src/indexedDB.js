// IndexedDB configuration
const DB_NAME = 'pwa-commerce-db';
const DB_VERSION = 1;
const CART_STORE = 'cart';
const SYNC_STORE = 'sync-operations';

// Open the database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create cart store
      if (!db.objectStoreNames.contains(CART_STORE)) {
        const cartStore = db.createObjectStore(CART_STORE, { keyPath: 'id' });
        cartStore.createIndex('product_id', 'product_id', { unique: false });
      }
      
      // Create sync operations store
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        const syncStore = db.createObjectStore(SYNC_STORE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// Add item to cart
export async function addToCart(product, quantity = 1) {
  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, 'readwrite');
    const store = tx.objectStore(CART_STORE);
    
    // Check if product already exists in cart
    const request = store.get(product.product_id);
    
    request.onsuccess = (event) => {
      const existingItem = event.target.result;
      
      if (existingItem) {
        // Update quantity
        existingItem.quantity += quantity;
        store.put(existingItem);
      } else {
        // Add new item
        store.add({
          id: product.product_id,
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          timestamp: new Date().getTime()
        });
      }
    };
    
    // Add sync operation
    await addSyncOperation({
      type: 'add-to-cart',
      product_id: product.product_id,
      quantity: quantity,
      timestamp: new Date().getTime()
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

// Get cart items
export async function getCartItems() {
  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, 'readonly');
    const store = tx.objectStore(CART_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
}

// Add sync operation
export async function addSyncOperation(operation) {
  try {
    const db = await openDB();
    const tx = db.transaction(SYNC_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_STORE);
    
    store.add(operation);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error adding sync operation:', error);
    throw error;
  }
}

// Get pending sync operations
export async function getPendingSyncOperations() {
  try {
    const db = await openDB();
    const tx = db.transaction(SYNC_STORE, 'readonly');
    const store = tx.objectStore(SYNC_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error getting pending sync operations:', error);
    throw error;
  }
}

// Clear sync operations
export async function clearSyncOperations() {
  try {
    const db = await openDB();
    const tx = db.transaction(SYNC_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_STORE);
    const request = store.clear();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error clearing sync operations:', error);
    throw error;
  }
} 