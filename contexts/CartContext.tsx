
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Vendor, OrderType } from '@/types/database.types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartContextType {
  items: CartItem[];
  vendor: Vendor | null;
  orderType: OrderType;
  deliveryAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  deliveryInstructions: string;
  addItem: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => void;
  updateItem: (menuItemId: string, quantity: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setDeliveryAddress: (address: CartContextType['deliveryAddress']) => void;
  setDeliveryInstructions: (instructions: string) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orderType, setOrderTypeState] = useState<OrderType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<CartContextType['deliveryAddress']>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const addItem = (menuItem: MenuItem, quantity: number, specialInstructions?: string) => {
    // Check if adding from different vendor
    if (vendor && vendor.id !== menuItem.vendor_id) {
      console.log('Cannot add items from different vendors');
      // In a real app, show a modal asking if user wants to clear cart
      return;
    }

    // Set vendor if first item
    if (!vendor) {
      // In a real app, fetch vendor details
      // For now, we'll set a placeholder
      console.log('Setting vendor for cart:', menuItem.vendor_id);
    }

    const existingItemIndex = items.findIndex(item => item.menuItem.id === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity,
        specialInstructions: specialInstructions || newItems[existingItemIndex].specialInstructions,
      };
      setItems(newItems);
    } else {
      // Add new item
      setItems([...items, { menuItem, quantity, specialInstructions }]);
    }
  };

  const updateItem = (menuItemId: string, quantity: number, specialInstructions?: string) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    const newItems = items.map(item => 
      item.menuItem.id === menuItemId 
        ? { ...item, quantity, specialInstructions: specialInstructions ?? item.specialInstructions }
        : item
    );
    setItems(newItems);
  };

  const removeItem = (menuItemId: string) => {
    const newItems = items.filter(item => item.menuItem.id !== menuItemId);
    setItems(newItems);
    
    // Clear vendor if cart is empty
    if (newItems.length === 0) {
      setVendor(null);
    }
  };

  const clearCart = () => {
    setItems([]);
    setVendor(null);
    setDeliveryAddress(null);
    setDeliveryInstructions('');
  };

  const setOrderType = (type: OrderType) => {
    setOrderTypeState(type);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  };

  const getTax = () => {
    // 8.5% tax rate (can be made configurable per state)
    return getSubtotal() * 0.085;
  };

  const getDeliveryFee = () => {
    if (orderType === 'delivery') {
      return 5.99; // Flat delivery fee (can be made dynamic)
    }
    return 0;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getDeliveryFee();
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        vendor,
        orderType,
        deliveryAddress,
        deliveryInstructions,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        setOrderType,
        setDeliveryAddress,
        setDeliveryInstructions,
        getSubtotal,
        getTax,
        getDeliveryFee,
        getTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
