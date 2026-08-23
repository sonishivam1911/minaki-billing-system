import { useEffect, useState } from 'react';

/**
 * Minimal shadcn-style toast store: a module-level list + subscriber set,
 * so any component can call toast() without a context provider wrapping it.
 * <Toaster/> (rendered once near the app root) is the only subscriber that
 * actually renders anything.
 */
const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

let count = 0;
const genId = () => String(++count);

let memoryState = { toasts: [] };
const listeners = [];

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toastId ? { ...t, open: false } : t)),
      };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
    default:
      return state;
  }
}

function toast({ variant = 'default', title, description, action }) {
  const id = genId();

  const update = (props) => dispatch({ type: 'ADD_TOAST', toast: { ...props, id, open: true } });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      id,
      variant,
      title,
      description,
      action,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  setTimeout(() => {
    dismiss();
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', toastId: id }), 300);
  }, TOAST_REMOVE_DELAY);

  return { id, update, dismiss };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { ...state, toast };
}

export { useToast, toast };
