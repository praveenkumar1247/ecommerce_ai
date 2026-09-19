import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    hasStockIssue: false,
    summary: { subtotal: 0, discount: 0, offerSubtotal: 0, shippingFee: 0, tax: 0, totalAmount: 0 },
  });
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError, warning } = useToast();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || user?.role === 'ADMIN') {
      setCart({
        items: [],
        totalItems: 0,
        hasStockIssue: false,
        summary: { subtotal: 0, discount: 0, offerSubtotal: 0, shippingFee: 0, tax: 0, totalAmount: 0 },
      });
      return;
    }

    try {
      setLoading(true);
      const res = await cartApi.getCart();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      warning('Please sign in to add items to your cart.');
      return { success: false, requireAuth: true };
    }

    try {
      setLoading(true);
      const res = await cartApi.addItem(productId, quantity);
      if (res.success) {
        setCart(res.data);
        success('Added to your cart!');
        return { success: true };
      }
    } catch (err) {
      toastError(err.message || 'Failed to add item to cart.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const res = await cartApi.updateItem(cartItemId, quantity);
      if (res.success) {
        setCart(res.data);
        return { success: true };
      }
    } catch (err) {
      toastError(err.message || 'Failed to update quantity.');
      return { success: false, error: err.message };
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const res = await cartApi.removeItem(cartItemId);
      if (res.success) {
        setCart(res.data);
        success('Item removed from cart.');
        return { success: true };
      }
    } catch (err) {
      toastError(err.message || 'Failed to remove item.');
      return { success: false, error: err.message };
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      setCart({
        items: [],
        totalItems: 0,
        hasStockIssue: false,
        summary: { subtotal: 0, discount: 0, offerSubtotal: 0, shippingFee: 0, tax: 0, totalAmount: 0 },
      });
      success('Cart cleared.');
    } catch (err) {
      toastError(err.message || 'Failed to clear cart.');
    }
  };

  const validateCartStock = async () => {
    try {
      const res = await cartApi.validateCart();
      if (res.success) {
        setCart(res.data.cart);
        return res.data;
      }
    } catch (err) {
      toastError(err.message || 'Error checking stock availability.');
      return { isValid: false, issues: [] };
    }
  };

  const value = {
    cart,
    items: cart.items,
    totalItems: cart.totalItems,
    summary: cart.summary,
    hasStockIssue: cart.hasStockIssue,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    validateCartStock,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
