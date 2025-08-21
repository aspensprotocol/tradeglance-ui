import { useEffect } from 'react';

// Declare Materialize as global
declare global {
  interface Window {
    M: {
      AutoInit: () => void;
      FormSelect: { init: (elements: NodeListOf<Element>, options?: unknown) => void };
      Modal: { init: (elements: NodeListOf<Element>, options?: unknown) => void };
      Tooltip: { init: (elements: NodeListOf<Element>, options?: unknown) => void };
      Dropdown: { init: (elements: NodeListOf<Element>, options?: unknown) => void };
      Sidenav: { init: (elements: NodeListOf<Element>, options?: unknown) => void };
      [key: string]: { init: (elements: NodeListOf<Element>, options?: unknown) => void } | (() => void);
    };
  }
}

// Hook to initialize Materialize components
export const useMaterialize = () => {
  useEffect(() => {
    // Ensure Materialize is available
    if (typeof window !== 'undefined' && window.M) {
      // Initialize all Materialize components
      window.M.AutoInit();
      
      // Initialize specific components that might need manual init
      const selects = document.querySelectorAll('select');
      if (selects.length > 0) {
        window.M.FormSelect.init(selects);
      }

      const modals = document.querySelectorAll('.modal');
      if (modals.length > 0) {
        window.M.Modal.init(modals);
      }

      const tooltips = document.querySelectorAll('.tooltipped');
      if (tooltips.length > 0) {
        window.M.Tooltip.init(tooltips);
      }

      const dropdowns = document.querySelectorAll('.dropdown-trigger');
      if (dropdowns.length > 0) {
        window.M.Dropdown.init(dropdowns);
      }

      const sidenav = document.querySelectorAll('.sidenav');
      if (sidenav.length > 0) {
        window.M.Sidenav.init(sidenav);
      }
    }
  }, []);
};

// Utility function to initialize specific Materialize component
export const initMaterializeComponent = (selector: string, component: string, options: unknown = {}) => {
  if (typeof window !== 'undefined' && window.M) {
    const elements = document.querySelectorAll(selector);
    const componentRef = window.M[component];
    if (elements.length > 0 && componentRef && typeof componentRef === 'object' && 'init' in componentRef) {
      componentRef.init(elements, options);
    }
  }
};

// Common Materialize classes for easy reuse
export const materializeClasses = {
  // Colors
  colors: {
    primary: 'teal',
    secondary: 'blue-grey',
    accent: 'amber',
    error: 'red',
    warning: 'orange',
    success: 'green',
    info: 'blue',
  },
  
  // Buttons
  button: {
    base: 'btn',
    raised: 'btn',
    flat: 'btn-flat',
    floating: 'btn-floating',
    large: 'btn-large',
    small: 'btn-small',
  },
  
  // Cards
  card: {
    base: 'card',
    panel: 'card-panel',
    content: 'card-content',
    title: 'card-title',
    action: 'card-action',
  },
  
  // Forms
  form: {
    field: 'input-field',
    select: 'browser-default', // or leave empty for material select
    label: 'active',
    validate: 'validate',
  },
  
  // Layout
  layout: {
    container: 'container',
    row: 'row',
    col: 'col',
    section: 'section',
    divider: 'divider',
  },
  
  // Navigation
  nav: {
    base: 'nav-wrapper',
    brand: 'brand-logo',
    links: 'right',
    mobile: 'sidenav',
  },
  
  // Collections
  collection: {
    base: 'collection',
    item: 'collection-item',
    header: 'collection-header',
  },
  
  // Utilities
  utils: {
    center: 'center-align',
    left: 'left-align',
    right: 'right-align',
    hide: 'hide',
    show: 'show',
    truncate: 'truncate',
  },
};

// Helper function to combine Tailwind and Materialize classes
export const combinedClasses = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};